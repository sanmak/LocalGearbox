/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * XML to JSON Converter
 * Convert XML to JSON format
 */

import { ToolLayout } from '@/components/ToolLayout';

// XML to JSON converter using DOMParser
function xmlToJson(xml: Document | Element): unknown {
  const result: Record<string, unknown> = {};

  if (xml instanceof Document) {
    const root = xml.documentElement;
    result[root.tagName] = xmlToJson(root);
    return result;
  }

  // Handle attributes
  const attrs: Record<string, string> = {};
  if (xml.attributes && xml.attributes.length > 0) {
    for (let i = 0; i < xml.attributes.length; i++) {
      const attr = xml.attributes[i];
      attrs[`@${attr.name}`] = attr.value;
    }
  }

  // Get child elements
  const children = Array.from(xml.childNodes);
  const elementChildren = children.filter((n) => n.nodeType === 1) as Element[];
  const textContent = children
    .filter((n) => n.nodeType === 3)
    .map((n) => n.textContent?.trim())
    .filter(Boolean)
    .join('');

  // If no child elements, return text content or attributes
  if (elementChildren.length === 0) {
    if (Object.keys(attrs).length > 0) {
      if (textContent) {
        return { ...attrs, '#text': textContent };
      }
      return attrs;
    }
    return parseValue(textContent);
  }

  // Group children by tag name
  const childGroups: Record<string, unknown[]> = {};
  for (const child of elementChildren) {
    const tagName = child.tagName;
    if (!childGroups[tagName]) {
      childGroups[tagName] = [];
    }
    childGroups[tagName].push(xmlToJson(child));
  }

  // Build result
  const nodeResult: Record<string, unknown> = { ...attrs };

  for (const [tagName, values] of Object.entries(childGroups)) {
    if (values.length === 1) {
      nodeResult[tagName] = values[0];
    } else {
      nodeResult[tagName] = values;
    }
  }

  // Add text content if present along with other children
  if (textContent) {
    nodeResult['#text'] = textContent;
  }

  return nodeResult;
}

function parseValue(value: string): unknown {
  if (value === '') return '';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;

  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') {
    return num;
  }

  return value;
}

async function convertXmlToJson(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  if (input.length > 10 * 1024 * 1024) {
    throw new Error('Input exceeds size limit of 10MB');
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'application/xml');

    // Check for parse errors
    const parseError = doc.getElementsByTagName('parsererror');
    if (parseError.length > 0) {
      throw new Error('Invalid XML: ' + (parseError[0].textContent || 'Parse error'));
    }

    const result = xmlToJson(doc);
    return JSON.stringify(result, null, 2);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to convert XML: ${error.message}`);
    }
    throw error;
  }
}

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<users>
  <user id="1" active="true">
    <name>John Doe</name>
    <email>john@example.com</email>
    <age>30</age>
    <roles>
      <role>admin</role>
      <role>user</role>
    </roles>
    <address>
      <street>123 Main St</street>
      <city>New York</city>
      <zipCode>10001</zipCode>
    </address>
  </user>
  <user id="2" active="false">
    <name>Jane Smith</name>
    <email>jane@example.com</email>
    <age>25</age>
    <roles>
      <role>user</role>
    </roles>
    <address>
      <street>456 Oak Ave</street>
      <city>Los Angeles</city>
      <zipCode>90001</zipCode>
    </address>
  </user>
</users>`;

export default function XmlToJsonPage() {
  return (
    <ToolLayout
      toolName="XML to JSON"
      toolDescription="Convert XML to JSON format. Handles attributes (prefixed with @), nested elements, and arrays."
      onProcess={convertXmlToJson}
      placeholder="Paste your XML here..."
      sampleData={SAMPLE_XML}
      showJsonButtons={false}
    />
  );
}
