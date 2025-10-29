declare module "next-pwa" {
  import { NextConfig } from "next";

  interface RuntimeCaching {
    urlPattern: RegExp | ((options: { request: Request; url: URL }) => boolean);
    handler: "CacheFirst" | "NetworkFirst" | "StaleWhileRevalidate" | "NetworkOnly" | "CacheOnly";
    options?: {
      cacheName?: string;
      expiration?: {
        maxEntries?: number;
        maxAgeSeconds?: number;
      };
      networkTimeoutSeconds?: number;
    };
  }

  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    runtimeCaching?: RuntimeCaching[];
    fallbacks?: {
      document?: string;
      image?: string;
      font?: string;
      audio?: string;
      video?: string;
    };
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;

  export default withPWA;
}

