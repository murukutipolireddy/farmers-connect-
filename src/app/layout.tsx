import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Sora, DM_Sans } from 'next/font/google';
import '../styles/tailwind.css';
import { Toaster } from 'sonner';

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'AgriMart — Direct Farm-to-Retailer Marketplace',
  description:
    'AgriMart connects smallholder farmers directly with retailers using AI demand matching, eliminating middlemen and reducing agricultural waste across India.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

import ClientRecoveryProvider from '@/components/ClientRecoveryProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${dmSans.variable}`}>
      <body className={dmSans.className}>
        <ClientRecoveryProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3500,
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