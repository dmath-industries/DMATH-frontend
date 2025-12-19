import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import Header from '@/components/Header';
import { env } from '@/shared/lib';

export const metadata: Metadata = {
  title: 'DMath - Graph Visualizer',
  description: 'Учебный калькулятор и визуализатор алгоритмов дискретной математики',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DMath',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#171717',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {/* Google tag (gtag.js) */}
        {env.ga4Id && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${env.ga4Id}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${env.ga4Id}', {
                  ${env.isDev ? 'debug_mode: true,' : ''}
                });
              `}
            </Script>
          </>
        )}
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
