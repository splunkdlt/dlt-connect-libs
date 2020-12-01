import { Metric as HecMetric, MultiMetrics } from '@splunkdlt/hec-client';
import { NumericValue } from '@splunkdlt/hec-client/dist/types';
import { Metric } from '../types';
import { scalarToHecMetric } from './base';
import { collapseIntoMultiMetrics, CollapseOptions, COLLAPSE_DEFAULTS } from './collapse';
import { histogramToHecMetrics } from './histogram';
import { summaryToHecMetrics } from './summary';
import { ConvertOptions } from './types';

export { ConvertOptions, CollapseOptions };

export const DEFAULT_CONVERT_OPTIONS: ConvertOptions = {
    captureTimestamp: 0,
    useDotNotation: true,
};

const isInvalidValue = (value: NumericValue): boolean => typeof value === 'string' && value.toLowerCase() === 'nan';

export function convertMetricToHec(prometheusMetric: Metric, options: Partial<ConvertOptions> = {}): HecMetric[] {
    const effectiveOptions = {
        ...DEFAULT_CONVERT_OPTIONS,
        captureTimestamp: Date.now(),
        ...options,
    };
    switch (prometheusMetric.type) {
        case 'counter':
        case 'gauge':
            return [scalarToHecMetric(prometheusMetric, effectiveOptions)];
        case 'summary':
            return summaryToHecMetrics(prometheusMetric, effectiveOptions);
        case 'histogram':
            return histogramToHecMetrics(prometheusMetric, effectiveOptions);
        default:
            throw new Error(`Invalid prometheus metric type: ${prometheusMetric.type}`);
    }
}

export function convertToHecMetrics(metrics: Metric[], options: Partial<ConvertOptions> = {}): HecMetric[] {
    return metrics.map((m) => convertMetricToHec(m, options)).reduce((a, b) => [...a, ...b], []);
}

/** Converts a list of prometheus metrics to HEC metrics, collapsing them into multi-metrics objects based on matching metadata */
export function convertToHecMultiMetrics(
    metrics: Metric[],
    convertOptions: Partial<ConvertOptions> = {},
    collapseOptions: Partial<CollapseOptions> = {}
): MultiMetrics[] {
    return collapseIntoMultiMetrics(
        convertToHecMetrics(metrics, convertOptions).filter((m) => !isInvalidValue(m.value)),
        { ...COLLAPSE_DEFAULTS, ...collapseOptions }
    );
}
