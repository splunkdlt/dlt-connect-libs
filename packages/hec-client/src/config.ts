import { Metadata } from './types';
import { WaitTime } from '@splunkdlt/async-tasks';

const CONFIG_DEFAULTS = {
    token: null,
    defaultMetadata: {},
    defaultFields: {},
    maxQueueEntries: -1,
    maxQueueSize: 512_000,
    flushTime: 0,
    gzip: true,
    maxRetries: Infinity,
    timeout: 30_000,
    requestKeepAlive: true,
    validateCertificate: true,
    maxSockets: 256,
    userAgent: 'splunk-hec-client/1.0',
    retryWaitTime: 10_000,
    multipleMetricFormatEnabled: false,
};

/** Settings for the Splunk HTTP Event Collector client */
export interface HecConfig {
    /** The URL of HEC. If only the base URL is specified (path is omitted) then the default path will be used */
    url?: string;
    /** The HEC token used to authenticate HTTP requests */
    token?: string;
    /**
     * Defaults for host, source, sourcetype and index. Can be overriden for each message
     * @see [Use variables in metadata](#metadata-variables)
     */
    defaultMetadata?: Metadata;
    /**
     * Default set of fields to apply to all events and metrics sent with this HEC client
     * @see [Use variables in metadata](#metadata-variables)
     */
    defaultFields?: { [k: string]: any };
    /** Maximum number of entries in the HEC message queue before flushing it */
    maxQueueEntries?: number;
    /** Maximum number of bytes in the HEC message queue before flushing it */
    maxQueueSize?: number;
    /** Maximum number of milliseconds to wait before flushing the HEC message queue */
    flushTime?: number; // DurationConfig;
    /** Gzip compress the request body sent to HEC (Content-Encoding: gzip) */
    gzip?: boolean;
    /** Maximum number of attempts to send a batch to HEC. By default this there is no limit */
    maxRetries?: number;
    /** Number of milliseconds to wait before considereing an HTTP request as failed */
    timeout?: number; // DurationConfig;
    /** Set to `false` to disable HTTP keep-alive for connections to Splunk */
    requestKeepAlive?: boolean;
    /** If set to false, the HTTP client will ignore certificate errors (eg. when using self-signed certs) */
    validateCertificate?: boolean;
    /** Maximum number of sockets HEC will use (per host) */
    maxSockets?: number;
    /** User-agent header sent to HEC
     * @default `splunk-hec-client/1.0`
     * @see [Use variables in metadata](#metadata-variables)
     */
    userAgent?: string;
    /** Wait time before retrying to send a (batch of) HEC messages after an error */
    retryWaitTime?: WaitTime;
    /**
     * Enable sending multipe metrics in a single message to HEC.
     * Supported as of Splunk 8.0.0
     *
     * https://docs.splunk.com/Documentation/Splunk/8.0.0/Metrics/GetMetricsInOther#The_multiple-metric_JSON_format
     */
    multipleMetricFormatEnabled?: boolean;
}

export type CookedHecConfig = Required<HecConfig>;

export function parseHecConfig(config: HecConfig): CookedHecConfig {
    const url = new URL(config.url!);
    if (url.pathname === '' || url.pathname === '/') {
        url.pathname = '/services/collector/event/1.0';
    }
    return {
        ...CONFIG_DEFAULTS,
        ...config,
        url: url.href,
        token: config.token ?? '',
    };
}
