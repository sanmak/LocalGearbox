/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * Markdown to HTML Converter
 * Convert Markdown to HTML format
 */

import { ToolLayout } from '@/components/ToolLayout';

// Simple Markdown to HTML converter - Pure implementation
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Normalize line endings
  html = html.replace(/\r\n/g, '\n');

  // Code blocks (``` ```) - must process before other rules
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escapedCode = escapeHtml(code.trim());
    if (lang) {
      return `<pre><code class="language-${lang}">${escapedCode}</code></pre>`;
    }
    return `<pre><code>${escapedCode}</code></pre>`;
  });

  // Inline code (must process before other inline rules)
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    return `<code>${escapeHtml(code)}</code>`;
  });

  // Headers
  html = html.replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>');

  // Alternative headers (underline style)
  html = html.replace(/^(.+)\n={2,}$/gm, '<h1>$1</h1>');
  html = html.replace(/^(.+)\n-{2,}$/gm, '<h2>$1</h2>');

  // Horizontal rules
  html = html.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '<hr />');

  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // Unordered lists
  const processUnorderedList = (text: string): string => {
    const lines = text.split('\n');
    let result = '';
    let inList = false;

    for (const line of lines) {
      const match = line.match(/^[\*\-\+]\s+(.+)$/);
      if (match) {
        if (!inList) {
          result += '<ul>\n';
          inList = true;
        }
        result += `<li>${match[1]}</li>\n`;
      } else {
        if (inList) {
          result += '</ul>\n';
          inList = false;
        }
        result += line + '\n';
      }
    }
    if (inList) {
      result += '</ul>\n';
    }
    return result.trim();
  };
  html = processUnorderedList(html);

  // Ordered lists
  const processOrderedList = (text: string): string => {
    const lines = text.split('\n');
    let result = '';
    let inList = false;

    for (const line of lines) {
      const match = line.match(/^\d+\.\s+(.+)$/);
      if (match) {
        if (!inList) {
          result += '<ol>\n';
          inList = true;
        }
        result += `<li>${match[1]}</li>\n`;
      } else {
        if (inList) {
          result += '</ol>\n';
          inList = false;
        }
        result += line + '\n';
      }
    }
    if (inList) {
      result += '</ol>\n';
    }
    return result.trim();
  };
  html = processOrderedList(html);

  // Images (must be before links)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Auto-links
  html = html.replace(/<(https?:\/\/[^>]+)>/g, '<a href="$1">$1</a>');

  // Bold (must be before italic)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Strikethrough
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Line breaks (two spaces at end of line)
  html = html.replace(/  $/gm, '<br />');

  // Paragraphs - wrap remaining text blocks
  const wrapParagraphs = (text: string): string => {
    const blocks = text.split(/\n\n+/);
    return blocks
      .map((block) => {
        block = block.trim();
        if (!block) return '';

        // Don't wrap if already wrapped in block element
        if (
          block.startsWith('<h') ||
          block.startsWith('<ul') ||
          block.startsWith('<ol') ||
          block.startsWith('<blockquote') ||
          block.startsWith('<pre') ||
          block.startsWith('<hr') ||
          block.startsWith('<p')
        ) {
          return block;
        }

        return `<p>${block.replace(/\n/g, ' ')}</p>`;
      })
      .join('\n\n');
  };
  html = wrapParagraphs(html);

  return html;
}

async function convertMarkdownToHtml(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  if (input.length > 10 * 1024 * 1024) {
    throw new Error('Input exceeds size limit of 10MB');
  }

  try {
    return markdownToHtml(input);
  } catch (error) {
    throw new Error(
      `Failed to convert Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

const SAMPLE_MARKDOWN = `# Welcome to Markdown

This is a **sample** markdown document demonstrating various features.

## Features

### Text Formatting

You can make text **bold**, *italic*, or ~~strikethrough~~.

You can also use \`inline code\` for technical terms.

### Lists

#### Unordered List

- Item one
- Item two
- Item three

#### Ordered List

1. First item
2. Second item
3. Third item

### Links and Images

Here's a [link to Google](https://google.com).

### Blockquotes

> This is a blockquote.
> It can span multiple lines.

### Code Blocks

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');
\`\`\`

### Horizontal Rule

---

### Auto-links

Check out <https://github.com> for more!

That's all for this demo.`;

export default function MarkdownToHtmlPage() {
  return (
    <ToolLayout
      toolName="Markdown to HTML"
      toolDescription="Convert Markdown to HTML. Supports headers, lists, links, images, code blocks, and more."
      onProcess={convertMarkdownToHtml}
      placeholder="Paste your Markdown here..."
      sampleData={SAMPLE_MARKDOWN}
      showJsonButtons={false}
    />
  );
}
