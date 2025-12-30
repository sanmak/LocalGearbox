/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON Schema Generator Tool
 * Generate JSON Schema from sample JSON data
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { inferJsonSchema, formatSchema } from '@/lib/json/schema';
import { SAMPLE_JSON } from '@/lib/json';
import {
  CopyIcon,
  CheckIcon,
  ClearIcon,
  PlayIcon,
  SampleIcon,
  UploadIcon,
  LinkIcon,
  SchemaIcon,
  ChevronDownIcon,
} from '@/components/json/icons';
import { UrlLoaderModal } from '@/components/UrlLoaderModal';

type SchemaVersion = 'draft-07' | 'draft-2020-12';

interface SchemaOptions {
  version: SchemaVersion;
  required: boolean;
  additionalProperties: boolean;
  examples: boolean;
}

export default function JsonSchemaPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState<SchemaOptions>({
    version: 'draft-2020-12',
    required: true,
    additionalProperties: false,
    examples: true,
  });
  const [showUrlModal, setShowUrlModal] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = useCallback(async () => {
    if (!input.trim()) {
      setError('Please enter JSON to generate schema from');
      setOutput('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const schema = inferJsonSchema(parsed);

      // Modify schema based on options
      const schemaUrl =
        options.version === 'draft-07'
          ? 'http://json-schema.org/draft-07/schema#'
          : 'https://json-schema.org/draft/2020-12/schema';

      schema.$schema = schemaUrl;

      if (options.additionalProperties && schema.properties) {
        // Allow additional properties in schema
        (schema as unknown as Record<string, unknown>).additionalProperties = true;
      }

      if (!options.required) {
        delete schema.required;
        // Remove required from nested objects
        const removeRequired = (obj: Record<string, unknown>) => {
          if (obj.properties) {
            delete obj.required;
            Object.values(obj.properties as Record<string, Record<string, unknown>>).forEach(
              (prop) => {
                if (prop.properties) {
                  removeRequired(prop);
                }
              },
            );
          }
        };
        removeRequired(schema as unknown as Record<string, unknown>);
      }

      const formatted = formatSchema(schema);
      setOutput(formatted);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid JSON';
      setError(errorMessage);
      setOutput('');
    }
  }, [input, options]);

  // Auto-generate schema on input/options change
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      handleGenerate();
    }, 300);

    return () => clearTimeout(timer);
  }, [input, options, handleGenerate]);

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
        handleGenerate();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGenerate, handleClear]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <SchemaIcon />
          <h1 className="text-lg font-semibold text-text-primary">JSON Schema Generator</h1>
        </div>
        <p className="text-sm text-text-tertiary mt-1">
          Generate JSON Schema from sample JSON data for validation and documentation
        </p>
      </div>

      {/* Options Bar */}
      <div className="px-4 py-3 border-b border-border bg-surface-secondary">
        <div className="flex flex-wrap items-center gap-4">
          {/* Schema Version */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">Version:</label>
            <div className="relative">
              <select
                value={options.version}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    version: e.target.value as SchemaVersion,
                  })
                }
                className="appearance-none bg-surface border border-border rounded px-3 py-1.5 pr-8 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="draft-2020-12">Draft 2020-12</option>
                <option value="draft-07">Draft-07</option>
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            </div>
          </div>

          {/* Checkboxes */}
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={options.required}
              onChange={(e) => setOptions({ ...options, required: e.target.checked })}
              className="rounded border-border text-accent focus:ring-accent"
            />
            Include required
          </label>

          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={options.additionalProperties}
              onChange={(e) =>
                setOptions({
                  ...options,
                  additionalProperties: e.target.checked,
                })
              }
              className="rounded border-border text-accent focus:ring-accent"
            />
            Allow additional properties
          </label>

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
            <span className="text-sm font-medium text-text-secondary">Input (Sample JSON)</span>
            <button
              onClick={handleGenerate}
              disabled={!input.trim()}
              className="px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <PlayIcon />
              Generate Schema
            </button>
          </div>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="absolute inset-0 w-full h-full resize-none bg-surface text-text-primary font-mono text-sm p-4 focus:outline-none"
              placeholder='{\n  "name": "John",\n  "age": 30,\n  "email": "john@example.com"\n}'
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Output (JSON Schema)</span>
            <button
              onClick={handleCopy}
              disabled={!output}
              className={`px-2 py-1.5 text-sm rounded transition-colors flex items-center gap-1.5 ${
                copied
                  ? 'text-green-500'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              } disabled:opacity-50`}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
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
                placeholder="Generated JSON Schema will appear here..."
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-border bg-surface-secondary">
        <p className="text-xs text-text-tertiary">
          <strong>Tip:</strong> The generated schema can be used with JSON Schema validators like
          AJV, or integrated into API documentation tools like Swagger/OpenAPI.
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
