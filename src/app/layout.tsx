import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Sora, DM_Sans } from 'next/font/google';
import '../styles/tailwind.css';
import { Toaster } from 'sonner';
import ClientRecoveryProvider from '@/components/ClientRecoveryProvider';

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
  preload: true,
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
  preload: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1A6B3A',
};

export const metadata: Metadata = {
  title: 'AgriMart — Direct Farm-to-Retailer Marketplace',
  description:
    'AgriMart connects smallholder farmers directly with retailers using AI demand matching, eliminating middlemen and reducing agricultural waste across India.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
  other: {
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${dmSans.variable}`}>
      <head>
        {/* Preconnect to external image origins for ultra-fast LCP */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className={`${dmSans.className} antialiased selection:bg-emerald-500 selection:text-white`}>
        <ClientRecoveryProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '14px',
              },
            }}
          />
        </ClientRecoveryProvider>
      </body>
    </html>
  );
}