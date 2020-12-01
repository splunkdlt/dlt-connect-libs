import { retry, RetryOptions } from '@splunkdlt/async-tasks';
import { createModuleDebug } from '@splunkdlt/debug-logging';
import { Agent as HttpsAgent } from 'https';
import fetch, { Response } from 'node-fetch';
import { ParserOptions, parseText } from './parser';
import { Metric } from './types';

const { debug, info, error } = createModuleDebug('@splunkdlt/prometheus-scraper:scrape');

const ACCEPT_HEADER = 'text/plain;version=0.0.4;q=0.5,*/*;q=0.1';
const DEFAULT_USERAGENT = `@splunkdlt/prometheus-scraper/1.0`;
const SHARED_HTTPS_AGENT_NO_REJECT = new HttpsAgent({ rejectUnauthorized: false });

export interface ScrapeResult {
    /** List of parsed metrics */
    metrics: Metric[];
    /** Raw HTTP response from the metrics endpoint */
    response: Response;
    /** Time it took to fetch and parse the metrics (in milliseconds) */
    scrapeDuration: number;
}

export interface ScrapeOptions {
    /** Full URL of the prometheus endpoint */
    url: string;
    /** Request timeout */
    timeout?: number;
    /** If not disabled, this will allow the prometheus server to respond with compressed body (gzip or deflate) */
    allowCompression?: boolean;
    /** If set to false, the scraper will not check the content type of the response from the server */
    validateContentType?: boolean;
    /** If set to false, the HTTP client will ignore certificate errors (eg. when using self-signed certs) */
    validateCertificate?: boolean;
    /** User-agent header sent to metrics endpoint */
    userAgent?: string;
    /** Additional HTTP headers to send along. This can be useful if endpoint requires custom authentication. */
    headers?: { [name: string]: string };
    /** Credentials if endpoint requires HTTP Basic authentication */
    basicAuth?: { username: string; password: string };
    /** Configure retry behavior */
    retryOptions?: RetryOptions;
    /** Options for parsing prometheus text format  */
    parserOptions?: ParserOptions;
    /** Override fetch function for testing */
    fetchFn?: typeof fetch;
}

export class ScrapeError extends Error {
    constructor(msg: string) {
        super(msg);
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = new Error(msg).stack;
        }
    }
}

const encodeBasicAuth = ({ username, password }: { username: string; password: string }) =>
    Buffer.from(`${username}:${password}`, 'utf-8').toString('base64');

const isValidContentType = (contentType: string | null) =>
    contentType != null && !contentType.includes('text/html') && !contentType.includes('/json');

export async function scrapePrometheusMetrics({
    url,
    fetchFn = fetch,
    ...options
}: ScrapeOptions): Promise<ScrapeResult> {
    const parsedUrl = new URL(url);
    const authHeader =
        options.basicAuth != null
            ? {
                  Authorization: encodeBasicAuth(options.basicAuth),
              }
            : undefined;
    const headers = {
        Accept: ACCEPT_HEADER,
        'User-Agent': options.userAgent ?? DEFAULT_USERAGENT,
        ...authHeader,
        ...options.headers,
    };
    const agent =
        parsedUrl.protocol === 'https:' && options.validateCertificate === false
            ? SHARED_HTTPS_AGENT_NO_REJECT
            : undefined;

    return await retry(
        async (): Promise<ScrapeResult> => {
            const startTime = Date.now();
            debug('Requesting prometheus metrics from %s', parsedUrl);
            const response = await fetchFn(parsedUrl, {
                method: 'GET',
                headers,
                compress: options.allowCompression !== false,
                timeout: options.timeout,
                agent,
            });

            if (!response.ok) {
                throw new ScrapeError(`Prometheus endpoint returned HTTP status ${response.status}`);
            }
            const contentType = response.headers.get('Content-Type');
            debug('Received response status=%d with content-type=%s', response.status, contentType);
            if (options.validateContentType !== false && !isValidContentType(contentType)) {
                throw new ScrapeError(`Unexpected content type: ${JSON.stringify(contentType)}`);
            }
            const text = await response.text();
            const metrics = parseText(text, options.parserOptions);
            const scrapeDuration = Date.now() - startTime;
            debug(
                'Successfully parsed %d metrics from endpoint %s in duration=%d ms',
                metrics.length,
                parsedUrl,
                scrapeDuration
            );
            return { metrics, response, scrapeDuration };
        },
        {
            taskName: `prometheus-scrape[${parsedUrl.host}]`,
            waitBetween: 2000,
            attempts: 100,
            onRetry: (attempt) =>
                info('Retrying to scrape prometheus metrics from host=%s attempt=%d', parsedUrl.host, attempt),
            onError: (e, attempt) =>
                error(
                    'Failed attempt=%d to scrape prometheus metrics from host=%s: %s',
                    attempt,
                    parsedUrl.host,
                    e.stack
                ),
            ...options.retryOptions,
        }
    );
}
