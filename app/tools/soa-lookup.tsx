/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import CodeHighlighter from '@/components/CodeHighlighter';
import { resolveDNS } from '@/lib/tools/network/dns-doh';

type SoaRecord = {
  nsname: string;
  hostmaster: string;
  serial: number;
  refresh: number;
  retry: number;
  expire: number;
  minttl: number;
};

const formatSeconds = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const parts = [] as string[];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (mins || (!days && !hours)) parts.push(`${mins}m`);
  return parts.join(' ');
};

const soaLookup = async (input: string): Promise<SoaRecord> => {
  const response = await resolveDNS(input, 'SOA');

  if (!response.Answer || response.Answer.length === 0) {
    throw new Error('No SOA record found for this domain');
  }

  // SOA data format: "nsname hostmaster serial refresh retry expire minttl"
  const soaData = response.Answer[0].data;
  const parts = soaData.split(/\s+/);

  if (parts.length < 7) {
    throw new Error('Invalid SOA record format');
  }

  return {
    nsname: parts[0],
    hostmaster: parts[1],
    serial: parseInt(parts[2], 10),
    refresh: parseInt(parts[3], 10),
    retry: parseInt(parts[4], 10),
    expire: parseInt(parts[5], 10),
    minttl: parseInt(parts[6], 10),
  };
};

export default function SOALookupPage() {
  const [domain, setDomain] = useState('');
  const [displayDomain, setDisplayDomain] = useState<string | null>(null);
  const [record, setRecord] = useState<SoaRecord | null>(null);
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

  const handleLookup = useCallback(async () => {
    const normalized = sanitizeDomainInput(domain);
    if (!normalized) {
      setError('Please enter a domain name');
      return;
    }
    setIsLoading(true);
    setError(null);
    setRecord(null);
    setRawData('');
    try {
      const result = await soaLookup(normalized);
      setRecord(result);
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
    setRecord(null);
    setRawData('');
    setError(null);
    setDisplayDomain(null);
    inputRef.current?.focus();
  }, []);

  const handleSample = useCallback((sample: string) => {
    setDomain(sample);
  }, []);

  // Main component return
  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-card">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">SOA Lookup</h1>
          <span className="text-sm text-muted-foreground">
            View the Start of Authority (SOA) record for a domain. Inspect primary NS, serial, and
            TTLs for troubleshooting.
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
          <Button onClick={handleLookup} disabled={isLoading || !domain.trim()} title="Lookup SOA">
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

          {record && (
            <div className="space-y-4">
              <div className="bg-card rounded-lg border p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">
                      {displayDomain ? `SOA Record for ${displayDomain}` : 'SOA Record'}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge>Primary NS</Badge>
                      <span>{record.nsname}</span>
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
                <div className="bg-card border rounded-lg p-4 flex flex-col gap-2 shadow-sm">
                  <div className="text-sm text-muted-foreground">Hostmaster</div>
                  <div className="text-base font-mono break-words">{record.hostmaster}</div>
                  <div className="text-sm text-muted-foreground">
                    Responsible party for this zone.
                  </div>
                </div>
                <div className="bg-card border rounded-lg p-4 flex flex-col gap-2 shadow-sm">
                  <div className="text-sm text-muted-foreground">Serial</div>
                  <div className="text-base font-mono break-words">{record.serial}</div>
                  <div className="text-sm text-muted-foreground">
                    Zone serial number (for updates).
                  </div>
                </div>
                <div className="bg-card border rounded-lg p-4 flex flex-col gap-2 shadow-sm">
                  <div className="text-sm text-muted-foreground">Refresh</div>
                  <div className="text-base font-mono break-words">
                    {record.refresh}s ({formatSeconds(record.refresh)})
                  </div>
                  <div className="text-sm text-muted-foreground">
                    How often secondary servers check for updates.
                  </div>
                </div>
                <div className="bg-card border rounded-lg p-4 flex flex-col gap-2 shadow-sm">
                  <div className="text-sm text-muted-foreground">Retry</div>
                  <div className="text-base font-mono break-words">
                    {record.retry}s ({formatSeconds(record.retry)})
                  </div>
                  <div className="text-sm text-muted-foreground">
                    How often to retry if refresh fails.
                  </div>
                </div>
                <div className="bg-card border rounded-lg p-4 flex flex-col gap-2 shadow-sm">
                  <div className="text-sm text-muted-foreground">Expire</div>
                  <div className="text-base font-mono break-words">
                    {record.expire}s ({formatSeconds(record.expire)})
                  </div>
                  <div className="text-sm text-muted-foreground">
                    When secondary servers stop serving zone.
                  </div>
                </div>
                <div className="bg-card border rounded-lg p-4 flex flex-col gap-2 shadow-sm">
                  <div className="text-sm text-muted-foreground">Minimum TTL</div>
                  <div className="text-base font-mono break-words">
                    {record.minttl}s ({formatSeconds(record.minttl)})
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Minimum TTL for records in this zone.
                  </div>
                </div>
              </div>
            </div>
          )}

          {!record && !isLoading && !error && (
            <div className="bg-card border rounded-lg p-6 text-center text-muted-foreground">
              Enter a domain to lookup SOA record.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
