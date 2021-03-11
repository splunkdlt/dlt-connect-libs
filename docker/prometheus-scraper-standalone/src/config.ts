export class ConfigError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = 'ConfigError';
        this.message = msg;
    }
}
