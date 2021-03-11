import { createModuleDebug } from '@splunkdlt/debug-logging';
import { MetricName } from '../types';
import { ParserError } from './error';
import { Label, parseLabelString } from './label';

const { debug } = createModuleDebug('@splunkdlt/prometheus-scraper:parser:line');

export type MetricType = 'counter' | 'histogram' | 'gauge' | 'summary' | 'untyped';

export type Line =
    | { type: 'empty' }
    | { type: 'comment'; commentText: string }
    | { type: 'help'; metricName: MetricName; helpText: string }
    | { type: 'type-info'; metricName: MetricName; typeName: MetricType }
    | { type: 'metric'; metricName: MetricName; labels: Label[]; value: string; timestamp: string };

export function parseLine(line: string): Line {
    if (!line?.trim()) {
        return { type: 'empty' };
    }

    const trimmed = line.trim();

    if (trimmed.startsWith('#')) {
        let m = trimmed.match(/^#\s*HELP\s+([a-zA-Z_:][a-zA-Z0-9_:]*)\s+(.+)/);
        if (m != null) {
            return { type: 'help', metricName: m[1], helpText: m[2] };
        }

        m = trimmed.match(/^#\s*TYPE\s+([a-zA-Z_:][a-zA-Z0-9_:]*)\s+(counter|histogram|gauge|summary|untyped)/);
        if (m != null) {
            return { type: 'type-info', metricName: m[1], typeName: m[2] as MetricType };
        }

        return {
            type: 'comment',
            commentText: trimmed.slice(1).trimStart(),
        };
    }

    const m = trimmed.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)( ?\{.+?\}|)\s+([\d\.e+-]+|[+-][iI]nf|Na[Nn])(?:\s+(-?\d+))?$/);
    if (m != null) {
        return {
            type: 'metric',
            metricName: m[1],
            labels: parseLabelString(m[2].trim()),
            value: m[3],
            timestamp: m[4],
        };
    }

    debug('Encountered invalid line: %o', line);
    throw new ParserError(`Invalid line: ${JSON.stringify(line)}`);
}
