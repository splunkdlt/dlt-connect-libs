export interface Stats {
    [k: string]: number | Stats;
}

export interface StatsSource<S extends Stats> {
    enableStatsCapture?(): void;
    flushStats(): S;
}

export type FlattenedStats = Array<{ name: string; value: number }>;

export type StatsSink = (metrics: {
    time: number | Date;
    measurements: { [name: string]: number | undefined };
}) => void;
