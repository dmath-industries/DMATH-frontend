import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: 'standalone',
};

const pwaConfig = {
  dest: "public",
  register: true, 
  skipWaiting: true, 
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst" as const,
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, 
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: "CacheFirst" as const,
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, 
        },
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "StaleWhileRevalidate" as const,
      options: {
        cacheName: "next-static",
      },
    },
    {
      urlPattern: ({ request }: { request: Request; url: URL }) => request.mode === "navigate",
      handler: "NetworkFirst" as const,
      options: {
        cacheName: "pages",
        expiration: {
          maxEntries: 50, 
          maxAgeSeconds: 7 * 24 * 60 * 60, 
        },
        networkTimeoutSeconds: 3, 
      },
    },
  ],
  fallbacks: {
    document: "/",
  },
};

const shouldEnablePWA = 
  process.env.NODE_ENV === "production" || 
  process.env.ENABLE_PWA === "true";

let config = nextConfig;
if (shouldEnablePWA) {
  config = withPWA(pwaConfig)(config);
}

export default config;
