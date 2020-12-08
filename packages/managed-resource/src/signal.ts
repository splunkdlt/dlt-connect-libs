import { AbortablePromise, withAbort } from '@splunkdlt/async-tasks';
import { createModuleDebug } from '@splunkdlt/debug-logging';

const { debug, warn } = createModuleDebug('@splunkdlt/managed-resource:signal');

export type Signal =
    | 'SIGABRT'
    | 'SIGALRM'
    | 'SIGBUS'
    | 'SIGCHLD'
    | 'SIGCONT'
    | 'SIGFPE'
    | 'SIGHUP'
    | 'SIGILL'
    | 'SIGINT'
    | 'SIGIO'
    | 'SIGIOT'
    | 'SIGKILL'
    | 'SIGPIPE'
    | 'SIGPOLL'
    | 'SIGPROF'
    | 'SIGPWR'
    | 'SIGQUIT'
    | 'SIGSEGV'
    | 'SIGSTKFLT'
    | 'SIGSTOP'
    | 'SIGSYS'
    | 'SIGTERM'
    | 'SIGTRAP'
    | 'SIGTSTP'
    | 'SIGTTIN'
    | 'SIGTTOU'
    | 'SIGUNUSED'
    | 'SIGURG'
    | 'SIGUSR1'
    | 'SIGUSR2'
    | 'SIGVTALRM'
    | 'SIGWINCH'
    | 'SIGXCPU'
    | 'SIGXFSZ'
    | 'SIGBREAK'
    | 'SIGLOST'
    | 'SIGINFO';

/** Returns a promise that resolves once the given signal is received */
export function waitForSignal(signal: Signal): Promise<void> {
    return new Promise((resolve) => {
        debug('Listening on signal %s', signal);
        process.once(signal, () => {
            warn(`Received signal ${signal}`);
            resolve();
        });
    });
}

class SignalError extends Error {
    constructor(signal: Signal) {
        const msg = `Received signal ${signal}`;
        super(msg);
        this.name = signal;
        this.message = msg;
        Error.captureStackTrace(this, this.constructor);
    }
}

class SignalHandle {
    private triggerResolve: (() => void) | undefined = undefined;
    public readonly promise: Promise<void>;
    constructor(public signal: Signal) {
        this.promise = new Promise((resolve) => {
            this.triggerResolve = resolve;
        });
    }
    private callback = () => {
        if (this.triggerResolve != null) {
            this.triggerResolve();
        }
    };
    public listen() {
        process.once(this.signal, this.callback);
    }
    public dispose() {
        process.off(this.signal, this.callback);
        this.triggerResolve = undefined;
    }
}

export function rejectOnFirstSignal(...signals: Signal[]): AbortablePromise<never> {
    return withAbort((handle) => {
        const handles = signals.map((sig) => new SignalHandle(sig));
        const promises = handles.map((h) => h.promise.then(() => Promise.reject(new SignalError(h.signal))));
        const result = handle.race(Promise.race(promises));
        result.catch((_) => {
            handles.forEach((h) => h.dispose());
        });
        return result;
    });
}

// export function raceSignal<T>(promise: Promise<T>, ...signals: Signal[]): Promise<T> {}
