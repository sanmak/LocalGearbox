/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { ToolLayout } from '@/components/ToolLayout';
import { jsonToCSV } from '@/lib/tools';

export default function JSONToCSVPage() {
  return (
    <ToolLayout
      toolName="JSON to CSV"
      toolDescription="Convert a JSON array of objects to CSV format. Each object becomes a row, keys become column headers."
      onProcess={jsonToCSV}
      placeholder='[\n  {"name": "John", "age": 30, "city": "New York"},\n  {"name": "Jane", "age": 25, "city": "London"}\n]'
      showJsonButtons={true}
      sampleData='[\n  {"name": "John", "age": 30, "city": "New York", "email": "john@example.com"},\n  {"name": "Jane", "age": 25, "city": "London", "email": "jane@example.com"},\n  {"name": "Bob", "age": 35, "city": "Paris", "email": "bob@example.com"}\n]'
    />
  );
}
