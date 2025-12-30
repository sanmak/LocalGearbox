/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { ToolLayout } from '@/components/ToolLayout';
import { removeWhitespace } from '@/lib/tools';

export default function RemoveWhitespacePage() {
  return (
    <ToolLayout
      toolName="Remove Whitespace"
      toolDescription="Remove all whitespace characters (spaces, tabs, newlines) from text. Useful for compacting data."
      onProcess={removeWhitespace}
      placeholder="Enter text with whitespace..."
    />
  );
}
