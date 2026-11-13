import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { AppProviders } from '@/components/providers/app-providers';
import './globals.css';

const interFont = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Doctor Tracker', template: '%s · Doctor Tracker' },
  description: 'Secure admin console for managing doctors, patients and care analytics.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a111d' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={interFont.variable} suppressHydrationWarning>
      <body className="min-h-dvh font-sans text-sm">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
