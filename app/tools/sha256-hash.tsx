/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { ToolLayout } from '@/components/ToolLayout';
import { generateSHA256 } from '@/lib/tools';

export default function SHA256HashPage() {
  return (
    <ToolLayout
      toolName="SHA-256 Hash Generator"
      toolDescription="Generate a SHA-256 hash of text. A secure cryptographic hash suitable for most applications including password hashing with proper salting."
      onProcess={generateSHA256}
      placeholder="Enter text to hash..."
    />
  );
}
