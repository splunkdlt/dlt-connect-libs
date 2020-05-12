import { EpochMillis, Event, Metric, Metadata, MultiMetrics, Fields } from './types';

export type SerializedHecMsg = Buffer;

export function serializeTime(time: Date | EpochMillis): number {
    if (typeof time === 'string') {
        throw new Error(
            `Invalid event timestamp ${JSON.stringify(time)} - expected number (epoch millis) or Date object`
        );
    }
    if (time instanceof Date) {
        return +(time.getTime() / 1000).toFixed(3);
    }
    return +(time / 1000);
}

export function serializeEvent(event: Event, defaultMetadata?: Metadata, defaultFields?: Fields): SerializedHecMsg {
    return Buffer.from(
        JSON.stringify({
            time: serializeTime(event.time),
            event: event.body,
            fields: { ...defaultFields, ...event.fields },
            ...{ ...defaultMetadata, ...event.metadata },
        }),
        'utf-8'
    );
}

export function serializeMetric(metric: Metric, defaultMetadata?: Metadata, defaultFields?: Fields): SerializedHecMsg {
    return Buffer.from(
        JSON.stringify({
            time: serializeTime(metric.time),
            fields: {
                ...defaultFields,
                ...metric.fields,
                metric_name: metric.name,
                _value: metric.value,
            },
            ...{ ...defaultMetadata, ...metric.metadata },
        }),
        'utf-8'
    );
}

export function serializeMetrics(
    metrics: MultiMetrics,
    defaultMetadata?: Metadata,
    defaultFields?: Fields
): SerializedHecMsg {
    const measurements = Object.fromEntries(
        Object.entries(metrics.measurements).map(([key, value]) => [`metric_name:${key}`, value])
    );
    return Buffer.from(
        JSON.stringify({
            time: serializeTime(metrics.time),
            fields: {
                ...defaultFields,
                ...metrics.fields,
                ...measurements,
            },
            ...{ ...defaultMetadata, ...metrics.metadata },
        }),
        'utf-8'
    );
}
