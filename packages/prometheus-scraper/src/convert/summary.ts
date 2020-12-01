import { Metric as HecMetric } from '@splunkdlt/hec-client';
import { BucketedMetric, MetricValue } from '../types';
import { convertBase } from './base';
import { concatMetricName } from './helpers';
import { ConvertOptions } from './types';

export const DEFAULT_CONVERT_OPTIONS: ConvertOptions = {
    captureTimestamp: 0,
    useDotNotation: true,
};

export function quantileToMetricSuffix(quantile: MetricValue): string {
    const n = parseFloat(quantile) * 100;
    const int = ('00' + Math.floor(n)).slice(-2);
    let suffix = '';
    const frac = n % 1;
    if (frac !== 0) {
        suffix = frac.toFixed(5).slice(2).replace(/0+$/g, '');
    }
    return `p${int}${suffix}`;
}

export function summaryToHecMetrics(metric: BucketedMetric, options: ConvertOptions): HecMetric[] {
    const base = convertBase(metric, options);

    return metric.buckets
        .map(
            ([quantile, value]): HecMetric => ({
                ...base,
                name: concatMetricName(base.name, quantileToMetricSuffix(quantile), options.useDotNotation),
                value,
            })
        )
        .concat([
            { ...base, name: concatMetricName(base.name, 'count', options.useDotNotation), value: metric.count },
            { ...base, name: concatMetricName(base.name, 'sum', options.useDotNotation), value: metric.sum },
        ]);
}
