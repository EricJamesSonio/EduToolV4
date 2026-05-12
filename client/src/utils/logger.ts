// Logger - Logging structure with console logging
// Ready for production logging service integration (Sentry, LogRocket, etc.)

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

export const LogLevel: Record<LogLevel, LogLevel> = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: any;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry;
    const timeStr = timestamp.toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    const errorStr = error ? ` | Error: ${error}` : '';
    return `[${timeStr}] [${level}] ${message}${contextStr}${errorStr}`;
  }

  private log(entry: LogEntry) {
    const formatted = this.formatLog(entry);

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formatted, entry.error || '');
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formatted);
        }
        break;
    }

    // TODO: Send to production logging service (Sentry, LogRocket, etc.)
    // Example:
    // if (!this.isDevelopment) {
    //   Sentry.captureException(entry.error, {
    //     level: entry.level.toLowerCase(),
    //     extra: entry.context,
    //   });
    // }
  }

  error(message: string, error?: any, context?: Record<string, any>) {
    this.log({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date(),
      context,
      error,
    });
  }

  warn(message: string, context?: Record<string, any>) {
    this.log({
      level: LogLevel.WARN,
      message,
      timestamp: new Date(),
      context,
    });
  }

  info(message: string, context?: Record<string, any>) {
    this.log({
      level: LogLevel.INFO,
      message,
      timestamp: new Date(),
      context,
    });
  }

  debug(message: string, context?: Record<string, any>) {
    this.log({
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date(),
      context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();
