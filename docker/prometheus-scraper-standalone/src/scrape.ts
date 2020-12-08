import { ABORT, AbortHandle, sleep } from '@splunkdlt/async-tasks';
import { createModuleDebug } from '@splunkdlt/debug-logging';
import { HecClient } from '@splunkdlt/hec-client';
import {
    ConvertOptions,
    convertToHecMultiMetrics,
    ScrapeOptions,
    scrapePrometheusMetrics,
} from '@splunkdlt/prometheus-scraper';

const { debug, info, error } = createModuleDebug('prometheus-scraper');

export async function scrapePeriodically({
    scrapeInterval,
    scrapeOptions,
    convertOptions,
    dest,
    abort,
}: {
    scrapeOptions: ScrapeOptions;
    scrapeInterval: number;
    convertOptions: Partial<ConvertOptions>;
    dest: HecClient;
    abort: AbortHandle;
}) {
    try {
        debug('Starting scrape loop with config', {
            scrapeInterval,

            scrapeOptions,
            convertOptions,
        });
        while (!abort.aborted) {
            const captureTime = Date.now();
            const result = await abort.race(scrapePrometheusMetrics(scrapeOptions));
            const hecMetrics = convertToHecMultiMetrics(result.metrics, convertOptions);
            for (const m of hecMetrics) {
                dest.pushMetrics(m);
            }
            const duration = Date.now() - captureTime;
            debug(
                'Scraped count=%d metrics (%d multi-metrics) in duration=%d ms',
                result.metrics.length,
                hecMetrics.length,
                duration
            );
            const sleepTime = scrapeInterval - duration;
            if (sleepTime > 0) {
                debug('Waiting for delay=%d ms before next scrape iteration', sleepTime);
                await abort.race(sleep(sleepTime));
            } else {
                debug(
                    'Scraping metrics took longer (duration=%d ms) than configured interval=%d ms. Running next iteration immediately',
                    duration,
                    scrapeInterval
                );
            }
        }
    } catch (e) {
        if (abort.aborted) {
            info('Caught abort signal, ending loop');
        } else {
            error('Scrape loop terminated due to unexpected error:', e);
            throw e;
        }
    }
    info('Scrape loop ended');
}
