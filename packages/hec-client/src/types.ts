/** Number of milliseconds since epoch */
export type EpochMillis = number;

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
    value: number;
    fields?: Fields;
    metadata?: Metadata;
}

export interface MultiMetrics {
    time: Date | EpochMillis;
    measurements: { [name: string]: number | undefined };
    fields?: Fields;
    metadata?: Metadata;
}
