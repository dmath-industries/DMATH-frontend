import HawkCatcher from '@hawk.so/javascript';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private enabled = process.env.NODE_ENV !== 'test';
  private hawk: HawkCatcher | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const windowWithHawk = window as typeof window & { hawk?: HawkCatcher };
      if (windowWithHawk.hawk) {
        this.hawk = windowWithHawk.hawk;
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.enabled) return;
    console.debug(`[DEBUG] ${message}`, context);
  }

  info(message: string, context?: LogContext): void {
    if (!this.enabled) return;
    console.info(`[INFO] ${message}`, context);
  }

  warn(message: string, context?: LogContext): void {
    if (!this.enabled) return;
    console.warn(`[WARN] ${message}`, context);
    
    if (this.hawk) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.hawk.send(message, context as any);
      } catch (err) {
        console.warn('Failed to send warning to Hawk:', err);
      }
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.enabled) return;
    console.error(`[ERROR] ${message}`, error, context);
    
    if (this.hawk) {
      try {
        if (error) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.hawk.send(error, { message, ...context } as any);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.hawk.send(message, context as any);
        }
      } catch (err) {
        console.warn('Failed to send error to Hawk:', err);
      }
    }
  }
}

export const logger = new Logger();

