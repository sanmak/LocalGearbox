/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Formatters - JSON, XML, HTML formatting tools
 * Pure, side-effect-free formatting functions
 */

import {
  validateInput,
  isValidXML,
  validateHTMLSecurity,
  JSON_SIZE_LIMIT,
  XML_SIZE_LIMIT,
  HTML_SIZE_LIMIT,
} from '../shared';

/**
 * Formats JSON with proper indentation
 */
export const formatJSON = async (input: string): Promise<string> => {
  validateInput(input, JSON_SIZE_LIMIT);

  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Formats XML with proper indentation
 */
export const formatXML = async (input: string): Promise<string> => {
  validateInput(input, XML_SIZE_LIMIT);

  if (!isValidXML(input)) {
    throw new Error('Invalid XML format');
  }

  try {
    const parser = new DOMParser();
    // Safe: application/xml MIME type does not execute scripts
    // The document is used only for formatting and is never inserted into the DOM
    const doc = parser.parseFromString(input, 'application/xml');

    const formatNode = (node: Node, indent = 0): string => {
      const indentStr = '  '.repeat(indent);

      if (node.nodeType === 3) {
        // Text node
        const text = node.textContent?.trim();
        return text ? `${indentStr}${text}` : '';
      }

      if (node.nodeType === 1) {
        // Element node
        const element = node as Element;
        const attrs = Array.from(element.attributes)
          .map((attr) => `${attr.name}="${attr.value}"`)
          .join(' ');

        const children = Array.from(node.childNodes).filter(
          (n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent?.trim()),
        );

        const attrStr = attrs ? ` ${attrs}` : '';

        if (children.length === 0) {
          const text = element.textContent?.trim();
          return `${indentStr}<${element.tagName}${attrStr}>${text || ''}</${element.tagName}>`;
        }

        const childrenStr = children
          .map((child) => formatNode(child, indent + 1))
          .filter(Boolean)
          .join('\n');

        return `${indentStr}<${element.tagName}${attrStr}>\n${childrenStr}\n${indentStr}</${element.tagName}>`;
      }

      return '';
    };

    const root = doc.documentElement;
    return `<?xml version="1.0" encoding="UTF-8"?>\n${formatNode(root)}`;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to format XML: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Formats HTML with proper indentation
 */
export const formatHTML = async (input: string): Promise<string> => {
  validateInput(input, HTML_SIZE_LIMIT);

  // Validate for XSS and security issues
  validateHTMLSecurity(input);

  try {
    let formatted = input.trim();
    let indentLevel = 0;
    const indentSize = 2;
    let result = '';
    let i = 0;

    while (i < formatted.length) {
      if (formatted[i] === '<') {
        const endTag = formatted.indexOf('>', i);
        if (endTag === -1) {
          throw new Error('Invalid HTML: unclosed tag');
        }

        const tag = formatted.substring(i, endTag + 1);
        const isClosingTag = tag.startsWith('</');
        const isSelfClosing =
          tag.endsWith('/>') ||
          /^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/i.test(tag);

        if (isClosingTag) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        if (result && !result.endsWith('\n')) {
          result += '\n';
        }

        result += ' '.repeat(indentLevel * indentSize) + tag;

        if (!isClosingTag && !isSelfClosing) {
          indentLevel++;
        }

        i = endTag + 1;
      } else if (formatted[i] === ' ' || formatted[i] === '\n') {
        // Skip whitespace between tags
        i++;
      } else {
        // Text content
        const nextTag = formatted.indexOf('<', i);
        let textContent;

        if (nextTag === -1) {
          textContent = formatted.substring(i).trim();
          i = formatted.length;
        } else {
          textContent = formatted.substring(i, nextTag).trim();
          i = nextTag;
        }

        if (textContent) {
          if (result && !result.endsWith('\n')) {
            result += '\n';
          }
          result += ' '.repeat(indentLevel * indentSize) + textContent;
        }
      }
    }

    return result + '\n';
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to format HTML');
  }
};

/**
 * Beautifies CSS with proper formatting
 */
export const beautifyCSS = async (input: string): Promise<string> => {
  validateInput(input);

  try {
    let formatted = input.trim();

    // Add newlines after opening braces
    formatted = formatted.replace(/\{/g, ' {\n  ');

    // Add newlines after semicolons
    formatted = formatted.replace(/;/g, ';\n  ');

    // Add newlines before closing braces
    formatted = formatted.replace(/\}/g, '\n}\n');

    // Remove extra whitespace
    formatted = formatted.replace(/\s+/g, ' ');

    // Fix indentation
    const lines = formatted.split('\n');
    let indentLevel = 0;
    const result = lines
      .map((line) => {
        line = line.trim();
        if (!line) return '';

        if (line.includes('}')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        const indented = '  '.repeat(indentLevel) + line;

        if (line.includes('{')) {
          indentLevel++;
        }

        return indented;
      })
      .filter(Boolean)
      .join('\n');

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to beautify CSS: ${error.message}`);
    }
    throw error;
  }
};
