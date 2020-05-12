import { ABORT, AbortHandle } from './abort';
import { sleep } from './async';
import { createModuleDebug } from '@splunkdlt/debug-logging';
import { WaitTime, resolveWaitTime } from './wait';

const { debug, warn } = createModuleDebug('@splunkdlt/async-utils:retry');

/** Can be thrown by retryable task to abort retry loop */
export const RETRY_ABORT = Symbol('[[RETRY ABORT]]');

export class RetryTimeoutError extends Error {
    constructor(msg: string) {
        super(msg);
    }
}

export interface RetryOptions {
    /** Number of attempts to try */
    attempts?: number;
    /** Amount of time to wait between retries */
    waitBetween?: WaitTime;
    /** Task name - will be printed in (debug) log output */
    taskName?: string;
    /** Callback invoked when before retrying (not invoked before the first execution) */
    onRetry?: (attempt: number) => void;
    /** Callback invoked after each task failure */
    onError?: <E extends Error>(e: E, attempt: number) => void;
    /** Supply an abort handle to control when to abort the retry loop */
    abortHandle?: AbortHandle;
    /** Print a warning log message each time the task fails */
    warnOnError?: boolean;
    /** Optional time limit for retry loop - when reached no more retry attempts will be made. It will not cancel attempts that are inflight.  */
    timeout?: number;
}

/**
 * Helper to retry a given task multiple times
 *
 * @param task a function triggering the exection of the asynchronous task
 * @param options options configuring retry behavior
 */
export async function retry<R>(
    task: () => Promise<R>,
    {
        attempts = Infinity,
        waitBetween = 1000,
        taskName = 'anonymous task',
        onRetry,
        onError,
        abortHandle = new AbortHandle(),
        warnOnError = false,
        timeout,
    }: RetryOptions = {}
): Promise<R> {
    const startTime = Date.now();
    let attempt = 0;
    while (attempt < attempts) {
        if (abortHandle.aborted) {
            debug('[%s] Received abort signal', taskName);
            throw RETRY_ABORT;
        }
        attempt++;
        if (attempt > 1) {
            debug(`[%s] Retrying attempt %d`, taskName, attempt);
        }
        try {
            if (attempt > 1 && onRetry != null) {
                onRetry(attempt);
            }
            const res = await abortHandle.race(task());
            debug('Task %s succeeded after %d ms at attempt# %d', taskName, Date.now() - startTime, attempt);
            return res;
        } catch (e) {
            if (onError != null) {
                onError(e, attempt);
            }
            if (e === RETRY_ABORT || e === ABORT) {
                debug('[%s] Retry loop aborted', taskName);
                throw RETRY_ABORT;
            }
            (warnOnError ? warn : debug)('Task %s failed: %s', taskName, e.toString());
            if (abortHandle.aborted) {
                throw RETRY_ABORT;
            }
            if (timeout != null && Date.now() - startTime > timeout) {
                throw new RetryTimeoutError(e.toString());
            }
            if (attempt < attempts) {
                const waitTime = resolveWaitTime(waitBetween, attempt);
                debug('[%s] Waiting for %d ms before retrying', taskName, waitTime);
                await abortHandle.race(sleep(waitTime));
            } else {
                throw e;
            }
        }
    }
    throw new Error(`Retry loop ended [${taskName}]`);
}
