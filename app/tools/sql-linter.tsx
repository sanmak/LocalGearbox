/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';
import { ToolLayout } from '../../components/ToolLayout';
import { getTool } from '../../lib/tool-registry';

const tool = getTool('sql-linter');

export default function SQLLinterPage() {
  if (!tool) return <div>Tool not found</div>;
  const sampleSQL = `SELECT * FROM users WHERE created_at > '2023-01-01';`;
  return (
    <ToolLayout
      toolName={tool.name}
      toolDescription={tool.description}
      onProcess={tool.process}
      placeholder="Paste your SQL here..."
      sampleData={sampleSQL}
      showJsonButtons={true}
    />
  );
}
