/*
 * Parser for Prometheus text format
 * https://github.com/Showmax/prometheus-docs/blob/master/content/docs/instrumenting/exposition_formats.md
 */

import { createModuleDebug } from '@splunkdlt/debug-logging';
import { BucketedMetric, Metric, MetricValue } from '../types';
import { ParserError } from './error';
import { Label } from './label';
import { parseLine } from './line';

const { warn } = createModuleDebug('@splunkdlt/prometheus-scraper:parser');

export interface ParserOptions {
    failOnInvalidLine: boolean;
    /** Throw an error if multiple type declarations for the same metric are encountered */
    failOnDuplicateTypeInfo: boolean;
    /** Throw an error if multiple help declarations for the same metric are encountered */
    failOnDuplicateHelp: boolean;
    /** If enabled, the parser will ignore any metrics without a corresponding type declaration */
    ignoreMetricsWithoutType: boolean;
    /** If enabled, the parser will ignore explicit type declaration specifying the "untyped" type */
    ignoreExplicitlyUntyped: boolean;
    /** Function to print warnings. Useful to override for testing */
    emitWarning: (info: {
        msg: string;
        metricName?: string;
        line?: string;
        type: 'line-ignored' | 'metric-ignored' | 'untyped-metric-ignored' | 'duplicate-type-info' | 'duplicate-help';
    }) => void;
}

export const PARSER_DEFAULTS: ParserOptions = {
    failOnInvalidLine: true,
    failOnDuplicateHelp: false,
    failOnDuplicateTypeInfo: false,
    ignoreExplicitlyUntyped: false,
    ignoreMetricsWithoutType: false,
    emitWarning: ({ msg }) => warn(msg),
};

type EmitFn = (metric: Metric | null) => void;

class StatefulParser {
    constructor(private emit: EmitFn, private options: ParserOptions) {}
    private readonly typeMap = new Map<string, string>();
    private readonly helpMap = new Map<string, string>();
    private currentMultiSample: BucketedMetric | null = null;
    private cachedLabelMap: { labels: Label[]; result: Map<string, string> } | null = null;

    flushCurrentMultiSample = () => {
        if (this.currentMultiSample != null) {
            this.emit(this.currentMultiSample);
            this.currentMultiSample = null;
        }
    };

    labelMap(labels: Label[]): Map<string, string> {
        if (labels === this.cachedLabelMap?.labels) {
            return this.cachedLabelMap.result;
        }
        const result = new Map<string, string>();
        for (const { name, value } of labels) {
            result.set(name, value);
        }
        this.cachedLabelMap = {
            labels,
            result,
        };
        return result;
    }

    labelMatch(a: Label[], b: Label[], exclude: 'le' | 'quantile'): boolean {
        const af = a.filter((l) => l.name !== exclude);
        if (af.length !== b.length) {
            return false;
        }
        const bm = this.labelMap(b);
        return af.every(({ name, value }) => bm.get(name) === value);
    }

    processLine = (lineStr: string) => {
        const line = parseLine(lineStr);

        switch (line.type) {
            case 'comment':
            case 'empty':
                return;

            case 'type-info':
                if (this.typeMap.has(line.metricName)) {
                    const msg = `Duplicate type declaraction for metric ${JSON.stringify(line.metricName)}`;
                    if (this.options.failOnDuplicateTypeInfo) {
                        throw new ParserError(msg);
                    } else {
                        this.options.emitWarning({
                            msg,
                            type: 'duplicate-type-info',
                            line: lineStr,
                            metricName: line.metricName,
                        });
                    }
                }
                if (!(this.options.ignoreExplicitlyUntyped && line.typeName === 'untyped')) {
                    this.typeMap.set(line.metricName, line.typeName);
                }
                break;

            case 'help':
                if (this.helpMap.has(line.metricName)) {
                    const msg = `Duplicate help declaraction for metric ${JSON.stringify(line.metricName)}`;
                    if (this.options.failOnDuplicateHelp) {
                        throw new ParserError(msg);
                    } else {
                        this.options.emitWarning({
                            msg,
                            type: 'duplicate-help',
                            line: lineStr,
                            metricName: line.metricName,
                        });
                    }
                }
                this.helpMap.set(line.metricName, line.helpText);
                break;

            case 'metric':
                let name = line.metricName;
                let type = this.typeMap.get(name);
                if (type == null) {
                    if (name.endsWith('_bucket')) {
                        const t = this.typeMap.get(name.slice(0, -7));
                        if (t === 'histogram') {
                            name = name.slice(0, -7);
                            type = t;
                        }
                    }
                    if (name.endsWith('_sum')) {
                        const t = this.typeMap.get(name.slice(0, -4));
                        if (t === 'histogram' || t === 'summary') {
                            name = name.slice(0, -4);
                            type = t;
                        }
                    }
                    if (name.endsWith('_count')) {
                        const t = this.typeMap.get(name.slice(0, -6));
                        if (t === 'histogram' || t === 'summary') {
                            name = name.slice(0, -6);
                            type = t;
                        }
                    }
                }

                if (type == null) {
                    if (this.options.ignoreMetricsWithoutType) {
                        this.options.emitWarning({
                            msg: `Ignoring metric without type declaration name=${name}`,
                            type: 'metric-ignored',
                            line: lineStr,
                            metricName: line.metricName,
                        });
                        return;
                    } else {
                        type = 'untyped';
                    }
                }

                switch (type) {
                    case 'counter':
                    case 'untyped':
                    case 'gauge':
                        this.flushCurrentMultiSample();
                        this.emit({
                            name,
                            type,
                            labels: line.labels,
                            value: line.value,
                            help: this.helpMap.get(name),
                            timestamp: line.timestamp,
                        });
                        break;
                    case 'histogram':
                        this.processBucketedMetric(name, line, 'histogram', 'le', '_bucket');
                        break;
                    case 'summary':
                        this.processBucketedMetric(name, line, 'summary', 'quantile', '');
                        break;
                    default:
                        throw new ParserError(`Unexpected metric type: ${type}`);
                }
                break;

            default:
                throw new ParserError(`Received invalid line of type ${(line as any)?.type}`);
        }
    };

    processBucketedMetric = (
        name: string,
        line: { metricName: string; type: string; labels: Label[]; value: MetricValue },
        type: 'histogram' | 'summary',
        bucketLabel: 'le' | 'quantile',
        bucketSuffix: '' | '_bucket'
    ) => {
        if (
            this.currentMultiSample != null &&
            (name !== this.currentMultiSample.name ||
                !this.labelMatch(line.labels, this.currentMultiSample.labels, bucketLabel))
        ) {
            this.flushCurrentMultiSample();
        }
        if (this.currentMultiSample == null) {
            this.currentMultiSample = {
                name,
                type,
                labels: line.labels.filter((label) => label.name !== bucketLabel),
                buckets: [],
                sum: 'NaN',
                count: 'NaN',
            };
        }
        const cur = this.currentMultiSample;
        const suffix = line.metricName.slice(name.length);
        switch (suffix) {
            case bucketSuffix:
                const threshold = line.labels.find((l) => l.name === bucketLabel)?.value;
                if (threshold == null) {
                    warn('Encountered bucketed metric without threshold label "%s"', bucketLabel);
                    break;
                }
                cur.buckets.push([threshold, line.value]);
                break;
            case '_count':
                cur.count = line.value;
                break;
            case '_sum':
                cur.sum = line.value;
                break;
            default:
                throw new ParserError(`Unexpected metric name suffix: ${JSON.stringify(suffix)}`);
        }
    };

    done = () => {
        this.flushCurrentMultiSample();
        this.emit(null);
    };
}

export function parseText(text: string, options: ParserOptions = PARSER_DEFAULTS): Metric[] {
    const result: Metric[] = [];
    const parser = new StatefulParser((metric) => {
        if (metric != null) result.push(metric);
    }, options);
    try {
        text.split('\n').forEach((line) => {
            try {
                parser.processLine(line);
            } catch (e) {
                if (options.failOnInvalidLine) {
                    if (e instanceof ParserError) {
                        throw e;
                    } else {
                        throw new ParserError(`Error parsing Prometheus metrics: ${e.message}`);
                    }
                } else {
                    options.emitWarning({
                        type: 'line-ignored',
                        msg: e.message,
                        line,
                    });
                }
            }
        });
        parser.done();
    } catch (e) {
        if (e instanceof ParserError) {
            throw e;
        } else {
            throw new ParserError(`Unexpected error parsing Prometheus metrics: ${e}`, e);
        }
    }
    return result;
}
