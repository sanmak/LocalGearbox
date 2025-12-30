/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { escapeXML } from '@/lib/tools';
import {
  UploadIcon,
  LinkIcon,
  SampleIcon,
  CopyIcon,
  CheckIcon,
  ClearIcon,
} from '@/components/json';
import { UrlLoaderModal } from '@/components/UrlLoaderModal';

// Sample XML with special characters
const SAMPLE_XML_ENTITIES = `<?xml version="1.0"?>
<root>
  <message>Hello & welcome to "our" application!</message>
  <data value='test & "quoted" content'>
    Content with < and > characters
  </data>
</root>`;

export default function XMLEscapePage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
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
        const result = await escapeXML(input);
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
  }, []);

  const loadSample = useCallback(() => {
    setInput(SAMPLE_XML_ENTITIES);
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

  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInput(text);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);

    event.target.value = '';
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Minimal Header */}
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium text-text-primary">XML Escape</h1>
            <span className="text-sm text-text-tertiary">
              Escape XML special characters to entities
            </span>
          </div>
          {/* Minimal Action Icons */}
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml,.xsd,.xsl,.xslt,.txt"
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary/50 rounded transition-colors"
              title="Upload file"
            >
              <UploadIcon />
            </button>
            <button
              onClick={() => setShowUrlModal(true)}
              className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary/50 rounded transition-colors"
              title="Load from URL"
            >
              <LinkIcon />
            </button>
            <button
              onClick={loadSample}
              className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary/50 rounded transition-colors"
              title="Load sample"
            >
              <SampleIcon />
            </button>
            <button
              onClick={handleClear}
              disabled={!input}
              className="p-2 text-text-tertiary hover:text-red-500 hover:bg-red-500/10 rounded transition-colors disabled:opacity-30"
              title="Clear (⌘+K)"
            >
              <ClearIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Status Strip */}
      <div className="px-4 py-2 bg-surface-secondary/20 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs text-text-secondary font-medium">
              {loading ? 'Processing...' : input ? 'Ready' : 'Enter XML to escape'}
            </span>
          </div>
          {error && (
            <div className="text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded">{error}</div>
          )}
        </div>
      </div>

      {/* Clean Two-Panel Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Input Panel */}
        <div className="flex-1 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-border/30">
          <div className="px-4 py-2 border-b border-border/30 bg-surface-secondary/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Input XML</span>
              <span className="text-xs text-text-tertiary">
                {input.length > 0 && `${input.length} characters`}
              </span>
            </div>
          </div>
          <div className="flex-1 relative min-h-0">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="absolute inset-0 w-full h-full resize-none bg-surface text-text-primary font-mono text-sm p-4 focus:outline-none focus:ring-1 focus:ring-accent/20 border-0"
              placeholder='<message>Hello & "World"</message>'
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-4 py-2 border-b border-border/30 bg-surface-secondary/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Escaped XML</span>
              <div className="flex items-center gap-2">
                {output && (
                  <span className="text-xs text-text-tertiary">{output.length} characters</span>
                )}
                {output && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-sm rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 relative min-h-0 overflow-hidden">
            <textarea
              value={output}
              readOnly
              className="absolute inset-0 w-full h-full resize-none bg-surface text-text-primary font-mono text-sm p-4 focus:outline-none border-0"
              placeholder={
                input
                  ? loading
                    ? 'Processing...'
                    : 'Escaped XML will appear here'
                  : 'Escaped XML will appear here'
              }
            />
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
