import type { NextConfig } from 'next';
import withPWA from 'next-pwa';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: 'standalone',
  productionBrowserSourceMaps: true,
};

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst' as const,
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst' as const,
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'StaleWhileRevalidate' as const,
      options: {
        cacheName: 'next-static',
      },
    },
    {
      urlPattern: /\/_next\/data\/.*/i,
      handler: 'StaleWhileRevalidate' as const,
      options: {
        cacheName: 'next-data',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: ({ request }: { request: Request; url: URL }) => request.mode === 'navigate',
      handler: 'StaleWhileRevalidate' as const,
      options: {
        cacheName: 'pages',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: ({ request }: { request: Request; url: URL }) =>
        request.mode !== 'navigate' &&
        !request.url.match(/\/_next\//) &&
        !request.url.match(/\.(?:png|jpg|jpeg|svg|gif|webp)$/i),
      handler: 'NetworkFirst' as const,
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60,
        },
        networkTimeoutSeconds: 5,
      },
    },
  ],
  fallbacks: {
    document: '/',
  },
  disable: false,
};

const shouldEnablePWA = process.env.NODE_ENV === 'production' || process.env.ENABLE_PWA === 'true';

let config = nextConfig;
if (shouldEnablePWA) {
  config = withPWA(pwaConfig)(config);
}

const sentryWebpackPluginOptions = {
  silent: true,
  widenClientFileUpload: true,

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  sourcemaps: {
    assets: ['./.next/static/**/*'],
    ignore: ['node_modules'],
  },

  release: {
    name: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  },

  telemetry: false,
};

export default withSentryConfig(config, sentryWebpackPluginOptions);
