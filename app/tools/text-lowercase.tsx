/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { ToolLayout } from '@/components/ToolLayout';
import { textToLowercase } from '@/lib/tools';

export default function TextLowercasePage() {
  return (
    <ToolLayout
      toolName="Lowercase"
      toolDescription="Convert all text to lowercase letters."
      onProcess={textToLowercase}
      placeholder="Enter text to convert..."
    />
  );
}
