/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * HTML to JSX Converter
 * Convert HTML to JSX format for React
 */

import { ToolLayout } from '@/components/ToolLayout';

// HTML attribute to JSX attribute mapping
const ATTRIBUTE_MAP: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  minlength: 'minLength',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',
  rowspan: 'rowSpan',
  colspan: 'colSpan',
  usemap: 'useMap',
  frameborder: 'frameBorder',
  contenteditable: 'contentEditable',
  crossorigin: 'crossOrigin',
  srcset: 'srcSet',
  datetime: 'dateTime',
  enctype: 'encType',
  formaction: 'formAction',
  formenctype: 'formEncType',
  formmethod: 'formMethod',
  formnovalidate: 'formNoValidate',
  formtarget: 'formTarget',
  hreflang: 'hrefLang',
  inputmode: 'inputMode',
  accesskey: 'accessKey',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  autoplay: 'autoPlay',
  charset: 'charSet',
  httpequiv: 'httpEquiv',
  'http-equiv': 'httpEquiv',
  novalidate: 'noValidate',
  playsinline: 'playsInline',
  spellcheck: 'spellCheck',
};

// Boolean attributes that should be handled specially
const BOOLEAN_ATTRIBUTES = new Set([
  'checked',
  'disabled',
  'readonly',
  'required',
  'autofocus',
  'autoplay',
  'controls',
  'loop',
  'muted',
  'multiple',
  'selected',
  'hidden',
  'open',
  'novalidate',
  'formnovalidate',
  'allowfullscreen',
  'async',
  'defer',
  'reversed',
  'scoped',
  'seamless',
  'default',
  'ismap',
  'playsinline',
]);

// Self-closing tags
const SELF_CLOSING_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

function convertStyleToObject(styleString: string): string {
  const styles = styleString.split(';').filter((s) => s.trim());
  const styleObj: Record<string, string> = {};

  for (const style of styles) {
    const colonIndex = style.indexOf(':');
    if (colonIndex === -1) continue;

    let property = style.slice(0, colonIndex).trim();
    const value = style.slice(colonIndex + 1).trim();

    // Convert CSS property to camelCase
    property = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

    // Handle vendor prefixes
    if (
      property.startsWith('Webkit') ||
      property.startsWith('Moz') ||
      property.startsWith('Ms') ||
      property.startsWith('O')
    ) {
      property = property.charAt(0).toLowerCase() + property.slice(1);
    }

    styleObj[property] = value;
  }

  const entries = Object.entries(styleObj);
  if (entries.length === 0) return '{{}}';

  const styleString2 = entries.map(([k, v]) => `${k}: "${v}"`).join(', ');

  return `{{ ${styleString2} }}`;
}

function convertHtmlToJsx(html: string): string {
  let jsx = html;

  // Handle comments
  jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');

  // Handle DOCTYPE
  jsx = jsx.replace(/<!DOCTYPE[^>]*>/gi, '');

  // Process tags and their attributes
  jsx = jsx.replace(
    /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^>]*)?)\s*(\/?)>/g,
    (_match: string, tagName: string, attributes: string, selfClose: string) => {
      let newAttributes = attributes || '';

      // Convert attributes
      newAttributes = newAttributes.replace(
        /\s+([a-zA-Z][a-zA-Z0-9-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g,
        (
          _attrMatch: string,
          attrName: string,
          doubleQuoted: string | undefined,
          singleQuoted: string | undefined,
          unquoted: string | undefined,
        ) => {
          const value = doubleQuoted ?? singleQuoted ?? unquoted;
          const lowerAttrName = attrName.toLowerCase();

          // Map attribute name
          let jsxAttrName = ATTRIBUTE_MAP[lowerAttrName] || attrName;

          // Handle data-* and aria-* attributes (keep as-is but lowercase)
          if (lowerAttrName.startsWith('data-') || lowerAttrName.startsWith('aria-')) {
            jsxAttrName = lowerAttrName;
          }

          // Handle event handlers (onclick -> onClick)
          if (lowerAttrName.startsWith('on')) {
            jsxAttrName =
              'on' + attrName.slice(2).charAt(0).toUpperCase() + attrName.slice(3).toLowerCase();
            // Event handlers should be functions
            if (value !== undefined) {
              return ` ${jsxAttrName}={() => { ${value} }}`;
            }
          }

          // Handle style attribute
          if (lowerAttrName === 'style' && value) {
            return ` style=${convertStyleToObject(value)}`;
          }

          // Handle boolean attributes
          if (BOOLEAN_ATTRIBUTES.has(lowerAttrName)) {
            if (
              value === undefined ||
              value === '' ||
              value === lowerAttrName ||
              value === 'true'
            ) {
              return ` ${jsxAttrName}`;
            }
            if (value === 'false') {
              return ` ${jsxAttrName}={false}`;
            }
          }

          // Handle className with template literals or expressions
          if (jsxAttrName === 'className' && value && value.includes('{')) {
            return ` ${jsxAttrName}={\`${value}\`}`;
          }

          // Regular attribute
          if (value !== undefined) {
            // If value contains curly braces, it might be a template
            if (value.includes('{') && value.includes('}')) {
              return ` ${jsxAttrName}={\`${value}\`}`;
            }
            return ` ${jsxAttrName}="${value}"`;
          }

          return ` ${jsxAttrName}`;
        },
      );

      // Handle self-closing tags
      const lowerTagName = tagName.toLowerCase();
      if (SELF_CLOSING_TAGS.has(lowerTagName) && !selfClose) {
        return `<${tagName}${newAttributes} />`;
      }

      if (selfClose) {
        return `<${tagName}${newAttributes} />`;
      }

      return `<${tagName}${newAttributes}>`;
    },
  );

  // Clean up empty space in self-closing tags
  jsx = jsx.replace(/\s+\/>/g, ' />');

  // Format the output nicely
  jsx = formatJsx(jsx);

  return jsx;
}

function formatJsx(jsx: string): string {
  // Basic formatting - add proper indentation
  let formatted = jsx.trim();

  // Remove excessive whitespace between tags
  formatted = formatted.replace(/>\s+</g, '>\n<');

  // Add indentation
  const lines = formatted.split('\n');
  let indent = 0;
  const indentedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '';

    // Decrease indent for closing tags
    if (trimmed.startsWith('</') || trimmed.startsWith('/>')) {
      indent = Math.max(0, indent - 1);
    }

    const indentedLine = '  '.repeat(indent) + trimmed;

    // Increase indent for opening tags (but not self-closing)
    if (
      trimmed.startsWith('<') &&
      !trimmed.startsWith('</') &&
      !trimmed.endsWith('/>') &&
      !trimmed.includes('</')
    ) {
      indent++;
    }

    return indentedLine;
  });

  return indentedLines.join('\n');
}

async function convertToJsx(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  if (input.length > 10 * 1024 * 1024) {
    throw new Error('Input exceeds size limit of 10MB');
  }

  try {
    const jsx = convertHtmlToJsx(input);
    return jsx;
  } catch (error) {
    throw new Error(
      `Failed to convert HTML: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

const SAMPLE_HTML = `<div class="container" id="main">
  <header class="header">
    <h1 style="color: blue; font-size: 24px;">Welcome</h1>
    <nav>
      <ul class="nav-list">
        <li><a href="#home" onclick="navigate('home')">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <form action="/submit" method="post" novalidate>
      <label for="email">Email:</label>
      <input type="email" id="email" name="email" required autofocus>

      <label for="message">Message:</label>
      <textarea id="message" name="message" rows="5" readonly></textarea>

      <button type="submit" disabled>Submit</button>
    </form>

    <img src="/image.jpg" alt="Sample Image" class="responsive">
    <br>
    <hr>
  </main>

  <!-- Footer section -->
  <footer class="footer" data-testid="main-footer" aria-label="Main footer">
    <p tabindex="0">&copy; 2024 Example Inc.</p>
  </footer>
</div>`;

export default function HtmlToJsxPage() {
  return (
    <ToolLayout
      toolName="HTML to JSX"
      toolDescription="Convert HTML to JSX for React. Handles class→className, for→htmlFor, style objects, event handlers, and self-closing tags."
      onProcess={convertToJsx}
      placeholder="Paste your HTML here..."
      sampleData={SAMPLE_HTML}
      showJsonButtons={false}
    />
  );
}
