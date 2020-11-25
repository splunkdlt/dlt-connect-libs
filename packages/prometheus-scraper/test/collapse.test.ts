import { Metric, MultiMetrics } from '@splunkdlt/hec-client';
import { collapseIntoMultiMetrics, encodeMultiMetricId } from '../src/convert/collapse';

test('encodeMultiMetricId', () => {
    expect(
        encodeMultiMetricId({
            name: 'some.metric1',
            value: 47.11,
            time: 1605826714325,
            fields: {
                hello: 'world',
            },
            metadata: {
                index: 'foobar',
                host: 'somehosterle',
            },
        })
    ).toMatchInlineSnapshot(`"1605826714325|index=foobar;host=somehosterle|hello=world"`);
    expect(
        encodeMultiMetricId({
            name: 'some.metric1',
            value: 47.11,
            time: new Date(1605826714325),
        })
    ).toMatchInlineSnapshot(`"1605826714325||"`);
});

describe('collapseIntoMultiMetrics', () => {
    it('collapes 2 metrics with the name dimensions into a single multi-metrics object', () => {
        const m1: Metric = {
            name: 'some.metric1',
            value: 47.11,
            time: 1605826714325,
            fields: {
                hello: 'world',
            },
        };
        const m2: Metric = {
            name: 'some.metric2',
            value: 8.15,
            time: 1605826714325,
            fields: {
                hello: 'world',
            },
        };

        const expected: MultiMetrics[] = [
            {
                time: 1605826714325,
                fields: {
                    hello: 'world',
                },
                measurements: {
                    'some.metric1': 47.11,
                    'some.metric2': 8.15,
                },
            },
        ];

        expect(collapseIntoMultiMetrics([m1, m2])).toEqual(expected);
    });

    it('retains 2 separate multi-metrics objects for 2 metrics with different dimensions', () => {
        const m1: Metric = {
            name: 'some.metric1',
            value: 47.11,
            time: 1605826714325,
            fields: {
                hello: 'world',
            },
        };
        const m2: Metric = {
            name: 'some.metric2',
            value: 8.15,
            time: 1605826714325,
            fields: {
                foo: 'bar',
            },
        };

        const expected: MultiMetrics[] = [
            {
                time: 1605826714325,
                fields: {
                    hello: 'world',
                },
                measurements: {
                    'some.metric1': 47.11,
                },
            },
            {
                time: 1605826714325,
                fields: {
                    foo: 'bar',
                },
                measurements: {
                    'some.metric2': 8.15,
                },
            },
        ];

        expect(collapseIntoMultiMetrics([m1, m2])).toEqual(expected);
    });
});
