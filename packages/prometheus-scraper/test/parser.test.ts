import { parseText, PARSER_DEFAULTS } from '../src/parser';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('parseText', () => {
    it('parses example1.txt', () => {
        const contents = readFileSync(join(__dirname, 'fixtures/example1.txt'), { encoding: 'utf-8' });
        const warnings: any[] = [];
        expect(
            parseText(contents, {
                ...PARSER_DEFAULTS,
                emitWarning: (w) => warnings.push(w),
            })
        ).toMatchSnapshot();
        expect(warnings).toMatchInlineSnapshot(`Array []`);
    });
    it('parses histograms.txt', () => {
        const contents = readFileSync(join(__dirname, 'fixtures/histograms.txt'), { encoding: 'utf-8' });
        const warnings: any[] = [];
        expect(
            parseText(contents, {
                ...PARSER_DEFAULTS,
                emitWarning: (w) => warnings.push(w),
            })
        ).toMatchSnapshot();
        expect(warnings).toMatchInlineSnapshot(`Array []`);
    });
    it('parses promtestdata.txt', () => {
        const contents = readFileSync(join(__dirname, 'fixtures/promtestdata.txt'), { encoding: 'utf-8' });
        const warnings: any[] = [];
        expect(
            parseText(contents, {
                ...PARSER_DEFAULTS,
                emitWarning: (w) => warnings.push(w),
            })
        ).toMatchSnapshot();
        expect(warnings).toMatchInlineSnapshot(`Array []`);
    });
    it('parses geth_sample.txt', () => {
        const contents = readFileSync(join(__dirname, 'fixtures/geth_sample.txt'), { encoding: 'utf-8' });
        const warnings: any[] = [];
        expect(
            parseText(contents, {
                ...PARSER_DEFAULTS,
                emitWarning: (w) => warnings.push(w),
            })
        ).toMatchSnapshot();
        expect(warnings).toMatchInlineSnapshot(`Array []`);
    });
    it('parses federation_sample.txt', () => {
        const contents = readFileSync(join(__dirname, 'fixtures/federation_sample.txt'), { encoding: 'utf-8' });
        const warnings: any[] = [];
        expect(
            parseText(contents, {
                ...PARSER_DEFAULTS,
                emitWarning: (w) => warnings.push(w),
            })
        ).toMatchSnapshot();
        expect(warnings).toMatchInlineSnapshot(`Array []`);
    });
    it('parses example1_no_types.txt', () => {
        const contents = readFileSync(join(__dirname, 'fixtures/example1_no_types.txt'), { encoding: 'utf-8' });
        const warnings: any[] = [];
        expect(
            parseText(contents, {
                ...PARSER_DEFAULTS,
                emitWarning: (w) => warnings.push(w),
            })
        ).toMatchSnapshot();
        expect(warnings).toMatchSnapshot();
    });

    it('fails for invalid text', () => {
        expect(() => parseText('yolo')).toThrowErrorMatchingInlineSnapshot(`"Invalid line: \\"yolo\\""`);
    });
});
