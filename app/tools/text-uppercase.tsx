/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { ToolLayout } from '@/components/ToolLayout';
import { textToUppercase } from '@/lib/tools';

export default function TextUppercasePage() {
  return (
    <ToolLayout
      toolName="Uppercase"
      toolDescription="Convert all text to uppercase letters."
      onProcess={textToUppercase}
      placeholder="Enter text to convert..."
    />
  );
}
