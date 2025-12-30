/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON Sorter Tool
 * Sort JSON keys alphabetically or by specific field values
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { sortKeys, sortByField, extractFieldNames, hasSortableArrays } from '@/lib/json/sorter';
import { formatJson } from '@/lib/json/formatter';
import { SAMPLE_JSON } from '@/lib/json';
import {
  CopyIcon,
  CheckIcon,
  ClearIcon,
  SampleIcon,
  UploadIcon,
  LinkIcon,
  SortIcon,
  ChevronDownIcon,
} from '@/components/json/icons';
import { UrlLoaderModal } from '@/components/UrlLoaderModal';

type SortDirection = 'asc' | 'desc';
type SortMode = 'keys' | 'field';

export default function JsonSorterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('keys');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedField, setSelectedField] = useState('');
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [hasArrays, setHasArrays] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSort = useCallback(async () => {
    if (!input.trim()) {
      setError('Please enter JSON to sort');
      setOutput('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      let sorted;

      if (sortMode === 'keys') {
        sorted = sortKeys(parsed, sortDirection);
      } else if (sortMode === 'field' && selectedField) {
        sorted = sortByField(parsed, selectedField, sortDirection);
      } else {
        sorted = parsed;
      }

      const formatted = formatJson(sorted, '2');
      setOutput(formatted);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid JSON';
      setError(errorMessage);
      setOutput('');
    }
  }, [input, sortMode, sortDirection, selectedField]);

  // Auto-sort on input/options change
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      setAvailableFields([]);
      setHasArrays(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSort();
    }, 300);

    return () => clearTimeout(timer);
  }, [input, sortMode, sortDirection, selectedField, handleSort]);

  // Update available fields when input changes
  useEffect(() => {
    if (!input.trim()) {
      setAvailableFields([]);
      setHasArrays(false);
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const fields = extractFieldNames(parsed);
      setAvailableFields(fields);
      setHasArrays(hasSortableArrays(parsed));
      if (fields.length > 0 && !selectedField) {
        setSelectedField(fields[0]);
      }
    } catch {
      setAvailableFields([]);
      setHasArrays(false);
    }
  }, [input, selectedField]);

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
    setOutput('');
    setError(null);
    setSelectedField('');
    inputRef.current?.focus();
  }, []);

  const loadSample = useCallback(() => {
    setInput(SAMPLE_JSON);
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSort();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSort, handleClear]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <SortIcon />
          <h1 className="text-lg font-semibold text-text-primary">JSON Sorter</h1>
        </div>
        <p className="text-sm text-text-tertiary mt-1">
          Sort JSON object keys alphabetically or array items by field values
        </p>
      </div>

      {/* Options Bar */}
      <div className="px-4 py-3 border-b border-border bg-surface-secondary">
        <div className="flex flex-wrap items-center gap-4">
          {/* Sort Mode */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">Sort by:</label>
            <div className="flex rounded border border-border overflow-hidden">
              <button
                onClick={() => setSortMode('keys')}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  sortMode === 'keys'
                    ? 'bg-accent text-white'
                    : 'bg-surface text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                Keys
              </button>
              <button
                onClick={() => setSortMode('field')}
                disabled={!hasArrays}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  sortMode === 'field'
                    ? 'bg-accent text-white'
                    : 'bg-surface text-text-secondary hover:bg-surface-secondary'
                } ${!hasArrays ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Field Value
              </button>
            </div>
          </div>

          {/* Field Selector (for field mode) */}
          {sortMode === 'field' && availableFields.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-secondary">Field:</label>
              <div className="relative">
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="appearance-none bg-surface border border-border rounded px-3 py-1.5 pr-8 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {availableFields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
              </div>
            </div>
          )}

          {/* Sort Direction */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">Order:</label>
            <div className="flex rounded border border-border overflow-hidden">
              <button
                onClick={() => setSortDirection('asc')}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  sortDirection === 'asc'
                    ? 'bg-accent text-white'
                    : 'bg-surface text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                A → Z
              </button>
              <button
                onClick={() => setSortDirection('desc')}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  sortDirection === 'desc'
                    ? 'bg-accent text-white'
                    : 'bg-surface text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                Z → A
              </button>
            </div>
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">
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
              disabled={!input}
              className="px-2 py-1.5 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
              title="Clear (⌘+K)"
            >
              <ClearIcon />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Input Panel */}
        <div className="flex-1 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-border">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Input</span>
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
              placeholder='{"b": 2, "a": 1, "c": 3}'
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Output</span>
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
                  {error}
                </div>
              </div>
            ) : (
              <textarea
                value={output}
                readOnly
                className="absolute inset-0 w-full h-full resize-none bg-surface text-text-primary font-mono text-sm p-4 focus:outline-none"
                placeholder="Sorted JSON will appear here..."
              />
            )}
          </div>
        </div>
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
