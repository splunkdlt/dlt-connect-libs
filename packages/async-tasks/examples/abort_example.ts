/* eslint-disable no-console */
import { AbortHandle, sleep } from '@splunkdlt/async-tasks';

async function main() {
    // EXAMPLE:START
    const abortHandle = new AbortHandle();

    setTimeout(() => abortHandle.abort(), 100);

    const start = Date.now();
    try {
        await abortHandle.race(sleep(1000));
    } catch (e) {
        if (abortHandle.aborted) {
            console.log('Aborted!');
        }
    }

    console.log('Complete after', Date.now() - start, 'ms');
    // EXAMPLE:END
}

main().then(
    () => process.exit(0),
    (e) => {
        // eslint-disable-next-line no-console
        console.error(e);
        process.exit(0);
    }
);
