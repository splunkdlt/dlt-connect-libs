import { HecClient } from '../src';
import { ensureHecAccessible } from './helpers/init';
import { runSearch, hasResults } from './helpers/splunkd';
import { checkEnv, SPLUNK_INFO } from './env';

const { name, splunkdUrl, hecUrl, multiMetrics } = SPLUNK_INFO;

describe(`${name} (multi-metrics-supported: ${multiMetrics})`, () => {
    beforeAll(async () => {
        checkEnv();
        await ensureHecAccessible(hecUrl);
    }, 300_000);

    test('send single metric', async () => {
        const splunkd = {
            url: splunkdUrl,
            user: 'admin',
            password: 'changeme',
        };

        const hec = new HecClient({
            url: hecUrl,
            token: '11111111-1111-1111-1111-1111111111113',
            validateCertificate: false,
            multipleMetricFormatEnabled: multiMetrics,
        });

        await hec.waitUntilAvailable(15000);

        const randVal = Math.floor(Math.random() * 9999);
        const randLabel = `dim${Math.floor(Math.random() * 99999999).toString(36)}`;

        hec.pushMetric({
            time: Date.now(),
            name: 'foo.bar.test',
            value: randVal,
            fields: {
                label: randLabel,
            },
            metadata: {
                index: 'metrics',
            },
        });

        await hec.flush();

        const results = await runSearch({
            search: `| mstats avg(foo.bar.test) as val WHERE label=${randLabel} AND index=metrics`,
            splunkd,
            waitUntil: hasResults({ attempts: 100, waitBetween: 300 }),
        });

        expect(results.length).toBe(1);
        expect(results[0].val).toBe(`${randVal}`);
    }, 300_000);

    test('send multi-metrics', async () => {
        const splunkd = {
            url: splunkdUrl,
            user: 'admin',
            password: 'changeme',
        };

        const hec = new HecClient({
            url: hecUrl,
            token: '11111111-1111-1111-1111-1111111111113',
            validateCertificate: false,
            multipleMetricFormatEnabled: multiMetrics,
        });

        await hec.waitUntilAvailable(15000);

        const randVal = Math.floor(Math.random() * 9999);
        const randLabel = `dim2${Math.floor(Math.random() * 99999999).toString(36)}`;

        hec.pushMetrics({
            time: Date.now(),
            measurements: {
                'multi.foo.bar': randVal,
                'multi.ding.dong': randVal,
            },
            fields: {
                label: randLabel,
            },
            metadata: {
                index: 'metrics',
            },
        });

        await hec.flush();

        const results = await runSearch({
            search: `| mstats avg(multi.foo.bar) as val1 latest(multi.ding.dong) as val2 WHERE label=${randLabel} AND index=metrics`,
            splunkd,
            waitUntil: hasResults({ attempts: 100, waitBetween: 300 }),
        });

        expect(results.length).toBe(1);
        expect(parseFloat(results[0].val1)).toBe(randVal);
        expect(parseFloat(results[0].val2)).toBe(randVal);
    }, 300_000);
});
