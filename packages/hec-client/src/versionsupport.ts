/**
 * Determines whether the given Splunk version supports the multi-metrics format,
 * so basically checks if the given version string is >= "8.0"
 */
export function versionSupportsMultiMetrics(splunkVersion: string | null | undefined): boolean {
    if (splunkVersion == null || !splunkVersion.trim()) {
        return false;
    }
    const major = parseInt(splunkVersion.split('.')[0], 10);
    if (isNaN(major)) {
        throw new Error(`Invalid Splunk version ${splunkVersion}`);
    }
    return major >= 8;
}
