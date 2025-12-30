/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { TopNavigation } from './TopNavigation';
import { ThemeProvider } from './ThemeProvider';

export function ClientNavigation() {
  return (
    <ThemeProvider>
      <TopNavigation />
    </ThemeProvider>
  );
}
