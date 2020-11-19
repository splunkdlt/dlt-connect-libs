export type MetricName = string;

export type MetricValue = string;

export interface BaseMetric {
    name: MetricName;
    help?: string;
    timestamp?: string;
    labels: Array<{ name: string; value: string }>;
}

export interface ScalarMetric extends BaseMetric {
    type: 'counter' | 'gauge' | 'untyped';
    value: MetricValue;
}

/** A bucket pair: threshold (le or quantile) and value */
export type Bucket = [MetricValue, MetricValue];

export interface BucketedMetric extends BaseMetric {
    type: 'histogram' | 'summary';
    buckets: Bucket[];
    count: MetricValue;
    sum: MetricValue;
}

export type Metric = ScalarMetric | BucketedMetric;
