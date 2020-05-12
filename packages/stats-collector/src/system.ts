import { Stats } from './types';

export class SystemStats {
    private lastCpuUsage?: NodeJS.CpuUsage;
    public flushStats(): Stats {
        const mem = process.memoryUsage();
        const nextBaseUsage = process.cpuUsage();
        const cpu = process.cpuUsage(this.lastCpuUsage);
        this.lastCpuUsage = nextBaseUsage;
        return {
            mem: {
                ...mem,
            },
            cpu: {
                ...cpu,
            },
            uptime: process.uptime(),
        };
    }
}
