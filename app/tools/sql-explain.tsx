/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';
import { ToolLayout } from '../../components/ToolLayout';
import { getTool } from '../../lib/tool-registry';

const tool = getTool('sql-explain');

export default function SQLExplainPage() {
  if (!tool) return <div>Tool not found</div>;
  const sampleExplain = `id | select_type | table | type | possible_keys | key | key_len | ref | rows | Extra
1  | SIMPLE      | users | ALL  | NULL         | NULL | NULL    | NULL | 1000 | Using where`;
  return (
    <ToolLayout
      toolName={tool.name}
      toolDescription={tool.description}
      onProcess={tool.process}
      placeholder="Paste your EXPLAIN output here..."
      sampleData={sampleExplain}
      showJsonButtons={true}
    />
  );
}
