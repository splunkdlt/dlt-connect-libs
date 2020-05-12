import { Stats } from './types';

// Calculate nth percentile with linear interpolation between closest ranks
function percentile(n: number, measurements: number[]): number {
    const len = measurements.length;
    const pos = (len * n) / 100 - 1;
    const lower = measurements[Math.max(0, Math.floor(pos))];
    return lower + (measurements[Math.min(Math.max(0, Math.ceil(pos)), len - 1)] - lower) * (pos % 1);
}

const memo = <T>(fn: () => T) => {
    let memoized: T | null = null;
    return () => (memoized != null ? memoized : (memoized = fn()));
};

export class AggregateMetric {
    private enabled: boolean = false;
    private measurements: number[] = [];

    public push(measurement: number) {
        if (this.enabled) {
            this.measurements.push(measurement);
        }
    }

    public enable() {
        this.enabled = true;
    }

    public disable() {
        this.enabled = false;
    }

    public flush(
        prefix: string,
        enabledAggregations: {
            min?: boolean;
            max?: boolean;
            count?: boolean;
            sum?: boolean;
            avg?: boolean;
            p80?: boolean;
            p90?: boolean;
            p95?: boolean;
            p99?: boolean;
        } = { min: true, max: true, avg: true, count: true, sum: true, p99: true }
    ): Stats {
        if (!this.enabled) {
            throw new Error('AggregateMetric is not enabled and cannot be flushed');
        }
        const measurements = this.measurements;
        this.measurements = [];
        const count = measurements.length;
        if (count === 0) {
            return enabledAggregations?.count ? { [`${prefix}.count`]: 0 } : {};
        }
        const last = measurements[count - 1];
        const sum = measurements.reduce((a, b) => a + b, 0);
        const sorted = memo(() => [...measurements].sort((a, b) => a - b));
        const stats = {
            count: enabledAggregations?.count ? count : undefined,
            sum: enabledAggregations?.sum ? sum : undefined,
            min: enabledAggregations?.min ? measurements.reduce((a, b) => Math.min(a, b), last) : undefined,
            max: enabledAggregations?.max ? measurements.reduce((a, b) => Math.max(a, b), last) : undefined,
            avg: enabledAggregations?.avg ? sum / count : undefined,
            p80: enabledAggregations?.p80 ? percentile(80, sorted()) : undefined,
            p90: enabledAggregations?.p90 ? percentile(90, sorted()) : undefined,
            p95: enabledAggregations?.p95 ? percentile(95, sorted()) : undefined,
            p99: enabledAggregations?.p99 ? percentile(99, sorted()) : undefined,
        };
        return Object.fromEntries(
            Object.entries(stats)
                .filter(([, value]) => value != null)
                .map(([name, value]) => [`${prefix}.${name}`, value])
        ) as Stats;
    }
}
