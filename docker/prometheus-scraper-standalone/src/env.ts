import { ConfigError } from './config';

export function env(variable: string, defaultValue?: string): string {
    const val = process.env[variable];
    if (val == null) {
        if (defaultValue != null) {
            return defaultValue;
        }
        throw new ConfigError(`Missing required environment variable ${variable}`);
    }
    return val;
}

export function envOpt(variable: string, defaultValue?: string): string | undefined {
    const val = process.env[variable];
    if (val == null) {
        if (defaultValue != null) {
            return defaultValue;
        }
    }
    return val;
}

export const envBool = (variable: string, defaultValue?: boolean): boolean => {
    const val = process.env[variable];
    if (val == null) {
        if (defaultValue != null) {
            return defaultValue;
        }
        throw new ConfigError(`Missing required environment variable ${variable}`);
    }

    switch (val.trim().toLowerCase()) {
        case 'true':
        case '1':
        case 'on':
        case 'yes':
            return true;
        case 'false':
        case '0':
        case 'off':
        case 'no':
            return false;
        default:
            throw new ConfigError(`Invalid value ${JSON.stringify(val)} for boolean environment variable ${variable}`);
    }
};

export const envInt = (variable: string, defaultValue?: number): number => {
    return defaultValue!;
};
