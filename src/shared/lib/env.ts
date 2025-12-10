export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sentryRelease: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  sentryOrg: process.env.SENTRY_ORG,
  sentryProject: process.env.SENTRY_PROJECT,
  sentryAuthToken: process.env.SENTRY_AUTH_TOKEN,
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

export function validateEnv(): void {
  const required: string[] = [];

  if (required.length > 0) {
    throw new Error(`Missing required environment variables: ${required.join(', ')}`);
  }
}
