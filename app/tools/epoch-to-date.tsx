/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { ToolLayout } from '@/components/ToolLayout';
import { epochToDate } from '@/lib/tools';

export default function EpochToDatePage() {
  return (
    <ToolLayout
      toolName="Epoch Timestamp to Date"
      toolDescription="Convert Unix epoch timestamp to human-readable date and time. Accepts timestamps in seconds or milliseconds."
      onProcess={epochToDate}
      placeholder="1702766400"
    />
  );
}
