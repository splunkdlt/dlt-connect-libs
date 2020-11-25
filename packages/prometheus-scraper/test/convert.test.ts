import { convertToHecMetrics, convertToHecMultiMetrics } from '../src/convert';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseText } from '../src/parser';

describe('convertToHecMetrics', () => {
    it('converts simple counter metric', () => {
        expect(
            convertToHecMetrics([
                {
                    help: 'The total number of HTTP requests.',
                    labels: [
                        {
                            name: 'method',
                            value: 'post',
                        },
                        {
                            name: 'code',
                            value: '200',
                        },
                    ],
                    name: 'http_requests_total',
                    timestamp: '1395066363000',
                    type: 'counter',
                    value: '1027',
                },
            ])
        ).toMatchInlineSnapshot(`
            Array [
              Object {
                "fields": Object {
                  "code": "200",
                  "method": "post",
                },
                "metadata": undefined,
                "name": "http.requests.total",
                "time": 1395066363000,
                "value": "1027",
              },
            ]
        `);
    });

    it('converts summary metric', () => {
        expect(
            convertToHecMetrics(
                [
                    {
                        count: '2693',
                        name: 'telemetry_requests_metrics_latency_microseconds',
                        sum: '1.7560473e+07',
                        type: 'summary',
                        buckets: [
                            ['0.01', '3102'],
                            ['0.05', '3272'],
                            ['0.5', '4773'],
                            ['0.9', '9001'],
                            ['0.99', '76656'],
                        ],
                        labels: [],
                    },
                ],
                {
                    captureTimestamp: 1605910888764,
                    namePrefix: 'some.service',
                    metadata: {
                        source: 'some:service',
                        sourcetype: 'something',
                        host: 'myhost123',
                    },
                }
            )
        ).toMatchInlineSnapshot(`
            Array [
              Object {
                "fields": Object {},
                "metadata": Object {
                  "host": "myhost123",
                  "source": "some:service",
                  "sourcetype": "something",
                },
                "name": "some.service.telemetry.requests.metrics.latency.microseconds.p01",
                "time": 1605910888764,
                "value": "3102",
              },
              Object {
                "fields": Object {},
                "metadata": Object {
                  "host": "myhost123",
                  "source": "some:service",
                  "sourcetype": "something",
                },
                "name": "some.service.telemetry.requests.metrics.latency.microseconds.p05",
                "time": 1605910888764,
                "value": "3272",
              },
              Object {
                "fields": Object {},
                "metadata": Object {
                  "host": "myhost123",
                  "source": "some:service",
                  "sourcetype": "something",
                },
                "name": "some.service.telemetry.requests.metrics.latency.microseconds.p50",
                "time": 1605910888764,
                "value": "4773",
              },
              Object {
                "fields": Object {},
                "metadata": Object {
                  "host": "myhost123",
                  "source": "some:service",
                  "sourcetype": "something",
                },
                "name": "some.service.telemetry.requests.metrics.latency.microseconds.p90",
                "time": 1605910888764,
                "value": "9001",
              },
              Object {
                "fields": Object {},
                "metadata": Object {
                  "host": "myhost123",
                  "source": "some:service",
                  "sourcetype": "something",
                },
                "name": "some.service.telemetry.requests.metrics.latency.microseconds.p99",
                "time": 1605910888764,
                "value": "76656",
              },
              Object {
                "fields": Object {},
                "metadata": Object {
                  "host": "myhost123",
                  "source": "some:service",
                  "sourcetype": "something",
                },
                "name": "some.service.telemetry.requests.metrics.latency.microseconds.count",
                "time": 1605910888764,
                "value": "2693",
              },
              Object {
                "fields": Object {},
                "metadata": Object {
                  "host": "myhost123",
                  "source": "some:service",
                  "sourcetype": "something",
                },
                "name": "some.service.telemetry.requests.metrics.latency.microseconds.sum",
                "time": 1605910888764,
                "value": "1.7560473e+07",
              },
            ]
        `);
    });
});

describe('convertToHecMultiMetrics', () => {
    it('convert histograms.txt', () => {
        const contents = readFileSync(join(__dirname, 'fixtures/histograms.txt'), { encoding: 'utf-8' });
        const parsed = parseText(contents);
        expect(convertToHecMultiMetrics(parsed, { captureTimestamp: 1606281482521, namePrefix: 'my.service' }))
            .toMatchInlineSnapshot(`
            Array [
              Object {
                "fields": Object {
                  "method": "GET",
                },
                "measurements": Object {
                  "my.service.http.request.duration.seconds.count": "144320",
                  "my.service.http.request.duration.seconds.sum": "53423",
                },
                "metadata": undefined,
                "time": 1606281482521,
              },
              Object {
                "fields": Object {
                  "le": "0.05",
                  "method": "GET",
                },
                "measurements": Object {
                  "my.service.http.request.duration.seconds": "24054",
                },
                "metadata": undefined,
                "time": 1606281482521,
              },
              Object {
                "fields": Object {
                  "le": "0.1",
                  "method": "GET",
                },
                "measurements": Object {
                  "my.service.http.request.duration.seconds": "33444",
                },
                "metadata": undefined,
                "time": 1606281482521,
              },
              Object {
                "fields": Object {
                  "le": "0.2",
                  "method": "GET",
                },
                "measurements": Object {
                  "my.service.http.request.duration.seconds": "100392",
                },
                "metadata": undefined,
                "time": 1606281482521,
              },
              Object {
                "fields": Object {
                  "le": "0.5",
                  "method": "GET",
                },
                "measurements": Object {
                  "my.service.http.request.duration.seconds": "129389",
                },
                "metadata": undefined,
                "time": 1606281482521,
              },
              Object {
                "fields": Object {
                  "le": "1",
                  "method": "GET",
                },
                "measurements": Object {
                  "my.service.http.request.duration.seconds": "133988",
                },
                "metadata": undefined,
                "time": 1606281482521,
              },
              Object {
                "fields": Object {
                  "le": "+Inf",
                  "method": "GET",
                },
                "measurements": Object {
                  "my.service.http.request.duration.seconds": "144320",
                },
                "metadata": undefined,
                "time": 1606281482521,
              },
              Object {
                "fields": Object {
                  "method": "POST",
                },
                "measurements": Object {
                  "my.service.http.request.duration.seconds.count": "1144320",
                  "my.service.http.request.duration.seconds.sum": "153423",
                },
                "metadata": undefined,
                "time": 1606281482521,
              },
              Object {
                "fields": Object {
                  "le": "0.05",
                  "method": "POST",
                },
                "measurements": Object {
                  "my.service.http.request.duration.seconds": "124054",
                },
                "metadata": undefined,
                "time": 1606281482521,
              },
              Object {
                "fields": Object {
                  "le": "0.1",
                  "method": "POST",
                },
                "measurements": Object {
                  "my.service.http.request.duration.seconds": "133444",
                },
                "metadata": undefined,
                "time": 1606281482521,
              },
              Object {
                "fields": Object {
                  "le": "0.2",
                  "method": "POST",
                },
                "measurements": Object {
                  "my.service.http.request.duration.seconds": "1100392",
                },
                "metadata": undefined,
                "time": 1606281482521,
              },
              Object {
                "fields": Object {
                  "le": "0.5",
                  "method": "POST",
                },
                "measurements": Object {
                  "my.service.http.request.duration.seconds": "1129389",
                },
                "metadata": undefined,
                "time": 1606281482521,
              },
              Object {
                "fields": Object {
                  "le": "1",
                  "method": "POST",
                },
                "measurements": Object {
                  "my.service.http.request.duration.seconds": "1133988",
                },
                "metadata": undefined,
                "time": 1606281482521,
              },
              Object {
                "fields": Object {
                  "le": "+Inf",
                  "method": "POST",
                },
                "measurements": Object {
                  "my.service.http.request.duration.seconds": "1144320",
                },
                "metadata": undefined,
                "time": 1606281482521,
              },
            ]
        `);
    });
});
