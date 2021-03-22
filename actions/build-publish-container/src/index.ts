/* eslint-disable no-console */
import * as core from '@actions/core';
import { context } from '@actions/github';
import fetch from 'node-fetch';
import { buildPrereleaseDockerImage, tagAndPushReleaseImage } from './docker';
import { sh } from './exec';
import { findPackageInfoWithVersionTag, image, tagged } from './ghcr';
import { getCommitVersionTag } from './tag';

type InputKey =
    | 'publish-type'
    | 'ghcr-org'
    | 'ghcr-pre-release-name'
    | 'ghcr-release-name'
    | 'ghcr-user'
    | 'ghcr-pat'
    | 'github-token';

const getInput = (key: InputKey, options?: { required: boolean }): string => core.getInput(key, options);
const hasInput = (key: InputKey): boolean => core.getInput(key) != null;

export async function main(args: string[]) {
    core.setCommandEcho(true);

    const githubOrg = context.repo.owner;
    const repoName = context.repo.repo;
    const commitSHA = process.env.GITHUB_SHA!;

    const releaseType = getInput('publish-type', { required: true });
    const ghcr = {
        org: getInput('ghcr-org') || githubOrg,
        pkgName: getInput('ghcr-release-name') || repoName,
        prereleasePkgName: getInput('ghcr-pre-release-name') || `${repoName}-pre`,
        user: getInput('ghcr-user', { required: true }),
        pat: getInput('ghcr-pat', { required: true }),
    };
    const githubToken = getInput('github-token') || ghcr.pat;

    console.log('Performing build and push of type=%s for commit sha=%s', releaseType, commitSHA);

    console.log(`Logging in to ghcr.io docker registry as user=${ghcr.user}`);
    await sh('docker', 'login', 'ghcr.io', '-u', ghcr.user, '-p', ghcr.pat);

    if (!(releaseType === 'pre-release' || releaseType === 'release')) {
        throw new Error(`Invalid release type: ${JSON.stringify(releaseType)}. Expected "release" or "pre-release".`);
    }

    const img = await buildPrereleaseDockerImage(ghcr.org, ghcr.prereleasePkgName, commitSHA);

    core.setOutput('image', img);

    if (releaseType !== 'release') {
        return;
    }

    const versionTag = await getCommitVersionTag(commitSHA, { tagPrefix: 'v' });

    if (versionTag == null) {
        return;
    }

    console.log(`Performing post-release steps for tag ${versionTag.tag}`);
    console.log(`Version: ${versionTag.version}`);
    console.log(`Commit SHA: ${commitSHA})`);

    if (versionTag.isLatest) {
        console.log(`Version ${versionTag.tag} is the latest version, will also apply the "latest" tag`);
    }

    const publishImageVersions = async (targetImage: string) => {
        console.log('Publishing', targetImage);
        if (!versionTag.semver.prerelease?.length) {
            if (versionTag.isLatest) {
                console.log(`${versionTag.tag} is the latest release`);
                await tagAndPushReleaseImage(img, targetImage, 'latest');
            }
            await tagAndPushReleaseImage(img, targetImage, String(versionTag.semver.major));
            await tagAndPushReleaseImage(img, targetImage, `${versionTag.semver.major}.${versionTag.semver.minor}`);
            await tagAndPushReleaseImage(img, targetImage, versionTag.semver.version);
        } else {
            await tagAndPushReleaseImage(img, targetImage, versionTag.semver.version);
        }
    };

    await publishImageVersions(image(ghcr.org, ghcr.pkgName));

    // TODO optionally publish to docker hub

    const bullet = (prefix: string, title: string, href: string) => `- ${prefix}: [${title}](${href})`;
    const pkgInfo = await findPackageInfoWithVersionTag({
        version: versionTag.semver.version,
        org: ghcr.org,
        pkg: ghcr.pkgName,
        githubToken,
    });
    const packageInfoMd = [
        '### Packages',
        '',
        bullet(
            'Docker image',
            tagged(image(ghcr.org, ghcr.pkgName), versionTag.version),
            pkgInfo?.html_url ?? `https://github.com/orgs/${ghcr.org}/packages/container/package/${ghcr.pkgName}`
        ),
    ].join('\n');

    const releaseInfo = await fetch(
        `https://api.github.com/repos/${githubOrg}/${repoName}/releases/tags/${encodeURIComponent(versionTag.tag)}`,
        {
            headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.everest-preview+json',
            },
        }
    ).then((res) =>
        res.status > 299
            ? Promise.reject(new Error(`Failed to fetch release info: HTTP status ${res.status}`))
            : res.json()
    );

    const body: string = releaseInfo.body;
    const start = body.indexOf('<!-- PACKAGES -->');
    const end = body.indexOf('<!-- PACKAGES-END -->');

    const newBody =
        start < 0
            ? `${body}\n\n<!-- PACKAGES -->\n${packageInfoMd}\n<!-- PACKAGES-END -->`
            : [
                  body.slice(0, start),
                  '<!-- PACKAGES -->',
                  '\n',
                  packageInfoMd,
                  '\n',
                  end < 0 ? '' : body.slice(end),
              ].join('\n');

    console.log('Updating release description');

    await fetch(releaseInfo.url, {
        method: 'PATCH',
        headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.everest-preview+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: newBody }),
    });
}

main(process.argv.slice(2)).catch((e) => {
    console.error(e);
    process.exit(1);
});
