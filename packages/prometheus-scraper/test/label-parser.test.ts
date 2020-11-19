import { parseLabelString } from '../src/parser/label';

describe('parseLabelString', () => {
    it('parses empty labels', () => {
        expect(parseLabelString('{}')).toMatchInlineSnapshot(`Array []`);
    });
    it('parses simple hello world', () => {
        expect(parseLabelString('{hello="world"}')).toMatchInlineSnapshot(`
            Array [
              Object {
                "name": "hello",
                "value": "world",
              },
            ]
        `);
    });
    it('parses multiple labels', () => {
        expect(parseLabelString('{hello="world",foo="bar"}')).toMatchInlineSnapshot(`
            Array [
              Object {
                "name": "hello",
                "value": "world",
              },
              Object {
                "name": "foo",
                "value": "bar",
              },
            ]
        `);
    });

    it('parses escaped characters', () => {
        expect(parseLabelString(`{path="C:\\\\DIR\\\\FILE.TXT",error="Cannot find file:\\n\\"FILE.TXT\\""}`))
            .toMatchInlineSnapshot(`
            Array [
              Object {
                "name": "path",
                "value": "C:\\\\DIR\\\\FILE.TXT",
              },
              Object {
                "name": "error",
                "value": "Cannot find file:
            \\"FILE.TXT\\"",
              },
            ]
        `);
    });
});
