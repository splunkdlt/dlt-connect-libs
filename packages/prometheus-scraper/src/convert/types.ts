import { Metadata } from '@splunkdlt/hec-client';

export interface ConvertOptions {
    /** Timestamp to use for metrics that don't explicitly specify a timestamp */
    captureTimestamp: number;
    /** Convert underscore-separated (snake_case) metric names to dot-separated names */
    useDotNotation: boolean;
    /** A common prefix to use in front of every metric name */
    namePrefix?: string;
    /** Metadata to apply to each metric */
    metadata?: Metadata;
}
