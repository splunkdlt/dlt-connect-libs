# Build & Publish Container GitHub Action

GitHub action to build and publish docker images in a standardized way.

Images are first published to a pre-release namespace for every commit. When a release is cut, the image is copied to the release namespace and tagged with the version number as well as "latest". Finally the action updates the release description to point to the container package.

## Example Usage

### Pre-release

```yaml
- uses: splunkdlt/dlt-connect-libs/actions/build-publish-container@actions
    with:
        publish-type: pre-release
        ghcr-user: ${{secrets.GHCR_SERVICE_USER}}
        ghcr-pat: ${{secrets.GHCR_SERVICE_PAT}}
```

### Release

```yaml
- uses: splunkdlt/dlt-connect-libs/actions/build-publish-container@actions
    with:
        publish-type: release
        ghcr-user: ${{secrets.GHCR_SERVICE_USER}}
        ghcr-pat: ${{secrets.GHCR_SERVICE_PAT}}
        github-token: ${{secrets.RELEASE_GITHUB_TOKEN}}
```
