/* eslint-disable no-console */
import { ManagedResource, waitForSignal, shutdownAll } from '../dist';
import { sleep } from '@splunkdlt/async-tasks';

// EXAMPLE:resource:START
class TestResource implements ManagedResource {
    // ...

    async shutdown() {
        console.log('Shutting down test resource');
        await sleep(500);
        console.log('Test resource shutdown complete');
    }
}
// EXAMPLE:resource:END

async function runMainBackgroundJob(testResource: TestResource) {
    // whatever
    console.log(testResource);

    await sleep(10000);
}

async function main() {
    // EXAMPLE:START
    const testResource = new TestResource();
    const resources = [testResource];
    try {
        await Promise.race([runMainBackgroundJob(testResource), waitForSignal('SIGINT'), waitForSignal('SIGHUP')]);
    } catch (e) {
        console.error('Caught unexpected error', e);
    } finally {
        const cleanShutdown = await shutdownAll(resources, 60_0000);
        console.log('Shutdown complete');
        process.exit(cleanShutdown ? 0 : 1);
    }
    // EXAMPLE:END
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
