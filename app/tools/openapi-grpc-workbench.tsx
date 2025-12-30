/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * OpenAPI/gRPC Contract Workbench
 * Lint, validate, and analyze API contract specifications
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { processContractWorkbench } from '@/lib/tools';
import CodeHighlighter from '@/components/CodeHighlighter';
import { UploadIcon, LinkIcon } from '@/components/json';
import { UrlLoaderModal } from '@/components/UrlLoaderModal';

const SAMPLE_OPENAPI = `{
  "openapi": "3.0.1",
  "info": {
    "title": "Sample API",
    "version": "1.0.0"
  },
  "paths": {
    "/users": {
      "get": {
        "operationId": "getUsers",
        "responses": {
          "200": {
            "description": "Success"
          }
        }
      }
    }
  }
}`;

export default function OpenAPIGRPCWorkbenchPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-process on input change
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await processContractWorkbench(input);
        setOutput(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Processing failed';
        setError(errorMessage);
        setOutput('');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [input]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInput(content);
    };
    reader.readAsText(file);
  }, []);

  const handleSampleLoad = useCallback(() => {
    setInput(SAMPLE_OPENAPI);
  }, []);

  const handleUrlLoad = useCallback(() => {
    setShowUrlModal(true);
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleClear();
      }
    },
    [handleClear],
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              OpenAPI/gRPC Workbench
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Lint, validate, and analyze OpenAPI and gRPC contract specifications. Automatically
              detects spec type and provides detailed validation results.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Input Specification
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSampleLoad}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                    title="Load sample OpenAPI spec"
                  >
                    Sample
                  </button>
                  <button
                    onClick={handleUrlLoad}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                    title="Load from URL"
                  >
                    <LinkIcon />
                    URL
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                    title="Upload file"
                  >
                    <UploadIcon />
                    Upload
                  </button>
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded transition-colors"
                    title="Clear (⌘K)"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste your OpenAPI JSON/YAML or gRPC proto specification here..."
                className="w-full h-96 p-4 bg-transparent border-0 outline-none text-gray-900 dark:text-white font-mono text-sm resize-none"
                spellCheck="false"
                autoComplete="off"
                autoCapitalize="off"
              />
              {loading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                </div>
              )}
            </div>
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {input.length.toLocaleString()} characters
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.yaml,.yml,.proto,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Output Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Validation Results
              </h2>
            </div>
            <div className="h-96 overflow-hidden">
              {error ? (
                <div className="p-4 h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-red-500 dark:text-red-400 text-4xl mb-2">⚠️</div>
                    <p className="text-red-600 dark:text-red-400 font-medium">Error</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{error}</p>
                  </div>
                </div>
              ) : output ? (
                <CodeHighlighter
                  code={output}
                  language="json"
                  maxHeight="100%"
                  className="h-full border-0 rounded-none"
                  showCopy={true}
                  showLanguage={false}
                />
              ) : (
                <div className="p-4 h-full flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="font-medium">No results yet</p>
                    <p className="text-sm mt-1">Paste a specification to see validation results</p>
                  </div>
                </div>
              )}
            </div>
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
