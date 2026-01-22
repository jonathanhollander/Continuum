/**
 * Structured Logging Utility for Continuum Frontend
 * Implements Issue #21
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}

class Logger {
    private level: LogLevel = LogLevel.INFO;

    constructor() {
        // In development, default to DEBUG. In production, INFO.
        if (import.meta.env?.DEV) {
            this.level = LogLevel.DEBUG;
        }
    }

    setLevel(level: LogLevel) {
        this.level = level;
    }

    private formatMessage(level: string, message: string, data?: any) {
        const timestamp = new Date().toISOString();
        const payload = {
            timestamp,
            level,
            message,
            ...(data && { data })
        };
        return payload;
    }

    debug(message: string, data?: any) {
        if (this.level <= LogLevel.DEBUG) {
            const payload = this.formatMessage('DEBUG', message, data);
            console.debug(`[${payload.timestamp}] [DEBUG] ${message}`, data || '');
        }
    }

    info(message: string, data?: any) {
        if (this.level <= LogLevel.INFO) {
            const payload = this.formatMessage('INFO', message, data);
            console.info(`[${payload.timestamp}] [INFO] ${message}`, data || '');
        }
    }

    warn(message: string, data?: any) {
        if (this.level <= LogLevel.WARN) {
            const payload = this.formatMessage('WARN', message, data);
            console.warn(`[${payload.timestamp}] [WARN] ${message}`, data || '');
        }
    }

    error(message: string, error?: any) {
        if (this.level <= LogLevel.ERROR) {
            const payload = this.formatMessage('ERROR', message, error);
            console.error(`[${payload.timestamp}] [ERROR] ${message}`, error || '');
        }
    }
}

export const logger = new Logger();
