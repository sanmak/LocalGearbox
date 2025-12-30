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

type PtrResult = string[];

const reverseDnsLookup = async (input: string): Promise<PtrResult> => {
  // Convert IP address to reverse DNS format (arpa domain)
  const parts = input.split('.');
  if (parts.length !== 4) {
    throw new Error('Invalid IPv4 address');
  }

  const arpa = `${parts[3]}.${parts[2]}.${parts[1]}.${parts[0]}.in-addr.arpa`;
  const response = await resolveDNS(arpa, 'PTR');

  if (!response.Answer || response.Answer.length === 0) {
    return [];
  }

  return response.Answer.map((record) => record.data);
};

export default function ReverseDNSLookupPage() {
  const [ip, setIp] = useState('');
  const [displayIp, setDisplayIp] = useState<string | null>(null);
  const [ptrRecords, setPtrRecords] = useState<PtrResult | null>(null);
  const [rawData, setRawData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const sampleIps = ['8.8.8.8', '1.1.1.1', '208.67.222.222', '9.9.9.9', '8.8.4.4'];

  const sanitizeIpInput = useCallback((value: string) => {
    const trimmed = value.trim();
    const withoutProtocol = trimmed.replace(/^(https?:\/\/)/i, '');
    const withoutPath = withoutProtocol.split(/[\/?#]/)[0];
    return withoutPath;
  }, []);

  const sortedPtr = useMemo(() => {
    if (!ptrRecords) return [];
    return [...ptrRecords].sort();
  }, [ptrRecords]);

  const handleLookup = useCallback(async () => {
    const normalized = sanitizeIpInput(ip);
    if (!normalized) {
      setError('Please enter an IP address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPtrRecords(null);
    setRawData('');
    setDisplayIp((prev) => prev);

    try {
      const result = await reverseDnsLookup(normalized);
      setPtrRecords(result);
      setRawData(JSON.stringify(result, null, 2));
      setDisplayIp(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [ip, sanitizeIpInput]);

  const handleClear = useCallback(() => {
    setIp('');
    setPtrRecords(null);
    setRawData('');
    setError(null);
    setShowRaw(false);
    setDisplayIp(null);
    inputRef.current?.focus();
  }, []);

  const handleSample = useCallback(
    (sample: string) => {
      setIp(sanitizeIpInput(sample));
      setError(null);
    },
    [sanitizeIpInput],
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
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-card">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">Reverse DNS Lookup</h1>
          <span className="text-sm text-muted-foreground">
            Find the hostnames (PTR records) associated with an IP address. Validate mail server
            PTRs and network reputation quickly.
          </span>
        </div>
      </div>

      {/* Options Bar */}
      <div className="px-4 py-2 bg-muted/20 border-b">
        <div className="flex items-center gap-4">
          <Input
            ref={inputRef}
            value={ip}
            onChange={(e) => setIp(sanitizeIpInput(e.target.value))}
            onKeyDown={handleKeyDown}
            placeholder="Enter IP address (e.g., 8.8.8.8)"
            className="w-[320px] font-mono text-sm"
          />
          <Button onClick={handleLookup} disabled={isLoading || !ip.trim()} title="Lookup PTR">
            {isLoading ? <span className="mr-2 animate-spin">🔄</span> : null}
            Lookup
          </Button>
          <Button variant="ghost" onClick={handleClear} title="Clear input (⌘K)" disabled={!ip}>
            Clear
          </Button>
          <span className="text-xs text-muted-foreground ml-4">Try:</span>
          {sampleIps.map((sample) => (
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

          {ptrRecords && (
            <div className="space-y-4">
              <div className="bg-card rounded-lg border p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">
                      {displayIp ? `PTR Records for ${displayIp}` : 'PTR Records'}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge>PTR</Badge>
                      <span>Hostnames for this IP address.</span>
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
                {sortedPtr.map((host, idx) => (
                  <div
                    key={`${host}-${idx}`}
                    className="bg-card border rounded-lg p-4 flex flex-col gap-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Hostname</span>
                      <Badge>PTR</Badge>
                    </div>
                    <div className="text-base font-mono break-words">{host}</div>
                    <div className="text-sm text-muted-foreground">
                      Reverse mapped from IP address.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!ptrRecords && !isLoading && !error && (
            <div className="bg-card border rounded-lg p-6 text-center text-muted-foreground">
              Enter an IP address to view PTR records.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
