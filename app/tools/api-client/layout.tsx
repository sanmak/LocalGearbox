/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Client',
  description: 'Enterprise-grade API client for testing and debugging REST APIs.',
};

export default function ApiClientLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
