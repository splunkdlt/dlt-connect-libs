import * as all from '../src/index';

test('expored names', () => {
    expect(Object.keys(all)).toMatchInlineSnapshot(`
        Array [
          "parseText",
          "ScrapeError",
          "scrapePrometheusMetrics",
          "convertToHecMetrics",
          "convertToHecMultiMetrics",
          "collapseIntoMultiMetrics",
        ]
    `);
});
