/** A function dynamically computing the time to wait beteween retry attempts */
export type WaitTimeFn = (attempt: number) => number;

/** Wait time is either a function (WaitTimeFn) or an absolute number of milliseconds */
export type WaitTime = WaitTimeFn | number;

/** Retruens the number of milliseonds to wait for a given waitTime and attempt number (1-based) */
export function resolveWaitTime(waitTime: WaitTime, attempt: number): number {
    return typeof waitTime === 'function' ? waitTime(attempt) : waitTime;
}

export const exponentialBackoff = ({ min, max }: { min: number; max?: number }): WaitTimeFn =>
    function exponentialBackoffFn(attempt: number) {
        const t = Math.round(Math.random() * min * Math.pow(2, attempt));
        return max != null ? Math.min(max, t) : t;
    };

export const linearBackoff = ({ min, max, step }: { min: number; max: number; step: number }): WaitTimeFn =>
    function linearBackoffFn(attempt: number) {
        return Math.min(max, min + (attempt - 1) * step);
    };
