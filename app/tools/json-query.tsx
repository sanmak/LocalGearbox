/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON Query Tool
 * Query JSON data using JMESPath expressions
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import jmespath from 'jmespath';
import { formatJson } from '@/lib/json/formatter';
import { SAMPLE_JSON } from '@/lib/json';
import {
  CopyIcon,
  CheckIcon,
  ClearIcon,
  SampleIcon,
  UploadIcon,
  LinkIcon,
  SearchIcon,
  HelpIcon,
} from '@/components/json/icons';
import { UrlLoaderModal } from '@/components/UrlLoaderModal';

// Example queries for demonstration
const EXAMPLE_QUERIES = [
  { query: 'users[*].name', description: 'Get all user names' },
  { query: 'users[?age > `25`]', description: 'Filter users older than 25' },
  { query: 'users[0]', description: 'Get first user' },
  { query: 'users[-1]', description: 'Get last user' },
  {
    query: 'users[*].{name: name, email: email}',
    description: 'Project specific fields',
  },
  { query: 'length(users)', description: 'Count users' },
  { query: 'users | sort_by(@, &age)', description: 'Sort users by age' },
  { query: "users[?contains(name, 'John')]", description: 'Search by name' },
];

export default function JsonQueryPage() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQuery = useCallback(async () => {
    if (!input.trim()) {
      setError('Please enter JSON to query');
      setOutput('');
      return;
    }

    if (!query.trim()) {
      // No query, just format and show input
      try {
        const parsed = JSON.parse(input);
        setOutput(formatJson(parsed, '2'));
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Invalid JSON';
        setError(errorMessage);
        setOutput('');
      }
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const result = jmespath.search(parsed, query);

      if (result === null || result === undefined) {
        setOutput('null');
      } else {
        setOutput(formatJson(result, '2'));
      }
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Query failed';
      setError(errorMessage);
      setOutput('');
    }
  }, [input, query]);

  // Auto-query on input/query change
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      handleQuery();
    }, 300);

    return () => clearTimeout(timer);
  }, [input, query, handleQuery]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }, [output]);

  const handleClear = useCallback(() => {
    setInput('');
    setQuery('');
    setOutput('');
    setError(null);
    inputRef.current?.focus();
  }, []);

  const loadSample = useCallback(() => {
    setInput(SAMPLE_JSON);
    setQuery('users[*].name');
    setError(null);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInput(text);
      setError(null);
    };
    reader.readAsText(file);
  }, []);

  const applyExampleQuery = useCallback((exampleQuery: string) => {
    setQuery(exampleQuery);
    setShowHelp(false);
    queryRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleQuery();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleQuery, handleClear]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <SearchIcon />
              <h1 className="text-lg font-semibold text-text-primary">JSON Query</h1>
            </div>
            <p className="text-sm text-text-tertiary mt-1">
              Query and filter JSON data using JMESPath expressions
            </p>
          </div>
          <a
            href="https://jmespath.org/tutorial.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:text-accent-hover"
          >
            JMESPath Docs ↗
          </a>
        </div>
      </div>

      {/* Query Bar */}
      <div className="px-4 py-3 border-b border-border bg-surface-secondary">
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary whitespace-nowrap">Query:</label>
          <div className="flex-1 relative">
            <input
              ref={queryRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleQuery();
                }
              }}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Enter JMESPath query (e.g., users[*].name)"
            />
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`p-2 rounded transition-colors ${
              showHelp
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
            title="Show example queries"
          >
            <HelpIcon />
          </button>
        </div>

        {/* Example Queries */}
        {showHelp && (
          <div className="mt-3 p-3 bg-surface border border-border rounded">
            <h3 className="text-sm font-medium text-text-primary mb-2">Example Queries</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {EXAMPLE_QUERIES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => applyExampleQuery(example.query)}
                  className="text-left p-2 rounded hover:bg-surface-secondary transition-colors"
                >
                  <code className="text-xs text-accent font-mono">{example.query}</code>
                  <p className="text-xs text-text-tertiary mt-0.5">{example.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="px-4 py-2 border-b border-border flex items-center justify-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors flex items-center gap-2 text-sm"
          title="Upload JSON file"
        >
          <UploadIcon />
          <span className="hidden sm:inline">Upload JSON File</span>
        </button>
        <button
          onClick={() => setShowUrlModal(true)}
          className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors flex items-center gap-2 text-sm"
          title="Load From URL"
        >
          <LinkIcon />
          <span className="hidden sm:inline">Load From URL</span>
        </button>
        <button
          onClick={loadSample}
          className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors flex items-center gap-2 text-sm"
          title="Load Sample Data"
        >
          <SampleIcon />
          <span className="hidden sm:inline">Load Sample Data</span>
        </button>
        <button
          onClick={handleClear}
          disabled={!input && !query}
          className="px-2 py-1.5 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
          title="Clear (⌘+K)"
        >
          <ClearIcon />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Input Panel */}
        <div className="flex-1 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-border">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Input JSON</span>
            <span className="text-xs text-text-tertiary">
              {input.length > 0 && `${input.length} characters`}
            </span>
          </div>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="absolute inset-0 w-full h-full resize-none bg-surface text-text-primary font-mono text-sm p-4 focus:outline-none"
              placeholder='{\n  "users": [\n    {"name": "John", "age": 30},\n    {"name": "Jane", "age": 25}\n  ]\n}'
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Query Result</span>
            <div className="flex items-center gap-2">
              {output && (
                <span className="text-xs text-text-tertiary">{output.length} characters</span>
              )}
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-1.5 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-accent hover:bg-accent-hover text-white disabled:opacity-30'
                }`}
                title="Copy to clipboard"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="flex-1 relative">
            {error ? (
              <div className="absolute inset-0 p-4">
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-500 text-sm">
                  <p className="font-medium">Query Error</p>
                  <p className="mt-1 text-red-400 font-mono text-xs">{error}</p>
                </div>
              </div>
            ) : (
              <textarea
                value={output}
                readOnly
                className="absolute inset-0 w-full h-full resize-none bg-surface text-text-primary font-mono text-sm p-4 focus:outline-none"
                placeholder="Query result will appear here..."
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-border bg-surface-secondary">
        <p className="text-xs text-text-tertiary">
          <strong>JMESPath</strong> is a query language for JSON. Common operators:
          <code className="mx-1 px-1 bg-surface rounded">[*]</code> all elements,
          <code className="mx-1 px-1 bg-surface rounded">[?expr]</code> filter,
          <code className="mx-1 px-1 bg-surface rounded">|</code> pipe,
          <code className="mx-1 px-1 bg-surface rounded">&amp;</code> expression reference
        </p>
      </div>
      {/* URL Loader Modal */}
      <UrlLoaderModal
        isOpen={showUrlModal}
        onClose={() => setShowUrlModal(false)}
        onLoad={(data) => {
          setInput(data);
          setShowUrlModal(false);
        }}
      />
    </div>
  );
}
