import { readFileSync } from 'fs';
import { join } from 'path';
import { parseLine } from '../src/parser/line';

describe('parseLine', () => {
    it('parses empty line', () => {
        expect(parseLine('')).toEqual({ type: 'empty' });
    });

    it('parses HELP line', () => {
        expect(parseLine('# HELP some_metric_name This is some help text')).toEqual({
            type: 'help',
            metricName: 'some_metric_name',
            helpText: 'This is some help text',
        });
    });

    it('parses TYPE line', () => {
        expect(parseLine('# TYPE some_metric_name counter')).toEqual({
            type: 'type-info',
            metricName: 'some_metric_name',
            typeName: 'counter',
        });
    });

    it('parses metric line', () => {
        expect(parseLine('some_metric_name 123')).toEqual({
            type: 'metric',
            metricName: 'some_metric_name',
            value: '123',
            labels: [],
        });
        expect(parseLine('some_metric_name{foo="bar"} 123')).toEqual({
            type: 'metric',
            metricName: 'some_metric_name',
            value: '123',
            labels: [{ name: 'foo', value: 'bar' }],
        });
        expect(parseLine('some_metric_name{foo="bar"} 123 45678')).toEqual({
            type: 'metric',
            metricName: 'some_metric_name',
            value: '123',
            labels: [{ name: 'foo', value: 'bar' }],
            timestamp: '45678',
        });
    });

    it('throws error on invalid line', () => {
        expect(() => parseLine('THIS IS SPARTA!')).toThrowErrorMatchingInlineSnapshot(
            `"Invalid line: \\"THIS IS SPARTA!\\""`
        );
    });

    it('parses fixture files', async () => {
        const contents = readFileSync(join(__dirname, 'fixtures/example1.txt'), { encoding: 'utf-8' });
        expect(contents.split('\n').map(parseLine)).toMatchSnapshot();
    });
});
