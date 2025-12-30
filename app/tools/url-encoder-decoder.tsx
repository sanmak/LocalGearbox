/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { encodeURL, decodeURL } from '@/lib/tools';

// Icons
const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ClearIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const ExchangeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
    />
  </svg>
);

export default function URLEncoderDecoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Process input when it changes
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    const processInput = async () => {
      try {
        if (mode === 'encode') {
          const result = await encodeURL(input);
          setOutput(result);
        } else {
          const result = await decodeURL(input);
          setOutput(result);
        }
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Processing error';
        setError(errorMessage);
        setOutput('');
      }
    };

    processInput();
  }, [input, mode]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [output]);

  // Clear input
  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Switch mode
  const switchMode = useCallback(() => {
    const newMode = mode === 'encode' ? 'decode' : 'encode';
    setMode(newMode);

    // If we have output, use it as new input
    if (output) {
      setInput(output);
      setOutput('');
    }
  }, [mode, output]);

  // Load sample
  const loadSample = useCallback(() => {
    const sampleText =
      mode === 'encode'
        ? 'Hello, World! How are you? Special chars: @#$%^&*()'
        : 'Hello%2C%20World%21%20How%20are%20you%3F%20Special%20chars%3A%20%40%23%24%25%5E%26%2A%28%29';
    setInput(sampleText);
  }, [mode]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          URL Encoder/Decoder
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Encode strings to URL-safe format or decode URL-encoded strings back to readable text
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md bg-gray-100 dark:bg-gray-800 p-1">
          <button
            onClick={() => setMode('encode')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              mode === 'encode'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Encode
          </button>
          <button
            onClick={() => setMode('decode')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              mode === 'decode'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Decode
          </button>
        </div>

        <button
          onClick={switchMode}
          className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors flex items-center gap-1.5"
          title="Switch mode and use output as input"
        >
          <ExchangeIcon />
          Switch
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {mode === 'encode' ? 'Text to Encode' : 'URL Encoded Text'}
            </label>
            <div className="flex gap-2">
              <button
                onClick={loadSample}
                className="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              >
                Sample
              </button>
              <button
                onClick={handleClear}
                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-1"
              >
                <ClearIcon />
                Clear
              </button>
            </div>
          </div>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'encode'
                ? 'Enter text to URL encode...'
                : 'Enter URL encoded text to decode...'
            }
            className="w-full h-64 p-3 text-sm font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />

          <div className="text-xs text-gray-500 dark:text-gray-400">{input.length} characters</div>
        </div>

        {/* Output Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {mode === 'encode' ? 'URL Encoded Result' : 'Decoded Text'}
            </label>
            {output && (
              <button
                onClick={handleCopy}
                className="px-2 py-1 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <CheckIcon />
                    Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>

          <div className="relative">
            <div className="w-full h-64 p-3 text-sm font-mono bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg overflow-auto whitespace-pre-wrap">
              {error ? (
                <div className="text-red-600 dark:text-red-400">Error: {error}</div>
              ) : output ? (
                output
              ) : (
                <div className="text-gray-400 dark:text-gray-500">
                  {mode === 'encode'
                    ? 'URL encoded text will appear here...'
                    : 'Decoded text will appear here...'}
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">{output.length} characters</div>
        </div>
      </div>

      {/* Examples */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Common Use Cases:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div>
            <div className="font-medium mb-1">URL Encoding:</div>
            <div className="space-y-1">
              <div>• Query parameters with spaces/special chars</div>
              <div>• File names in URLs</div>
              <div>• Form data submission</div>
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">URL Decoding:</div>
            <div className="space-y-1">
              <div>• Reading URL parameters</div>
              <div>• Processing form data</div>
              <div>• Debugging web requests</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
