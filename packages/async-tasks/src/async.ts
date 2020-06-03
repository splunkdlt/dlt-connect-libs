/** Returns a promise that resolves after the given amount of time (in milliseconds) */
export const sleep = (timeoutMS: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, timeoutMS));

/** Returns a promise executing the given task after the given delay */
export const delayed = <T>(task: () => Promise<T>, timeoutMS: number): Promise<T> => sleep(timeoutMS).then(task);

/** Returns a version of the given promise that will not reject, but rather resolve in both the successful and error case */
export const alwaysResolve = <T>(promise: Promise<T>): Promise<void> =>
    promise.then(
        () => {
            // noop
        },
        () => {
            // noop
        }
    );

/** Returns a promise that will never fullfil (neither resolve nor reject) */
export const neverResolve = <T = never>(): Promise<T> =>
    new Promise(() => {
        // noop
    });
