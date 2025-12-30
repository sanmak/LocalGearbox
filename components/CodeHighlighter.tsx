/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useMemo, useState } from 'react';

// Helper function to escape HTML
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// JSON Syntax Highlighter
function highlightJSON(code: string): string {
  try {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"([^"\\]|\\.)*"/g, (match) => {
        // Check if it's a key or value
        const afterMatch = code.substring(code.indexOf(match) + match.length);
        if (afterMatch.trim().startsWith(':')) {
          return `<span class="json-key">${match}</span>`;
        }
        return `<span class="json-string">${match}</span>`;
      })
      .replace(/\b(true|false|null)\b/g, '<span class="json-boolean">$1</span>')
      .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="json-number">$1</span>')
      .replace(/([{}[\],:])/g, '<span class="json-punctuation">$1</span>');
  } catch {
    return escapeHtml(code);
  }
}

// HTML/XML Syntax Highlighter
function highlightHTML(code: string): string {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(&lt;\/?)(\w+)(.*?)(&gt;)/g, (_, open, tag, attrs, close) => {
      const highlightedAttrs = attrs.replace(
        /(\w+)=("[^"]*"|'[^']*')/g,
        '<span class="html-attr-name">$1</span>=<span class="html-attr-value">$2</span>',
      );
      return `${open}<span class="html-tag">${tag}</span>${highlightedAttrs}${close}`;
    })
    .replace(/(&lt;!--.*?--&gt;)/g, '<span class="html-comment">$1</span>');
}

// JavaScript Syntax Highlighter
function highlightJavaScript(code: string): string {
  return escapeHtml(code)
    .replace(
      /\b(function|const|let|var|if|else|return|for|while|class|import|export|from|default|async|await|try|catch|throw|new)\b/g,
      '<span class="js-keyword">$1</span>',
    )
    .replace(/\b(true|false|null|undefined|NaN|Infinity)\b/g, '<span class="js-boolean">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="js-number">$1</span>')
    .replace(/(\/\/.*$)/gm, '<span class="js-comment">$1</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="js-comment">$1</span>')
    .replace(
      /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
      '<span class="js-string">$1</span>',
    );
}

// CSS Syntax Highlighter
function highlightCSS(code: string): string {
  return escapeHtml(code)
    .replace(/([.#]?[\w-]+)\s*\{/g, '<span class="css-selector">$1</span> {')
    .replace(/([\w-]+)\s*:/g, '<span class="css-property">$1</span>:')
    .replace(/:\s*([^;{}]+)/g, ': <span class="css-value">$1</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="css-comment">$1</span>');
}

// Auto-detect content type from content
function detectLanguage(content: string): string {
  const trimmed = content.trim();

  // Try to detect JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  // Try to detect HTML/XML
  if (trimmed.startsWith('<')) {
    if (
      trimmed.toLowerCase().includes('<!doctype html') ||
      trimmed.toLowerCase().includes('<html')
    ) {
      return 'html';
    }
    return 'xml';
  }

  // Check for JavaScript keywords
  if (/\b(function|const|let|var|if|else|return|for|while|class|import|export)\b/.test(trimmed)) {
    return 'javascript';
  }

  // Check for CSS
  if (/[.#]?[\w-]+\s*\{.*?\}/.test(trimmed)) {
    return 'css';
  }

  return 'text';
}

interface CodeHighlighterProps {
  code: string;
  language?: string;
  showCopy?: boolean;
  showLanguage?: boolean;
  maxHeight?: string;
  className?: string;
}

export default function CodeHighlighter({
  code,
  language,
  showCopy = true,
  showLanguage = true,
  className = '',
}: CodeHighlighterProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  // Detect language if not provided
  const detectedLanguage = useMemo(() => {
    return language || detectLanguage(code);
  }, [code, language]);

  // Apply syntax highlighting
  const highlightedCode = useMemo(() => {
    if (detectedLanguage === 'json') {
      return highlightJSON(code);
    } else if (detectedLanguage === 'html' || detectedLanguage === 'xml') {
      return highlightHTML(code);
    } else if (detectedLanguage === 'javascript') {
      return highlightJavaScript(code);
    } else if (detectedLanguage === 'css') {
      return highlightCSS(code);
    }
    return escapeHtml(code);
  }, [code, detectedLanguage]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      className={`relative border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden flex flex-col h-full w-full ${className}`}
      style={{ minHeight: 0, minWidth: 0 }}
    >
      {/* Toolbar */}
      {(showCopy || showLanguage) && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2">
            {showLanguage && (
              <>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Language:</span>
                <span className="px-2 py-0.5 text-[9px] font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                  {detectedLanguage.toUpperCase()}
                </span>
              </>
            )}
          </div>
          {showCopy && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              {copySuccess ? (
                <>
                  <svg
                    className="w-3 h-3 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Code Content */}
      <div
        className="flex-1 overflow-auto bg-gray-50 dark:bg-[#0d1117] min-h-0 min-w-0"
        style={{ height: '100%', width: '100%' }}
      >
        <div className="code-highlighter-view h-full w-full">
          <style jsx>{`
            .code-highlighter-view {
              padding: 12px;
              font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
              font-size: 11px;
              line-height: 1.6;
              color: #1f2937;
              background: #f9fafb;
            }
            :global(.dark) .code-highlighter-view {
              background: #0d1117;
              color: #c9d1d9;
            }
            .code-highlighter-view :global(.syntax-highlighter) {
              white-space: pre-wrap;
              word-break: break-all;
            }
            /* Light Mode JSON Highlighting */
            .code-highlighter-view :global(.json-key) {
              color: #0550ae;
              font-weight: 500;
            }
            .code-highlighter-view :global(.json-string) {
              color: #0a3069;
            }
            .code-highlighter-view :global(.json-number) {
              color: #116329;
            }
            .code-highlighter-view :global(.json-boolean) {
              color: #8250df;
            }
            .code-highlighter-view :global(.json-punctuation) {
              color: #1f2937;
            }
            /* Light Mode HTML/XML Highlighting */
            .code-highlighter-view :global(.html-tag) {
              color: #116329;
              font-weight: 500;
            }
            .code-highlighter-view :global(.html-attr-name) {
              color: #0550ae;
            }
            .code-highlighter-view :global(.html-attr-value) {
              color: #0a3069;
            }
            .code-highlighter-view :global(.html-comment) {
              color: #6e7781;
              font-style: italic;
            }
            /* Light Mode JavaScript Highlighting */
            .code-highlighter-view :global(.js-keyword) {
              color: #cf222e;
              font-weight: 500;
            }
            .code-highlighter-view :global(.js-boolean) {
              color: #8250df;
            }
            .code-highlighter-view :global(.js-number) {
              color: #116329;
            }
            .code-highlighter-view :global(.js-string) {
              color: #0a3069;
            }
            .code-highlighter-view :global(.js-comment) {
              color: #6e7781;
              font-style: italic;
            }
            /* Light Mode CSS Highlighting */
            .code-highlighter-view :global(.css-selector) {
              color: #116329;
              font-weight: 500;
            }
            .code-highlighter-view :global(.css-property) {
              color: #0550ae;
            }
            .code-highlighter-view :global(.css-value) {
              color: #0a3069;
            }
            .code-highlighter-view :global(.css-comment) {
              color: #6e7781;
              font-style: italic;
            }
            /* Dark Mode JSON Highlighting */
            :global(.dark) .code-highlighter-view :global(.json-key) {
              color: #79c0ff;
              font-weight: 500;
            }
            :global(.dark) .code-highlighter-view :global(.json-string) {
              color: #a5d6ff;
            }
            :global(.dark) .code-highlighter-view :global(.json-number) {
              color: #7ee787;
            }
            :global(.dark) .code-highlighter-view :global(.json-boolean) {
              color: #d2a8ff;
            }
            :global(.dark) .code-highlighter-view :global(.json-punctuation) {
              color: #c9d1d9;
            }
            /* Dark Mode HTML/XML Highlighting */
            :global(.dark) .code-highlighter-view :global(.html-tag) {
              color: #7ee787;
              font-weight: 500;
            }
            :global(.dark) .code-highlighter-view :global(.html-attr-name) {
              color: #79c0ff;
            }
            :global(.dark) .code-highlighter-view :global(.html-attr-value) {
              color: #a5d6ff;
            }
            :global(.dark) .code-highlighter-view :global(.html-comment) {
              color: #8b949e;
              font-style: italic;
            }
            /* Dark Mode JavaScript Highlighting */
            :global(.dark) .code-highlighter-view :global(.js-keyword) {
              color: #ff7b72;
              font-weight: 500;
            }
            :global(.dark) .code-highlighter-view :global(.js-boolean) {
              color: #d2a8ff;
            }
            :global(.dark) .code-highlighter-view :global(.js-number) {
              color: #7ee787;
            }
            :global(.dark) .code-highlighter-view :global(.js-string) {
              color: #a5d6ff;
            }
            :global(.dark) .code-highlighter-view :global(.js-comment) {
              color: #8b949e;
              font-style: italic;
            }
            /* Dark Mode CSS Highlighting */
            :global(.dark) .code-highlighter-view :global(.css-selector) {
              color: #7ee787;
              font-weight: 500;
            }
            :global(.dark) .code-highlighter-view :global(.css-property) {
              color: #79c0ff;
            }
            :global(.dark) .code-highlighter-view :global(.css-value) {
              color: #a5d6ff;
            }
            :global(.dark) .code-highlighter-view :global(.css-comment) {
              color: #8b949e;
              font-style: italic;
            }
          `}</style>
          <div
            className="syntax-highlighter"
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </div>
      </div>
    </div>
  );
}
