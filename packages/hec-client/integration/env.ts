export function versionSupportsMultiMetrics(splunkVersion: string = ''): boolean {
    if (!splunkVersion.trim()) {
        return false;
    }
    const major = parseInt(splunkVersion.split('.')[0], 10);
    if (isNaN(major)) {
        throw new Error(`Invalid Splunk version ${splunkVersion}`);
    }
    return major >= 8;
}

const GH_ACTIONS_SPLUNK = {
    name: `Splunk ${process.env.SPLUNK_VERSION}`,
    splunkdUrl: process.env.SPLUNK_SPLUNKD_URL!,
    hecUrl: process.env.SPLUNK_HEC_URL!,
    multiMetrics: versionSupportsMultiMetrics(process.env.SPLUNK_VERSION),
};

const LOCAL_SPLUNK = {
    name: 'Local Splunk',
    splunkdUrl: 'https://localhost:8089',
    hecUrl: 'https://localhost:8088',
    multiMetrics: true,
};

export const SPLUNK_INFO = process.env.CI ? GH_ACTIONS_SPLUNK : LOCAL_SPLUNK;

export function checkEnv() {
    const { splunkdUrl, hecUrl, name } = SPLUNK_INFO;
    if (splunkdUrl == null) {
        throw new Error(`Missing splunkd URL for ${name} in environment`);
    }
    if (hecUrl == null) {
        throw new Error(`Missing HEC URL for ${name} in environment`);
    }
}
