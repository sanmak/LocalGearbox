/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { ToolLayout } from '@/components/ToolLayout';
import { stringToLines } from '@/lib/tools';

export default function StringToLinesPage() {
  return (
    <ToolLayout
      toolName="String to Lines"
      toolDescription="Split text into lines and get the total line count. Useful for analyzing multi-line text content."
      onProcess={stringToLines}
      placeholder="Enter multi-line text..."
    />
  );
}
