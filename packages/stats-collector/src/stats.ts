import { createModuleDebug } from '@splunkdlt/debug-logging';
import { ManagedResource } from '@splunkdlt/managed-resource';
import { FlattenedStats, Stats, StatsSink, StatsSource } from './types';
import { SystemStats } from './system';

const { debug } = createModuleDebug('@splunkdlt/stats-collector:stats');

export function flatStats(m: Stats, prefix?: string): FlattenedStats {
    let result: FlattenedStats = [];
    for (const [name, value] of Object.entries(m)) {
        const fullName = prefix ? `${prefix}.${name}` : name;
        if (typeof value === 'number') {
            result.push({ name: fullName, value });
        } else {
            result = result.concat(flatStats(value, fullName));
        }
    }
    return result;
}

interface SourceHandle<S extends Stats> {
    source: StatsSource<S>;
    prefix?: string;
}

export class InternalStatsCollector implements ManagedResource {
    private readonly sources: SourceHandle<Stats>[] = [];
    private active: boolean = true;
    private collectTimer: NodeJS.Timer | null = null;

    constructor(
        public config: {
            collect: boolean;
            collectInterval: number;
            dest: StatsSink;
            basePrefix?: string;
            collectSystemStats?: boolean;
        }
    ) {
        if (config.collectSystemStats !== false) {
            this.addSource(new SystemStats(), 'system');
        }
    }

    public addSource<S extends Stats>(source: StatsSource<S>, prefix?: string) {
        this.sources.push({
            source,
            prefix: [this.config.basePrefix, prefix].filter((s) => !!s).join('.') || undefined,
        });
    }

    public collectStats(): FlattenedStats {
        return this.sources.flatMap((source) => flatStats(source.source.flushStats(), source.prefix));
    }

    private next = () => {
        this.collectTimer = null;
        const time = Date.now();
        const stats = this.collectStats();
        if (this.config.collect) {
            debug('Collecting stats from %d sources', this.sources.length);
            this.config.dest({
                time,
                measurements: Object.fromEntries(stats.map(({ name, value }) => [name, value])),
            });
        }
        this.start();
    };

    public start() {
        if (this.active && this.collectTimer == null) {
            this.collectTimer = setTimeout(this.next, this.config.collectInterval);
        }
    }

    public shutdown(): Promise<void> {
        this.active = false;
        if (this.collectTimer != null) {
            clearTimeout(this.collectTimer);
        }
        return Promise.resolve();
    }
}
