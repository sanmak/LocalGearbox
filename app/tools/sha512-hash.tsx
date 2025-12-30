/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { ToolLayout } from '@/components/ToolLayout';
import { generateSHA512 } from '@/lib/tools';

export default function SHA512HashPage() {
  return (
    <ToolLayout
      toolName="SHA-512 Hash Generator"
      toolDescription="Generate a SHA-512 hash of text. A very secure cryptographic hash with longer output, ideal for high-security applications."
      onProcess={generateSHA512}
      placeholder="Enter text to hash..."
    />
  );
}
