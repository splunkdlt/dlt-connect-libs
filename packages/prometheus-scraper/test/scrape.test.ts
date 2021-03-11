import { scrapePrometheusMetrics } from '../src/scrape';

describe('scrapePrometheusMetrics', () => {
    it('scrapes simple metrics', async () => {
        const responseContent = `metric_without_timestamp_and_labels 12.47\n`;
        const mockFetch = jest.fn(() =>
            Promise.resolve({
                text: () => Promise.resolve(responseContent),
                status: 200,
                statusText: 'OK',
                ok: true,
                headers: new Map([['Content-Type', 'text/plain']]),
            })
        );

        const result = await scrapePrometheusMetrics({
            url: 'http://foo.bar.com:1234/metrics',
            fetchFn: mockFetch as any,
        });

        expect(mockFetch.mock.calls.length).toBe(1);
        const fetchUrl = (mockFetch.mock.calls[0] as any)[0];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { agent, ...fetchArgs } = (mockFetch.mock.calls[0] as any)[1];
        expect(fetchUrl).toMatchInlineSnapshot(`"http://foo.bar.com:1234/metrics"`);
        expect(fetchArgs).toMatchInlineSnapshot(`
            Object {
              "compress": true,
              "headers": Object {
                "Accept": "text/plain;version=0.0.4;q=0.5,*/*;q=0.1",
                "User-Agent": "@splunkdlt/prometheus-scraper/1.0",
              },
              "method": "GET",
              "timeout": undefined,
            }
        `);
        expect(result.metrics).toMatchInlineSnapshot(`
            Array [
              Object {
                "help": undefined,
                "labels": Array [],
                "name": "metric_without_timestamp_and_labels",
                "timestamp": undefined,
                "type": "untyped",
                "value": "12.47",
              },
            ]
        `);
    });

    it('throws error for invalid content type', async () => {
        const responseContent = `metric_without_timestamp_and_labels 12.47\n`;
        const mockFetch = jest.fn(() =>
            Promise.resolve({
                text: () => Promise.resolve(responseContent),
                status: 200,
                statusText: 'OK',
                ok: true,
                headers: new Map([['Content-Type', 'application/json']]),
            })
        );

        const onError = jest.fn();
        const onRetry = jest.fn();

        const result = scrapePrometheusMetrics({
            url: 'http://foo.bar.com:1234/metrics',
            fetchFn: mockFetch as any,
            retryOptions: {
                onError,
                onRetry,
                waitBetween: 1,
                attempts: 2,
            },
        });

        await expect(result).rejects.toMatchInlineSnapshot(`[Error: Unexpected content type: "application/json"]`);
        expect(onError.mock.calls.length).toBe(2);
        expect(onRetry.mock.calls.length).toBe(1);
    });
});
