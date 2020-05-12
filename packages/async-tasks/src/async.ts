export const sleep = (timeoutMS: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, timeoutMS));

export const delayed = <T>(task: () => Promise<T>, timeoutMS: number): Promise<T> => sleep(timeoutMS).then(task);

export const alwaysResolve = <T>(promise: Promise<T>): Promise<void> =>
    promise.then(
        () => {
            // noop
        },
        () => {
            // noop
        }
    );

export const neverResolve = <T = never>(): Promise<T> =>
    new Promise(() => {
        // noop
    });
