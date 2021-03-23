import { sh } from './exec';
import { commitTagged, image, tagged } from './ghcr';

export async function buildPrereleaseDockerImage(org: string, pkg: string, commitSha: string): Promise<string> {
    let latestPrereleasePulled = false;
    try {
        console.log('Pulling latest prerelease package to use as --cache-from');
        await sh('docker', 'pull', tagged(image(org, pkg), 'latest'));
        latestPrereleasePulled = true;
    } catch (e) {
        console.log('Failed to pull latest prerelease image');
    }
    const img = commitTagged(image(org, pkg), commitSha);
    const buildArgs = ['--build-arg', `DOCKER_BUILD_GIT_COMMIT=${commitSha}`, '-t', img];
    if (latestPrereleasePulled) {
        buildArgs.push('--cache-from');
        buildArgs.push(tagged(image(org, pkg), 'latest'));
    }
    await sh('docker', 'build', ...buildArgs, '.');
    await sh('docker', 'push', img);
    return img;
}

export async function tagAndPushReleaseImage(srcImg: string, targetImage: string, tag: string) {
    const releaseImg = tagged(targetImage, tag);
    await sh('docker', 'tag', srcImg, releaseImg);
    await sh('docker', 'push', releaseImg);
}
