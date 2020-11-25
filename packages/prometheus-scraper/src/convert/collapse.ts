import { Metric as HecMetric, MultiMetrics } from '@splunkdlt/hec-client';
import { createModuleDebug } from '@splunkdlt/debug-logging';

const { debug } = createModuleDebug('@splunkdlt/prometheus-scraper:convert');

export interface CollapseOptions {
    /**
     * Maximum number of metric values to collapse into a single multi-metrics object.
     * The purpose of this limit is to reduce the likelyhood of overflowing the size
     * limit of the HTTP body of HEC requests.
     */
    maxMetrics: number;
}

export const COLLAPSE_DEFAULTS = { maxMetrics: 250 };

const normalizeTime = (t: number | Date): string => String(t instanceof Date ? t.getTime() : t);

export function encodeMultiMetricId(m: HecMetric): string {
    const dims: string[] = [];
    if (m.fields != null) {
        const keys = Object.keys(m.fields);
        keys.sort();
        for (const key of keys) {
            dims.push(`${key}=${m.fields[key]}`);
        }
    }
    const meta: string[] = [];
    if (m.metadata != null) {
        if (m.metadata.index != null) {
            meta.push(`index=${m.metadata.index}`);
        }
        if (m.metadata.host != null) {
            meta.push(`host=${m.metadata.host}`);
        }
        if (m.metadata.source != null) {
            meta.push(`source=${m.metadata.source}`);
        }
        if (m.metadata.sourcetype != null) {
            meta.push(`sourcetype=${m.metadata.sourcetype}`);
        }
    }
    return `${normalizeTime(m.time)}|${meta.join(';')}|${dims.join(';')}`;
}

/** Combine a list of HEC metrics into multi-metrics objects based on their dimensions and timestamp */
export function collapseIntoMultiMetrics(
    metrics: HecMetric[],
    { maxMetrics }: CollapseOptions = COLLAPSE_DEFAULTS
): MultiMetrics[] {
    const complete: MultiMetrics[] = [];
    const mmm = new Map<string, MultiMetrics>();
    for (const metric of metrics) {
        const key = encodeMultiMetricId(metric);
        const multiMetric = mmm.get(key);
        if (multiMetric == null) {
            mmm.set(key, {
                time: metric.time,
                fields: metric.fields,
                measurements: { [metric.name]: metric.value },
                metadata: metric.metadata,
            });
        } else {
            if (metric.name in multiMetric.measurements) {
                debug('Ignoring duplicate metric name %s', metric.name);
            } else {
                multiMetric.measurements[metric.name] = metric.value;

                if (Object.keys(multiMetric.measurements).length > maxMetrics) {
                    complete.push(multiMetric);
                    mmm.delete(key);
                }
            }
        }
    }
    return [...complete, ...mmm.values()];
}
