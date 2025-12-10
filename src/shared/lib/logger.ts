import * as Sentry from '@sentry/nextjs';

interface LogContext {
  [key: string]: unknown;
}

const getSentryLogger = () => {
  try {
    const { logger } = Sentry;
    return logger;
  } catch {
    return null;
  }
};

class Logger {
  private enabled = process.env.NODE_ENV !== 'test';
  private sentryLogger = getSentryLogger();

  trace(message: string, context?: LogContext): void {
    if (!this.enabled) return;
    if (this.sentryLogger) {
      this.sentryLogger.trace(message, context);
    } else {
      console.trace(`[TRACE] ${message}`, context);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.enabled) return;
    if (this.sentryLogger) {
      if (this.sentryLogger.fmt) {
        this.sentryLogger.debug(this.sentryLogger.fmt`${message}`, context);
      } else {
        this.sentryLogger.debug(message, context);
      }
    } else {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  info(message: string, context?: LogContext): void {
    if (!this.enabled) return;
    if (this.sentryLogger) {
      this.sentryLogger.info(message, context);
    } else {
      console.info(`[INFO] ${message}`, context);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (!this.enabled) return;
    if (this.sentryLogger) {
      this.sentryLogger.warn(message, context);
    } else {
      console.warn(`[WARN] ${message}`, context);
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: context,
      });
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.enabled) return;

    if (error) {
      Sentry.captureException(error, {
        extra: { message, ...context },
      });
    }

    if (this.sentryLogger) {
      this.sentryLogger.error(message, {
        ...(error && { error: error.message, stack: error.stack }),
        ...context,
      });
    } else {
      console.error(`[ERROR] ${message}`, error, context);
      if (!error) {
        Sentry.captureMessage(message, {
          level: 'error',
          extra: context,
        });
      }
    }
  }

  fatal(message: string, context?: LogContext): void {
    if (!this.enabled) return;
    if (this.sentryLogger) {
      this.sentryLogger.fatal(message, context);
    } else {
      console.error(`[FATAL] ${message}`, context);
      Sentry.captureMessage(message, {
        level: 'fatal',
        extra: context,
      });
    }
  }
}

export const logger = new Logger();
