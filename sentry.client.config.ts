import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enableLogs: true,
  tracesSampleRate: 1.0,
  debug: false,

  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],

  environment: process.env.NODE_ENV || 'production',
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  beforeSend(event) {
    console.log('🔴 Sentry отправляет событие:', {
      message: event.message || event.exception?.values?.[0]?.value,
      release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
      stacktrace: event.exception?.values?.[0]?.stacktrace?.frames?.slice(0, 3),
    });
    return event;
  },
});

if (typeof window !== 'undefined') {
  (window as any).testSentryError = (message?: string) => {
    try {
      if (message) {
        const error = new Error(`Test Sentry Error: ${message}`);
        Sentry.captureException(error, {
          tags: {
            source: 'console',
            test: true,
          },
        });
        throw error;
      } else {
        // @ts-expect-error - намеренная ошибка для теста
        const test = undefinedVariable.property;
        return test;
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          source: 'console',
          test: true,
        },
      });
      throw error;
    }
  };

  console.log('Call testSentryError() to test the error');
}
