/* eslint-disable no-console */
import { exponentialBackoff, retry, sleep } from '@splunkdlt/async-tasks';

async function main() {
    let i = 0;
    async function performAsyncTask() {
        await sleep(Math.floor(1 + Math.random() * 4));
        if (++i < 5) {
            throw new Error('async task failed');
        }
        return 'result!';
    }

    // EXAMPLE:simple1:START
    const result = await retry(performAsyncTask, {
        attempts: 10,
        waitBetween: exponentialBackoff({ min: 10, max: 500 }),
    });
    // EXAMPLE:simple1:END
    console.log(result);

    await retry(performAsyncTask, {
        taskName: 'my task',
        warnOnError: true,
        waitBetween: 10,
    });
}

main().then(
    () => process.exit(0),
    (e) => {
        // eslint-disable-next-line no-console
        console.error(e);
        process.exit(0);
    }
);
