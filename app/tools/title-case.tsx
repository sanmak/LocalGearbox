/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { ToolLayout } from '@/components/ToolLayout';
import { titleCase } from '@/lib/tools';

export default function TitleCasePage() {
  return (
    <ToolLayout
      toolName="Title Case"
      toolDescription="Convert text to title case, capitalizing the first letter of each word."
      onProcess={titleCase}
      placeholder="Enter text to convert..."
    />
  );
}
