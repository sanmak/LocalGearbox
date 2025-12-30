/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { Metadata } from 'next';
import { ClientNavigation } from '@/components/ClientNavigation';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { WebVitals } from '@/components/WebVitals';

import { TEXTS } from '@/lib/constants/texts';

export const metadata: Metadata = {
  title: {
    template: `%s${TEXTS.metadata.titleSuffix}`,
    default: TEXTS.metadata.defaultTitle,
  },
  description: TEXTS.metadata.defaultDescription,
  keywords: TEXTS.metadata.keywords,
  authors: [{ name: TEXTS.metadata.author }],
  manifest: '/manifest.json',
  openGraph: {
    title: TEXTS.metadata.ogTitle,
    description: TEXTS.metadata.ogDescription,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TEXTS.metadata.ogTitle,
    description: TEXTS.metadata.ogDescription,
  },
};

import { Toaster } from '@/components/ui/toaster';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ServiceWorkerRegistration />
        <WebVitals />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:border focus:border-border focus:rounded-md focus:top-4 focus:left-4"
        >
          {TEXTS.layout.skipToMain}
        </a>
        <ClientNavigation />
        <main id="main-content">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
