/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import type { Metadata } from 'next';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: 'Tools | LocalGearbox',
  description: 'Developer tools for formatting, validation, and conversion',
};

export default function ToolLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
