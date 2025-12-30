/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { ToolLayout } from '@/components/ToolLayout';
import { generateMD5 } from '@/lib/tools';

export default function MD5HashPage() {
  return (
    <ToolLayout
      toolName="MD5 Hash Generator"
      toolDescription="Generate an MD5 hash of text. Note: MD5 is cryptographically broken and should not be used for password hashing or security-sensitive applications."
      onProcess={generateMD5}
      placeholder="Enter text to hash..."
    />
  );
}
