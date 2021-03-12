import { getOctokit } from '@actions/github';

export const image = (org: string, pkg: string) => `ghcr.io/${org}/${pkg}`;
export const tagged = (image: string, tag: string) => `${image}:${tag}`;
export const commitTag = (commitSHA: string) => `commit-${commitSHA}`;
export const commitTagged = (image: string, commitSHA: string) => tagged(image, commitTag(commitSHA));

export type PackageInfo = {
    id: number;
    name: string;
    url: string;
    package_html_url: string;
    created_at: string;
    updated_at: string;
    html_url: string;
    metadata: {
        package_type: string;
        container: {
            tags: string[];
        };
    };
};

export async function findPackageInfoWithVersionTag({
    version,
    org,
    pkg,
    githubToken,
}: {
    version: string;
    org: string;
    pkg: string;
    githubToken: string;
}): Promise<PackageInfo | null> {
    const octokit = getOctokit(githubToken);
    console.log(`Looking for package info of container package tagged with version=${version}`);
    const fetchPage = (page: number) =>
        octokit.request('GET /orgs/{org}/packages/{package_type}/{package_name}/versions?per_page=100&page={page}', {
            package_type: 'container',
            package_name: pkg,
            org,
            page,
        });
    for (let page = 1; ; page++) {
        const response = await fetchPage(page);
        if (response.status > 299) {
            throw new Error(
                `Unable to locate package version: GitHub API responded with HTTP status ${response.status}`
            );
        }
        const data: PackageInfo[] = response.data;
        if (!Array.isArray(data)) {
            throw new Error('Unexpected response from GitHub API');
        }

        if (data.length === 0) {
            break;
        }

        const match = data.find((pkg) => pkg.metadata.container.tags.includes(version));
        if (match != null) {
            return match;
        }
    }
    return null;
}
