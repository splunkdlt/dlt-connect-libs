# @splunkdlt/async-tasks

Generic helpers around asynchronous tasks, parallel execution, retrying and aborting them.

### Retrying asynchronous tasks

The library provides a helper function `retry()` that allows to execute asynchronous tasks with retries when the task fails.

Example:

<!-- EXAMPLE:retry_example:simple1:START -->

```typescript
const result = await retry(performAsyncTask, {
    attempts: 10,
    waitBetween: exponentialBackoff({ min: 10, max: 500 }),
});
```

<!-- EXAMPLE:retry_example:simple1:END -->

### Parallel execution of tasks

A helper function called `parallel()` can help execute a list of asynchronous tasks in parallel allowing only a certain number of tasks to run at the same time. This is conceptually similar to an execution pool, allowing for constraining the resources used be a set of tasks.

Example:

<!-- EXAMPLE:parallel_example:START -->

```typescript
const TASKS = [...Array(10)].map((_, i) => async () => {
    const taskNumber = i + 1;
    console.log('Starting task', taskNumber);
    await sleep(100 + Math.floor(Math.random() * 1000));
    console.log('Completed task', taskNumber);
    return taskNumber;
});

const results = await parallel(TASKS, { maxConcurrent: 3 });

console.log(results); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
```

<!-- EXAMPLE:parallel_example:END -->

### AbortHandle

Another aspect of this library deals with aborting the execution of asynchronous tasks. An `AbortHandle` is the primitive this libaray provides to make it happen - it tracks the aborted-state and allows to register callbacks when an abort is triggered. An `abortHandle` can also be passed to both `parallel()` and `retry()`.

Example:

<!-- EXAMPLE:abort_example:START -->

```typescript
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
```

<!-- EXAMPLE:abort_example:END -->
