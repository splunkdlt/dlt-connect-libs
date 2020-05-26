import { hostname } from 'os';
import { HecClient } from '../src';
import { ensureHecAccessible } from './helpers/init';
import { runSearch, hasResults } from './helpers/splunkd';
import { checkEnv, SPLUNK_INFO } from './env';

const { name, splunkdUrl, hecUrl } = SPLUNK_INFO;

describe(name, () => {
    beforeAll(async () => {
        checkEnv();
        await ensureHecAccessible(hecUrl);
    }, 300_000);

    test('send events', async () => {
        const splunkd = {
            url: splunkdUrl,
            user: 'admin',
            password: 'changeme',
        };

        const hec = new HecClient({
            url: hecUrl,
            token: '11111111-1111-1111-1111-1111111111113',
            validateCertificate: false,
        });

        await hec.waitUntilAvailable(15000);

        const rand = Math.floor(Math.random() * 999999999).toString(36);

        hec.pushEvent({
            body: `hello world FINDME${rand}`,
            time: 1590520677807,
            fields: {},
            metadata: {
                index: 'main',
                source: 'hectests',
                sourcetype: 'hectests',
                host: hostname(),
            },
        });

        await hec.flush();

        const results = await runSearch({
            search: `index=main FINDME${rand} | table _time _raw source sourcetype index`,
            splunkd,
            waitUntil: hasResults({ attempts: 100, waitBetween: 300 }),
        });

        expect(results.length).toBe(1);
        expect(results[0]._raw).toBe(`hello world FINDME${rand}`);
        expect(new Date(results[0]._time).getTime()).toEqual(1590520677807);
    }, 300_000);
});
