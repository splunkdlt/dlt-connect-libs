/* eslint-disable no-console */
import { parallel, sleep } from '@splunkdlt/async-tasks';

async function main() {
    // EXAMPLE:START
    const TASKS = [...Array(10)].map((_, i) => async () => {
        const taskNumber = i + 1;
        console.log('Starting task', taskNumber);
        await sleep(100 + Math.floor(Math.random() * 1000));
        console.log('Completed task', taskNumber);
        return taskNumber;
    });

    const results = await parallel(TASKS, { maxConcurrent: 3 });

    console.log(results); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
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
