import { ParserError } from './error';

export type Label = {
    name: string;
    value: string;
};

export function parseLabelString(labelString: string): Label[] {
    if (labelString === '') {
        return [];
    }
    const result: Label[] = [];

    if (!(labelString.startsWith('{') && labelString.endsWith('}'))) {
        throw new ParserError('Invalid label string');
    }
    let cur = labelString.slice(1, -1);

    while (cur.length) {
        const eqIdx = cur.indexOf('=');
        if (eqIdx < 0) {
            throw new ParserError('Invalid label string');
        }
        const label = cur.slice(0, eqIdx);
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(label)) {
            throw new ParserError(`Invalid label ${JSON.stringify(label)}`);
        }

        let value = '';
        let valueIdx = eqIdx + 1;
        let escaped = false;

        if (cur[valueIdx] !== '"') {
            throw new ParserError('Invalid label value (not quoted)');
        }

        valueIdx++;
        for (; ; valueIdx++) {
            if (valueIdx > cur.length) {
                throw new ParserError('Premature end of label string');
            }
            const ch = cur[valueIdx];
            if (escaped) {
                escaped = false;
                if (ch === '"') {
                    value += '"';
                } else if (ch === 'n') {
                    value += '\n';
                } else if (ch === '\\') {
                    value += '\\';
                } else {
                    throw new ParserError(`Invalid escape sequence: "\\${ch}"`);
                }
                continue;
            }
            if (ch === '"') {
                break;
            }
            if (ch === '\\') {
                escaped = true;
                continue;
            }
            value += ch;
        }

        result.push({ name: label, value });
        cur = cur.slice(valueIdx + 1);

        if (cur[0] === ',') {
            cur = cur.slice(1);
        } else if (cur.length) {
            throw new ParserError('Invalid label string, missing comma after value');
        }
    }

    return result;
}
