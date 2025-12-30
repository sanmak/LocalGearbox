/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { ToolLayout } from '@/components/ToolLayout';
import { decodeBase64 } from '@/lib/tools';

export default function Base64DecoderPage() {
  return (
    <ToolLayout
      toolName="Base64 Decoder"
      toolDescription="Decode Base64 encoded strings back to plain text. Useful for decoding data received from APIs or text protocols."
      onProcess={decodeBase64}
      placeholder="Enter Base64 string to decode..."
    />
  );
}
