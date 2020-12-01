/** Number of milliseconds since epoch */
export type EpochMillis = number;

/**
 * A numeric value, preferrably expressed as a `number`, but if precision
 * is not sufficient then the number can be serialized as a string
 */
export type NumericValue = number | string;

export interface Metadata {
    host?: string;
    source?: string;
    sourcetype?: string;
    index?: string;
}

export type Fields = { [k: string]: any };

export interface Event {
    time: Date | EpochMillis;
    body: string | { [k: string]: any };
    fields?: Fields;
    metadata?: Metadata;
}

export interface Metric {
    time: Date | EpochMillis;
    name: string;
    value: NumericValue;
    fields?: Fields;
    metadata?: Metadata;
}

export interface MultiMetrics {
    time: Date | EpochMillis;
    measurements: { [name: string]: NumericValue | undefined };
    fields?: Fields;
    metadata?: Metadata;
}
