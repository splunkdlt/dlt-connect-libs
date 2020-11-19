export class ParserError extends Error {
    public readonly cause?: Error;
    constructor(message: string, cause?: Error) {
        super(message);
        this.name = this.constructor.name;
        this.message = message;
        if (cause) {
            this.stack = cause.stack;
            this.cause = cause;
        } else if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = new Error(message).stack;
        }
    }
}
