/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import CodeHighlighter from '@/components/CodeHighlighter';
import { resolveDNS } from '@/lib/tools/network/dns-doh';

type NsRecord = string[];

const nameServerLookup = async (input: string): Promise<NsRecord> => {
  const response = await resolveDNS(input, 'NS');

  if (!response.Answer || response.Answer.length === 0) {
    return [];
  }

  return response.Answer.map((record) => record.data);
};

export default function NameServerLookupPage() {
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
    if (!records) return [];
    return [...records].sort();
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
    try {
      const result = await nameServerLookup(normalized);
      setRecords(result);
      setRawData(JSON.stringify(result, null, 2));
      setDisplayDomain(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [domain, sanitizeDomainInput]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleLookup();
      }
    },
    [handleLookup],
  );

  const handleClear = useCallback(() => {
    setDomain('');
    setRecords(null);
    setError(null);
    setRawData('');
    setDisplayDomain(null);
    inputRef.current?.focus();
  }, []);

  const handleSample = useCallback((sample: string) => {
    setDomain(sample);
    // We can optionally trigger lookup automatically
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-card">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">Name Server Lookup</h1>
          <span className="text-sm text-muted-foreground">
            Discover the authoritative NS records for a domain. Validate delegation targets and
            redundancy.
          </span>
        </div>
      </div>

      {/* Options Bar */}
      <div className="px-4 py-2 bg-muted/20 border-b">
        <div className="flex items-center gap-4">
          <Input
            ref={inputRef}
            value={domain}
            onChange={(e) => setDomain(sanitizeDomainInput(e.target.value))}
            onKeyDown={handleKeyDown}
            placeholder="Enter domain name (e.g., example.com)"
            className="w-[320px] font-mono text-sm"
          />
          <Button onClick={handleLookup} disabled={isLoading || !domain.trim()} title="Lookup NS">
            {isLoading ? <span className="mr-2 animate-spin">🔄</span> : null}
            Lookup
          </Button>
          <Button variant="ghost" onClick={handleClear} title="Clear input (⌘K)" disabled={!domain}>
            Clear
          </Button>
          <span className="text-xs text-muted-foreground ml-4">Try:</span>
          {sampleDomains.map((sample) => (
            <Button
              key={sample}
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => handleSample(sample)}
            >
              {sample}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content: Single Scrollable Panel */}
      <ScrollArea className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {records && (
            <div className="space-y-4">
              <div className="bg-card rounded-lg border p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">
                      {displayDomain ? `NS Records for ${displayDomain}` : 'NS Records'}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge>
                        {records.length} server{records.length === 1 ? '' : 's'}
                      </Badge>
                      <span>Authoritative name servers for this domain.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="link" size="sm" onClick={() => setShowRaw((v) => !v)}>
                      {showRaw ? 'Hide raw' : 'Show raw'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLookup}
                      disabled={isLoading}
                      title="Refresh"
                    >
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>

              {showRaw && (
                <div className="bg-card rounded-lg border">
                  <div className="px-4 py-3 border-b">
                    <h3 className="text-lg font-semibold">Raw JSON</h3>
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
                    className="bg-card border rounded-lg p-4 flex flex-col gap-2 shadow-sm"
                  >
                    <div className="text-sm text-muted-foreground">Name Server</div>
                    <div className="text-base font-mono break-words">{ns}</div>
                    <div className="text-sm text-muted-foreground">
                      Authoritative for this domain.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!records && !isLoading && !error && (
            <div className="bg-card border rounded-lg p-6 text-center text-muted-foreground">
              Enter a domain to lookup NS records.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
