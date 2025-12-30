/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import CodeHighlighter from '@/components/CodeHighlighter';
import { lookupAll } from '@/lib/tools/network/dns-doh';

interface DNSRecords {
  a?: string[];
  aaaa?: string[];
  mx?: Array<{ exchange: string; priority: number }>;
  txt?: string[][];
  cname?: string[];
  ns?: string[];
  soa?: {
    nsname: string;
    hostmaster: string;
    serial: number;
    refresh: number;
    retry: number;
    expire: number;
    minttl: number;
  } | null;
}

const RecordTypeBadge = ({ type, count }: { type: string; count: number }) => (
  <Badge variant={count > 0 ? 'default' : 'secondary'} className="text-xs">
    {type} {count > 0 && `(${count})`}
  </Badge>
);

const RecordSection = ({
  title,
  records,
  type,
  children,
}: {
  title: string;
  records: any;
  type: string;
  children: React.ReactNode;
}) => {
  const hasRecords = Array.isArray(records) ? records.length > 0 : !!records;
  return (
    <div className="bg-card rounded-lg border p-0">
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <RecordTypeBadge
            type={type}
            count={Array.isArray(records) ? records.length : hasRecords ? 1 : 0}
          />
        </div>
      </div>
      <div className="p-4">
        {hasRecords ? (
          children
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">No {type} records found</p>
        )}
      </div>
    </div>
  );
};

// Individual record display components
const ARecord = ({ ip }: { ip: string }) => (
  <div className="flex items-center justify-between py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded border-l-4 border-green-500">
    <span className="font-mono text-sm text-gray-900 dark:text-white">{ip}</span>
    <span className="text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">
      IPv4
    </span>
  </div>
);

const AAAARecord = ({ ip }: { ip: string }) => (
  <div className="flex items-center justify-between py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-500">
    <span className="font-mono text-sm text-gray-900 dark:text-white break-all">{ip}</span>
    <span className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
      IPv6
    </span>
  </div>
);

const MXRecord = ({ exchange, priority }: { exchange: string; priority: number }) => (
  <div className="flex items-center justify-between py-2 px-3 bg-purple-50 dark:bg-purple-900/20 rounded border-l-4 border-purple-500">
    <div>
      <span className="font-mono text-sm text-gray-900 dark:text-white">{exchange}</span>
    </div>
    <span className="text-xs text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded">
      Priority: {priority}
    </span>
  </div>
);

const TXTRecord = ({ txt }: { txt: string[] }) => (
  <div className="py-2 px-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-4 border-yellow-500">
    <pre className="font-mono text-xs text-gray-900 dark:text-white whitespace-pre-wrap break-words">
      {txt.join('')}
    </pre>
  </div>
);

const NSRecord = ({ ns }: { ns: string }) => (
  <div className="flex items-center py-2 px-3 bg-indigo-50 dark:bg-indigo-900/20 rounded border-l-4 border-indigo-500">
    <span className="font-mono text-sm text-gray-900 dark:text-white">{ns}</span>
  </div>
);

const CNAMERecord = ({ cname }: { cname: string }) => (
  <div className="flex items-center py-2 px-3 bg-orange-50 dark:bg-orange-900/20 rounded border-l-4 border-orange-500">
    <span className="font-mono text-sm text-gray-900 dark:text-white">{cname}</span>
  </div>
);

// Icons

export default function DNSAnalysisPage() {
  const [domain, setDomain] = useState('');
  const [displayDomain, setDisplayDomain] = useState<string | null>(null); // Only updates after successful fetch
  const [records, setRecords] = useState<DNSRecords | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<string>('');
  const [showRaw, setShowRaw] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sample domains for quick testing
  const sampleDomains = ['google.com', 'github.com', 'cloudflare.com'];

  // Normalize user input to a plain domain (strip protocol/path/queries/ports prefixes)
  const sanitizeDomainInput = useCallback((value: string) => {
    const trimmed = value.trim();
    const withoutProtocol = trimmed.replace(/^(https?:\/\/)/i, '');
    const withoutWww = withoutProtocol.replace(/^www\./i, '');
    const withoutPath = withoutWww.split(/[\/?#]/)[0];
    return withoutPath;
  }, []);

  const dnsAnalysis = useCallback(async (input: string): Promise<DNSRecords> => {
    const allRecords = await lookupAll(input.trim());

    const result: DNSRecords = {};

    // Parse A records
    if (allRecords.a && allRecords.a.length > 0) {
      result.a = allRecords.a.map((record) => record.data);
    }

    // Parse AAAA records
    if (allRecords.aaaa && allRecords.aaaa.length > 0) {
      result.aaaa = allRecords.aaaa.map((record) => record.data);
    }

    // Parse MX records
    if (allRecords.mx && allRecords.mx.length > 0) {
      result.mx = allRecords.mx
        .map((record) => {
          const parts = record.data.split(/\s+/);
          return {
            priority: parseInt(parts[0], 10),
            exchange: parts[1],
          };
        })
        .sort((a, b) => a.priority - b.priority);
    }

    // Parse TXT records
    if (allRecords.txt && allRecords.txt.length > 0) {
      result.txt = allRecords.txt.map((record) => [record.data]);
    }

    // Parse CNAME records
    if (allRecords.cname && allRecords.cname.length > 0) {
      result.cname = allRecords.cname.map((record) => record.data);
    }

    // Parse NS records
    if (allRecords.ns && allRecords.ns.length > 0) {
      result.ns = allRecords.ns.map((record) => record.data);
    }

    // Parse SOA record
    if (allRecords.soa && allRecords.soa.length > 0) {
      const soaData = allRecords.soa[0].data;
      const parts = soaData.split(/\s+/);
      if (parts.length >= 7) {
        result.soa = {
          nsname: parts[0],
          hostmaster: parts[1],
          serial: parseInt(parts[2], 10),
          refresh: parseInt(parts[3], 10),
          retry: parseInt(parts[4], 10),
          expire: parseInt(parts[5], 10),
          minttl: parseInt(parts[6], 10),
        };
      }
    }

    return result;
  }, []);

  const handleAnalyze = useCallback(async () => {
    const normalized = sanitizeDomainInput(domain);

    if (!normalized) {
      setError('Please enter a domain name');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecords(null);
    setRawData('');
    setDisplayDomain((prev) => prev); // keep previous label until new data arrives

    try {
      const result = await dnsAnalysis(normalized);
      setRecords(result);
      setRawData(JSON.stringify(result, null, 2));
      setDisplayDomain(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [domain, dnsAnalysis, sanitizeDomainInput]);

  const handleClear = useCallback(() => {
    setDomain('');
    setRecords(null);
    setError(null);
    setRawData('');
    setShowRaw(false);
    setDisplayDomain(null);
    inputRef.current?.focus();
  }, []);

  const handleSampleDomain = useCallback(
    (sampleDomain: string) => {
      setDomain(sanitizeDomainInput(sampleDomain));
      setError(null);
    },
    [sanitizeDomainInput],
  );

  // Auto-analyze on Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isLoading) {
        handleAnalyze();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleClear();
      }
    },
    [handleAnalyze, handleClear, isLoading],
  );

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold">DNS Analysis Tool</h1>
            <span className="text-sm text-muted-foreground">
              Comprehensive DNS record lookup for any domain. Get A, AAAA, MX, TXT, CNAME, NS, and
              SOA records with detailed analysis.
            </span>
          </div>
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
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !domain.trim()}
            title="Analyze DNS"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Analyze
          </Button>
          <Button variant="ghost" onClick={handleClear} title="Clear input (⌘K)" disabled={!domain}>
            Clear
          </Button>
          <span className="text-xs text-muted-foreground ml-4">Try:</span>
          {sampleDomains.map((sampleDomain) => (
            <Button
              key={sampleDomain}
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => handleSampleDomain(sampleDomain)}
            >
              {sampleDomain}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content: Single Scrollable Panel */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          {records && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-card rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {displayDomain ? `DNS Records for ${displayDomain}` : 'DNS Records'}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button variant="link" size="sm" onClick={() => setShowRaw(!showRaw)}>
                      {showRaw ? 'Hide' : 'Show'} Raw Data
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAnalyze}
                      disabled={isLoading}
                      title="Refresh"
                    >
                      Refresh
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <RecordTypeBadge type="A" count={records.a?.length || 0} />
                  <RecordTypeBadge type="AAAA" count={records.aaaa?.length || 0} />
                  <RecordTypeBadge type="MX" count={records.mx?.length || 0} />
                  <RecordTypeBadge type="TXT" count={records.txt?.length || 0} />
                  <RecordTypeBadge type="CNAME" count={records.cname?.length || 0} />
                  <RecordTypeBadge type="NS" count={records.ns?.length || 0} />
                  <RecordTypeBadge type="SOA" count={records.soa ? 1 : 0} />
                </div>
              </div>

              {/* Raw Data Display */}
              {showRaw && (
                <div className="bg-card rounded-lg border">
                  <div className="px-4 py-3 border-b">
                    <h3 className="text-lg font-semibold">Raw JSON Data</h3>
                  </div>
                  <div className="p-4">
                    <CodeHighlighter code={rawData} language="json" maxHeight="400px" />
                  </div>
                </div>
              )}

              {/* A Records */}
              {records.a && records.a.length > 0 && (
                <RecordSection title="A Records (IPv4)" records={records.a} type="A">
                  <div className="space-y-2">
                    {records.a.map((ip, index) => (
                      <ARecord key={index} ip={ip} />
                    ))}
                  </div>
                </RecordSection>
              )}

              {/* AAAA Records */}
              {records.aaaa && records.aaaa.length > 0 && (
                <RecordSection title="AAAA Records (IPv6)" records={records.aaaa} type="AAAA">
                  <div className="space-y-2">
                    {records.aaaa.map((ip, index) => (
                      <AAAARecord key={index} ip={ip} />
                    ))}
                  </div>
                </RecordSection>
              )}

              {/* MX Records */}
              {records.mx && records.mx.length > 0 && (
                <RecordSection title="MX Records (Mail Exchange)" records={records.mx} type="MX">
                  <div className="space-y-2">
                    {records.mx
                      .sort((a, b) => a.priority - b.priority)
                      .map((mx, index) => (
                        <MXRecord key={index} exchange={mx.exchange} priority={mx.priority} />
                      ))}
                  </div>
                </RecordSection>
              )}

              {/* TXT Records */}
              {records.txt && records.txt.length > 0 && (
                <RecordSection title="TXT Records" records={records.txt} type="TXT">
                  <div className="space-y-2">
                    {records.txt.map((txt, index) => (
                      <TXTRecord key={index} txt={txt} />
                    ))}
                  </div>
                </RecordSection>
              )}

              {/* CNAME Records */}
              {records.cname && records.cname.length > 0 && (
                <RecordSection title="CNAME Records" records={records.cname} type="CNAME">
                  <div className="space-y-2">
                    {records.cname.map((cname, index) => (
                      <CNAMERecord key={index} cname={cname} />
                    ))}
                  </div>
                </RecordSection>
              )}

              {/* NS Records */}
              {records.ns && records.ns.length > 0 && (
                <RecordSection title="NS Records (Name Servers)" records={records.ns} type="NS">
                  <div className="space-y-2">
                    {records.ns.map((ns, index) => (
                      <NSRecord key={index} ns={ns} />
                    ))}
                  </div>
                </RecordSection>
              )}

              {/* SOA Record */}
              {records.soa && (
                <RecordSection
                  title="SOA Record (Start of Authority)"
                  records={records.soa}
                  type="SOA"
                >
                  <div className="bg-muted/10 rounded-lg p-4 border-l-4 border-muted">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Primary NS:</span>
                        <span className="ml-2 font-mono">{records.soa.nsname}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Hostmaster:</span>
                        <span className="ml-2 font-mono">{records.soa.hostmaster}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Serial:</span>
                        <span className="ml-2 font-mono">{records.soa.serial}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Refresh:</span>
                        <span className="ml-2 font-mono">{records.soa.refresh}s</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Retry:</span>
                        <span className="ml-2 font-mono">{records.soa.retry}s</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Expire:</span>
                        <span className="ml-2 font-mono">{records.soa.expire}s</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-muted-foreground">Min TTL:</span>
                        <span className="ml-2 font-mono">{records.soa.minttl}s</span>
                      </div>
                    </div>
                  </div>
                </RecordSection>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
