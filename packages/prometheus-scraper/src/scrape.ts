import fetch from 'node-fetch';
import { Metric } from './types';
import { retry, RetryOptions } from '@splunkdlt/async-tasks';
import { createModuleDebug } from '@splunkdlt/debug-logging';
import { ParserOptions, parseText } from './parser';
import { Agent as HttpsAgent } from 'https';

const { debug, info, error } = createModuleDebug('@splunkdlt/prometheus-scraper:scrape');

const ACCEPT_HEADER = 'text/plain;version=0.0.4;q=0.5,*/*;q=0.1';
const DEFAULT_USERAGENT = `@splunkdlt/prometheus-scraper/1.0`;
const SHARED_HTTPS_AGENT_NOVERIFY = new HttpsAgent({ rejectUnauthorized: false });

export interface ScrapeResult {
    //
    metrics: Metric[];
}

export interface ScrapeOptions {
    /** Full URL of the prometheus endpoint */
    url: string;
    /** Request timeout */
    timeout?: number;
    /** If not disabled, this will allow the prometheus server to respond with compressed body (gzip or deflate) */
    allowCompression?: boolean;
    /** If set to false, the HTTP client will ignore certificate errors (eg. when using self-signed certs) */
    validateCertificate?: boolean;
    /** User-agent header sent to metrics endpoint */
    userAgent?: string;
    /** Additional HTTP headers to send along. This can be useful if endpoint requires custom authentication. */
    headers?: { [name: string]: string };

    basicAuth?: { username: string; password: string };

    retryOptions?: RetryOptions;
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

export async function scrapePrometheusMetrics({
    url,
    fetchFn = fetch,
    ...options
}: ScrapeOptions): Promise<ScrapeResult> {
    const parsedUrl = new URL(url);
    const authHeader =
        options.basicAuth != null
            ? {
                  Authorization: Buffer.from(
                      `${options.basicAuth.username}:${options.basicAuth.password}`,
                      'utf-8'
                  ).toString('base64'),
              }
            : undefined;
    const headers = {
        Accept: ACCEPT_HEADER,
        'User-Agent': options.userAgent ?? DEFAULT_USERAGENT,
        ...authHeader,
        ...options.headers,
    };
    const agent =
        parsedUrl.protocol === 'https' && options.validateCertificate === false
            ? SHARED_HTTPS_AGENT_NOVERIFY
            : undefined;

    return await retry(
        async (): Promise<ScrapeResult> => {
            debug('Requesting prometheus metrics from %s', parsedUrl);
            const res = await fetchFn(parsedUrl, {
                method: 'GET',
                headers,
                compress: options.allowCompression !== false,
                timeout: options.timeout,
                agent,
            });

            if (res.ok) {
                throw new ScrapeError(`Prometheus endpoint returned HTTP status ${res.status}`);
            }
            const contentType = res.headers.get('Content-Type');
            debug('Received response status=%d with content-type=%s', res.status, contentType);
            const text = await res.text();
            const metrics = parseText(text, options.parserOptions);
            return { metrics };
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
