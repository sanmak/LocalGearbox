/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import CodeHighlighter from '@/components/CodeHighlighter';
import { resolveDNS } from '@/lib/tools/network/dns-doh';

type NsRecord = string[];

const SearchIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400 dark:text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const ClearIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200">
    {children}
  </span>
);

const namespaceServerDelegation = async (input: string): Promise<NsRecord> => {
  const response = await resolveDNS(input, 'NS');

  if (!response.Answer || response.Answer.length === 0) {
    return [];
  }

  return response.Answer.map((record) => record.data);
};

export default function NamespaceServerDelegationPage() {
  const [domain, setDomain] = useState('');
  const [displayDomain, setDisplayDomain] = useState<string | null>(null);
  const [records, setRecords] = useState<NsRecord | null>(null);
  const [rawData, setRawData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const sampleDomains = [
    'example.com',
    'google.com',
    'cloudflare.com',
    'github.com',
    'microsoft.com',
  ];

  const sanitizeDomainInput = useCallback((value: string) => {
    const trimmed = value.trim();
    const withoutProtocol = trimmed.replace(/^(https?:\/\/)/i, '');
    const withoutWww = withoutProtocol.replace(/^www\./i, '');
    const withoutPath = withoutWww.split(/[\/?#]/)[0];
    return withoutPath;
  }, []);

  const sortedRecords = useMemo(() => {
    if (!records) return [] as NsRecord;
    return [...records].sort((a, b) => a.localeCompare(b));
  }, [records]);

  const handleLookup = useCallback(async () => {
    const normalized = sanitizeDomainInput(domain);
    if (!normalized) {
      setError('Please enter a domain name');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecords(null);
    setRawData('');
    setDisplayDomain((prev) => prev);

    try {
      const result = await namespaceServerDelegation(normalized);
      setRecords(result);
      setRawData(JSON.stringify(result, null, 2));
      setDisplayDomain(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [domain, sanitizeDomainInput]);

  const handleClear = useCallback(() => {
    setDomain('');
    setRecords(null);
    setRawData('');
    setError(null);
    setShowRaw(false);
    setDisplayDomain(null);
    inputRef.current?.focus();
  }, []);

  const handleSample = useCallback(
    (sample: string) => {
      setDomain(sanitizeDomainInput(sample));
      setError(null);
    },
    [sanitizeDomainInput],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isLoading) {
        handleLookup();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleClear();
      }
    },
    [handleLookup, handleClear, isLoading],
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Namespace Server Delegation
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Inspect the NS delegation for a domain and verify the targets that serve its zone.
            </p>
          </div>

          <div className="mt-8 max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(sanitizeDomainInput(e.target.value))}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter domain name (e.g., example.com)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>
              <button
                onClick={handleLookup}
                disabled={isLoading || !domain.trim()}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:cursor-not-allowed min-w-[110px] justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Looking up...</span>
                  </>
                ) : (
                  <>Lookup</>
                )}
              </button>
              <button
                onClick={handleClear}
                className="p-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
                title="Clear input (⌘K)"
              >
                <ClearIcon />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span>Try these:</span>
              {sampleDomains.map((sample) => (
                <button
                  key={sample}
                  onClick={() => handleSample(sample)}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {records && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {displayDomain ? `Delegation NS for ${displayDomain}` : 'Delegation NS'}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Badge>
                      {records.length} server{records.length === 1 ? '' : 's'}
                    </Badge>
                    <span>NS hosts currently published for this zone.</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRaw((v) => !v)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showRaw ? 'Hide raw' : 'Show raw'}
                  </button>
                  <button
                    onClick={handleLookup}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors border border-gray-200 dark:border-gray-700 rounded"
                  >
                    <RefreshIcon />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {showRaw && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Raw JSON</h3>
                </div>
                <div className="p-4">
                  <CodeHighlighter code={rawData} language="json" maxHeight="320px" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sortedRecords.map((ns, idx) => (
                <div
                  key={`${ns}-${idx}`}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col gap-2 shadow-sm"
                >
                  <div className="text-sm text-gray-500 dark:text-gray-400">Delegated NS</div>
                  <div className="text-base font-mono text-gray-900 dark:text-white break-words">
                    {ns}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Confirm glue and availability across regions.
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!records && !isLoading && !error && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
            Enter a domain to inspect its delegation NS records.
          </div>
        )}
      </div>
    </div>
  );
}
