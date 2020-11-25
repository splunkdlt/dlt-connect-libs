/* eslint-disable no-console */
import { sleep } from '@splunkdlt/async-tasks';
import { HecClient } from '@splunkdlt/hec-client';
import { waitForSignal } from '@splunkdlt/managed-resource';
import { convertToHecMultiMetrics, scrapePrometheusMetrics } from '@splunkdlt/prometheus-scraper';
import * as os from 'os';

async function main() {
    const hec = new HecClient({
        url: 'https://localhost:8088',
        token: '11111111-1111-1111-1111-1111111111113',
        validateCertificate: false,
        flushTime: 500,
        defaultMetadata: {
            index: 'metrics',
            host: 'geth1.example.com',
            sourcetype: 'mymetrics',
        },
    });

    let running = true;

    await Promise.race([
        (async () => {
            // EXAMPLE:START
            while (running) {
                const scrapeResult = await scrapePrometheusMetrics({
                    url: 'http://localhost:8080/debug/metrics/prometheus',
                });

                const convertedMetics = convertToHecMultiMetrics(scrapeResult.metrics, {
                    captureTimestamp: Date.now(),
                    namePrefix: 'geth',
                    metadata: {
                        host: os.hostname(),
                        source: 'geth:metrics:prometheus',
                    },
                });

                for (const hecMetrics of convertedMetics) {
                    hec.pushMetrics(hecMetrics);
                }

                await sleep(5_000);
            }
            // EXAMPLE:END
        })(),
        waitForSignal('SIGHUP'),
        waitForSignal('SIGINT'),
        waitForSignal('SIGTERM'),
    ]);
    console.log('Shutting down...');
    running = false;
    await hec.shutdown();
    console.log('Terminated.');
    process.exit(0);
}

main().catch((e) => {
    console.error(e.stack);
    process.exit(1);
});
