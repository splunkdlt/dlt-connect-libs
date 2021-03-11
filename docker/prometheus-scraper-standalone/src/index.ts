/* eslint-disable no-console */
import { AbortHandle } from '@splunkdlt/async-tasks';
import { createModuleDebug } from '@splunkdlt/debug-logging';
import { HecClient } from '@splunkdlt/hec-client';
import { ManagedResource, shutdownAll, waitForSignal } from '@splunkdlt/managed-resource';
import { ConvertOptions, ScrapeOptions } from '@splunkdlt/prometheus-scraper';
import * as os from 'os';
import { env, envBool, envInt, envOpt } from './env';
import { scrapePeriodically } from './scrape';
import { ConfigError } from './config';
import chalk from 'chalk';

const { debug, info, warn, error } = createModuleDebug('prometheus-scraper');

if (process.env.NODE_ENV === 'development') {
    require('dotenv').config();
}

class AbortResource implements ManagedResource {
    constructor(private promise: Promise<any>, private abortHandle: AbortHandle) {
        promise.catch((e) => {
            warn('Unexpected rejection of promise in abort resource', e.stack);
        });
    }
    async shutdown() {
        this.abortHandle.abort();
        await this.promise;
    }
}

const ignoredLocalHostnames = new Set(['localhost', '127.0.0.1', '[::1]']);

function extractHostFromUrl(url: string): string | undefined {
    try {
        const host = new URL(url).hostname;
        debug('Extracted host=%s from URL %s', host, url);
        if (ignoredLocalHostnames.has(host)) {
            debug('Ignoring local host=%s', host);
            return undefined;
        }
        return host;
    } catch (e) {
        debug(`Failed to extract hostname from URL`, e);
        return undefined;
    }
}

async function main() {
    const hec = new HecClient({
        url: env('OUTPUT_HEC_URL'),
        token: env('OUTPUT_HEC_TOKEN'),
        validateCertificate: envBool('OUTPUT_HEC_VALIDATE_SSL_CERT', false),
        flushTime: envInt('OUTPUT_HEC_FLUSH_TIME', 500),
        defaultMetadata: {
            host: os.hostname(),
        },
    });

    const scrapeConfig: ScrapeOptions = {
        url: env('PROMETHEUS_METRICS_URL'),
        validateCertificate: envBool('PROMETHEUS_VALIDATE_SSL_CERT', true),
    };

    const convertConfig: Partial<ConvertOptions> = {
        namePrefix: envOpt('OUTPUT_METRICS_NAME_PREFIX'),
        useDotNotation: envBool('OUTPUT_METRICS_USE_DOT_NOTATION', true),
        metadata: {
            host: envOpt('OUTPUT_METRICS_HOST', extractHostFromUrl(scrapeConfig.url)),
            source: envOpt('OUTPUT_METRICS_SOURCE'),
            sourcetype: envOpt('OUTPUT_METRICS_SOURCETYPE'),
            index: envOpt('OUTPUT_METRICS_INDEX'),
        },
    };

    const abortHandle = new AbortHandle();

    info('Starting prometheus scraper for URL %s', scrapeConfig.url);
    info('Forwarding metrics to HEC %s', hec.config.url);

    const scrapePromise = scrapePeriodically({
        abort: abortHandle,
        scrapeOptions: scrapeConfig,
        convertOptions: convertConfig,
        dest: hec,
        scrapeInterval: envInt('SCRAPE_INTERVAL_MS', 5000),
    }).catch((e) => {
        error('Scrape job terminated with error', e);
    });

    const scraper = new AbortResource(scrapePromise, abortHandle);
    await Promise.race([scrapePromise, waitForSignal('SIGHUP'), waitForSignal('SIGINT'), waitForSignal('SIGTERM')]);
    info('Received signal, shutting down...');
    await shutdownAll([scraper, hec], 10000);
    info(`Shutdown complete ${chalk.green('✔')}`);
}

main().then(
    () => {
        process.exit(0);
    },
    (e) => {
        if (e instanceof ConfigError) {
            console.error(chalk.red(`Configuration Error: ${e.message}`));
            process.exit(2);
        } else {
            console.error(chalk.red(`Encountered unexpected error:`));
            console.error(chalk.gray(e.stack));
            process.exit(1);
        }
    }
);
