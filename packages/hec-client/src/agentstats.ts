import { AgentStatus } from 'agentkeepalive';
import { Stats } from '@splunkdlt/stats-collector';

export function httpClientStats(agentStatus: AgentStatus): Stats {
    const {
        createSocketCount,
        createSocketErrorCount,
        closeSocketCount,
        errorSocketCount,
        requestCount,
        timeoutSocketCount,
    } = agentStatus;
    return {
        createSocketCount,
        createSocketErrorCount,
        closeSocketCount,
        errorSocketCount,
        requestCount,
        timeoutSocketCount,
    };
}
