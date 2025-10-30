export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  hawkToken: process.env.NEXT_PUBLIC_HAWK_TOKEN,
  hawkRelease: process.env.NEXT_PUBLIC_HAWK_RELEASE,
  gaId: process.env.NEXT_PUBLIC_GA_ID,
  plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

export function validateEnv(): void {
  const required: string[] = [];
  
  if (required.length > 0) {
    throw new Error(
      `Missing required environment variables: ${required.join(', ')}`
    );
  }
}

