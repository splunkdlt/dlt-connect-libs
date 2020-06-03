# @splunkdlt/hec-client

Flexible client library for Splunk HTTP Event Collector (HEC) with support for sending metrics and events, batching, compression, keep-alives and retries.

## Install and Use

```sh-session
npm i @splunkdlt/hec-client

# or

yarn add @splunkdlt/hec-client
```

Example: sending some metrics to HEC:

<!-- EXAMPLE:system-metrics:START -->

```typescript
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
```

<!-- EXAMPLE:system-metrics:END -->
