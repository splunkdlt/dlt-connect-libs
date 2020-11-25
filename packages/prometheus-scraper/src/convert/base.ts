import { Fields, Metric as HecMetric } from '@splunkdlt/hec-client';
import { underscoreToDotNotation } from '../transform';
import { BaseMetric, ScalarMetric } from '../types';
import { concatMetricName } from './helpers';
import { ConvertOptions } from './types';

type Labels = Array<{ name: string; value: string }>;

export const convertTimestmapToHec = (ts: string | undefined, fallback: number): number => {
    if (ts != null) {
        const n = parseInt(ts, 10);
        if (isNaN(n)) {
            return fallback;
        }
        return n;
    }
    return fallback;
};

export const convertLabelsToHecFields = (labels: Labels): Fields =>
    labels ? Object.fromEntries(labels.map((l) => [l.name, l.value])) : {};

export function convertBase(
    metric: BaseMetric,
    { namePrefix, useDotNotation, captureTimestamp, metadata }: ConvertOptions
): Omit<HecMetric, 'value'> {
    const name = useDotNotation ? underscoreToDotNotation(metric.name) : metric.name;
    return {
        name: namePrefix ? concatMetricName(namePrefix, name, useDotNotation) : name,
        time: convertTimestmapToHec(metric.timestamp, captureTimestamp),
        fields: convertLabelsToHecFields(metric.labels),
        metadata: metadata,
    };
}

export function scalarToHecMetric(metric: ScalarMetric, options: ConvertOptions): HecMetric {
    return {
        ...convertBase(metric, options),
        value: metric.value,
    };
}
