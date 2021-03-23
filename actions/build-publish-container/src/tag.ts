import { parse as parseSemver, rcompare, SemVer } from 'semver';
import execa from 'execa';
import { warning } from '@actions/core';

export type VersionInfo = {
    semver: SemVer;
    version: string;
    tag: string;
    isLatest: boolean;
};

function latestVersion(tags: string[], prefix: string): string {
    const sorted = [...tags].map((t) => t.slice(prefix.length)).sort(rcompare);
    return sorted[0];
}

export async function getCommitVersionTag(
    commitSHA: string,
    { tagPrefix = 'v' }: { tagPrefix: string }
): Promise<VersionInfo | null> {
    console.log('Looking for release tag');
    const tags = (await execa('git', ['tag', '-l', '--points-at', commitSHA])).stdout
        .split('\n')
        .filter((t) => t.startsWith(tagPrefix));

    if (tags.length === 0) {
        console.log('HEAD is not tagged with a new version. Skipping post-release.');
        return null;
    }

    if (tags.length > 1) {
        warning(`HEAD was tagged with multiple ${tagPrefix}* tags. Using the latest one.`);
    }

    const tag = latestVersion(tags, tagPrefix);
    if (tag == null) {
        throw new Error(`Invalid tag ${tag}`);
    }

    const semver = parseSemver(tag);

    if (semver == null) {
        throw new Error(`Unable to parse version tag ${tag}`);
    }
    const allTags = (await execa('git', ['tag', '--list', `${tagPrefix}*`])).stdout.split('\n');
    const isLatestVersion = !semver.prerelease?.length && tag === latestVersion(allTags, tagPrefix);

    return {
        semver,
        tag: tagPrefix + tag,
        version: semver.version,
        isLatest: isLatestVersion,
    };
}
