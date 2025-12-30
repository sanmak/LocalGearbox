/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { ToolLayout } from '@/components/ToolLayout';
import { reverseString } from '@/lib/tools';

export default function ReverseStringPage() {
  return (
    <ToolLayout
      toolName="Reverse String"
      toolDescription="Reverse the order of characters in a string."
      onProcess={reverseString}
      placeholder="Enter text to reverse..."
    />
  );
}
