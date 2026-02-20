type LogLevel = 'info' | 'warn' | 'error';

class LoggerService {
    private static instance: LoggerService;

    private constructor() { }

    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    private formatMessage(level: LogLevel, message: string, data?: any): string {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    }

    public info(message: string, data?: any) {
        console.log(this.formatMessage('info', message), data || '');
    }

    public warn(message: string, data?: any) {
        console.warn(this.formatMessage('warn', message), data || '');
    }

    public error(message: string, error?: any) {
        console.error(this.formatMessage('error', message), error || '');
        // In a real app, you would send this to Sentry/LogRocket/etc.
    }
}

export const logger = LoggerService.getInstance();
