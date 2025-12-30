/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { ToolLayout } from '@/components/ToolLayout';
import { dateToEpoch } from '@/lib/tools';

export default function DateToEpochPage() {
  return (
    <ToolLayout
      toolName="Date to Epoch Timestamp"
      toolDescription="Convert human-readable date to Unix epoch timestamp in seconds and milliseconds. Accepts various date formats including ISO and UTC."
      onProcess={dateToEpoch}
      placeholder="2023-12-16T12:00:00Z"
    />
  );
}
