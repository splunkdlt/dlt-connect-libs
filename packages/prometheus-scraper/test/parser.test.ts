import { parseText } from '../src/parser';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('parseText', () => {
    it('parses example1.txt', () => {
        const contents = readFileSync(join(__dirname, 'fixtures/example1.txt'), { encoding: 'utf-8' });
        expect(parseText(contents)).toMatchSnapshot();
    });
    it('parses histograms.txt', () => {
        const contents = readFileSync(join(__dirname, 'fixtures/histograms.txt'), { encoding: 'utf-8' });
        expect(parseText(contents)).toMatchSnapshot();
    });
    it('parses promtestdata.txt', () => {
        const contents = readFileSync(join(__dirname, 'fixtures/promtestdata.txt'), { encoding: 'utf-8' });
        expect(parseText(contents)).toMatchSnapshot();
    });
    it('parses geth_sample.txt', () => {
        const contents = readFileSync(join(__dirname, 'fixtures/geth_sample.txt'), { encoding: 'utf-8' });
        expect(parseText(contents)).toMatchSnapshot();
    });
    it('parses federation_sample.txt', () => {
        const contents = readFileSync(join(__dirname, 'fixtures/federation_sample.txt'), { encoding: 'utf-8' });
        expect(
            parseText(contents, { failOnInvalidLine: true, failOnDuplicateHelp: false, failOnDuplicateTypeInfo: false })
        ).toMatchSnapshot();
    });

    it('fails for invalid text', () => {
        expect(() => parseText('yolo')).toThrowErrorMatchingInlineSnapshot(
            `"Error parsing Prometheus metrics: Invalid line: \\"yolo\\""`
        );
    });
});
