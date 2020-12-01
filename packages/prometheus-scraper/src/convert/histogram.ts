import { Metric as HecMetric } from '@splunkdlt/hec-client';
import { BucketedMetric } from '../types';
import { convertBase } from './base';
import { concatMetricName } from './helpers';
import { ConvertOptions } from './types';

export function histogramToHecMetrics(metric: BucketedMetric, options: ConvertOptions): HecMetric[] {
    const base = convertBase(metric, options);
    const countAndSum: HecMetric[] = [
        { ...base, name: concatMetricName(base.name, 'count', options.useDotNotation), value: metric.count },
        { ...base, name: concatMetricName(base.name, 'sum', options.useDotNotation), value: metric.sum },
    ];
    const buckets = metric.buckets.map(
        ([le, value]): HecMetric => ({
            ...base,
            name: base.name,
            value,
            fields: {
                ...base.fields,
                le,
            },
        })
    );
    return countAndSum.concat(buckets);
}
