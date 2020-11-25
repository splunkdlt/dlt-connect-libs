import { Metric as HecMetric } from '@splunkdlt/hec-client';

export type TransformFn = (metric: HecMetric) => HecMetric;

const noop: TransformFn = (m) => m;

export const combine = (a: TransformFn, b: TransformFn): TransformFn => (metric: HecMetric) => a(b(metric));

export const combineAll = (...transforms: TransformFn[]) => transforms.reduce((res, cur) => combine(res, cur), noop);

export const underscoreToDotNotation = (name: string) => name.replace(/_/g, '.');

export const transformUnderscoreToDotNotation: TransformFn = (metric: HecMetric) => {
    return {
        ...metric,
        name: underscoreToDotNotation(metric.name),
    };
};
