import { HecClient } from '@splunkdlt/hec-client';
import * as os from 'os';

async function sendSystemMetrics() {
    // EXAMPLE:START
    const hec = new HecClient({
        url: 'https://http-inputs-acme.splunkcloud.com',
        token: '12345678-9999-4711-0815-C0FF33C0FFEE',
    });

    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();

    hec.pushMetrics({
        time: Date.now(),
        measurements: {
            'myapp.cpu.user': cpu.user,
            'myapp.cpu.system': cpu.system,
            'myapp.mem.heapUsed': mem.heapUsed,
            'myapp.mem.heapTotal': mem.heapTotal,
        },
        fields: {
            hostname: os.hostname(),
        },
        metadata: {
            index: 'mymetrics',
            sourcetype: 'myapp:system',
            source: 'myapp',
        },
    });

    await hec.flush();
    // EXAMPLE:END
}

sendSystemMetrics().then(
    () => process.exit(0),
    (e) => {
        // eslint-disable-next-line no-console
        console.error(e);
        process.exit(1);
    }
);
