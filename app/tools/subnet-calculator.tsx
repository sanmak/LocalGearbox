/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Network, Globe, Binary, Copy, Check, AlertCircle, Minus, Plus, Info } from 'lucide-react';
import {
  calculateSubnet,
  type SubnetInput,
  type SubnetResult,
  type IPv4Result,
  type IPv6Result,
} from '@/lib/tools/network/subnet-calculator';

// ─── Types ───────────────────────────────────────────────────────────────────

type IpVersion = 'ipv4' | 'ipv6';

interface QuickSubnet {
  label: string;
  cidr: number;
  description: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const IPV4_QUICK_SUBNETS: QuickSubnet[] = [
  { label: '/8', cidr: 8, description: 'Class A' },
  { label: '/16', cidr: 16, description: 'Class B' },
  { label: '/24', cidr: 24, description: 'Class C' },
  { label: '/25', cidr: 25, description: '128 hosts' },
  { label: '/26', cidr: 26, description: '64 hosts' },
  { label: '/27', cidr: 27, description: '32 hosts' },
  { label: '/28', cidr: 28, description: '16 hosts' },
  { label: '/30', cidr: 30, description: 'P2P link' },
  { label: '/32', cidr: 32, description: 'Host route' },
];

const IPV6_QUICK_SUBNETS: QuickSubnet[] = [
  { label: '/32', cidr: 32, description: 'ISP allocation' },
  { label: '/48', cidr: 48, description: 'Site prefix' },
  { label: '/56', cidr: 56, description: 'Subscriber' },
  { label: '/64', cidr: 64, description: 'Standard subnet' },
  { label: '/128', cidr: 128, description: 'Host route' },
];

const SAMPLE_IPV4 = [
  { address: '192.168.1.0', cidr: 24, label: '192.168.1.0/24' },
  { address: '10.0.0.0', cidr: 8, label: '10.0.0.0/8' },
  { address: '172.16.0.0', cidr: 12, label: '172.16.0.0/12' },
];

const SAMPLE_IPV6 = [
  { address: '2001:db8::', cidr: 32, label: '2001:db8::/32' },
  { address: 'fe80::', cidr: 10, label: 'fe80::/10' },
  { address: '::1', cidr: 128, label: '::1/128' },
];

// ─── Subcomponents ───────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [value]);

  return (
    <button
      onClick={handleCopy}
      className="ml-2 inline-flex items-center justify-center rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title="Copy to clipboard"
      aria-label={`Copy ${value} to clipboard`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function ResultRow({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50 transition-colors">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <div className="flex items-center">
        <span className={`text-sm text-foreground ${mono ? 'font-mono' : ''}`}>{value}</span>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

function BitVisualizer({
  networkBits,
  hostBits,
  binaryAddress,
  isIpv6,
}: {
  networkBits: number;
  hostBits: number;
  binaryAddress: string;
  isIpv6: boolean;
}) {
  const totalBits = networkBits + hostBits;
  const bitsOnly = binaryAddress.replace(/[.:]/g, '');

  // For display purposes, break into manageable chunks
  const chunkSize = isIpv6 ? 16 : 8;
  const separator = isIpv6 ? ':' : '.';
  const chunks: string[] = [];
  for (let i = 0; i < bitsOnly.length; i += chunkSize) {
    chunks.push(bitsOnly.slice(i, i + chunkSize));
  }

  let bitIndex = 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Binary className="h-4 w-4" />
          Bit Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual bar */}
        <div className="space-y-2">
          <div className="flex rounded-md overflow-hidden h-8 border">
            <div
              className="bg-blue-500/20 border-r border-blue-500 flex items-center justify-center text-xs font-medium text-blue-700 dark:text-blue-300"
              style={{ width: `${(networkBits / totalBits) * 100}%` }}
            >
              {networkBits > 3 && `Network (${networkBits})`}
            </div>
            <div
              className="bg-emerald-500/20 flex items-center justify-center text-xs font-medium text-emerald-700 dark:text-emerald-300"
              style={{ width: `${(hostBits / totalBits) * 100}%` }}
            >
              {hostBits > 3 && `Host (${hostBits})`}
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Bit 0</span>
            <span>Bit {totalBits - 1}</span>
          </div>
        </div>

        {/* Binary representation */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Binary Representation</Label>
          <div className="font-mono text-xs leading-relaxed p-3 rounded-md bg-muted/50 border overflow-x-auto">
            <div className="flex flex-wrap gap-y-1">
              {chunks.map((chunk, chunkIdx) => {
                const startBit = bitIndex;
                bitIndex += chunk.length;
                return (
                  <span key={chunkIdx} className="inline-flex">
                    {chunk.split('').map((bit, bitIdx) => {
                      const globalBitIdx = startBit + bitIdx;
                      const isNetwork = globalBitIdx < networkBits;
                      return (
                        <span
                          key={bitIdx}
                          className={
                            isNetwork
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {bit}
                        </span>
                      );
                    })}
                    {chunkIdx < chunks.length - 1 && (
                      <span className="text-muted-foreground mx-0.5">{separator}</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-blue-500/20 border border-blue-500" />
              <span className="text-muted-foreground">Network bits</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500" />
              <span className="text-muted-foreground">Host bits</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IPv4Results({ result }: { result: IPv4Result }) {
  return (
    <div className="space-y-4">
      {/* Address Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Network className="h-4 w-4" />
            Network Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y divide-border">
          <ResultRow label="Network Address" value={result.networkAddress} />
          <ResultRow label="Broadcast Address" value={result.broadcastAddress} />
          <ResultRow label="First Usable Host" value={result.firstUsableHost} />
          <ResultRow label="Last Usable Host" value={result.lastUsableHost} />
          <ResultRow label="Total Hosts" value={result.totalHosts.toLocaleString()} mono={false} />
          <ResultRow
            label="Usable Hosts"
            value={result.usableHosts.toLocaleString()}
            mono={false}
          />
        </CardContent>
      </Card>

      {/* Mask Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            Subnet Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y divide-border">
          <ResultRow label="Subnet Mask" value={result.subnetMask} />
          <ResultRow label="Wildcard Mask" value={result.wildcardMask} />
          <ResultRow label="CIDR Notation" value={`/${result.cidr}`} />
          <div className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50 transition-colors">
            <span className="text-sm text-muted-foreground font-medium">IP Class</span>
            <Badge variant="secondary">{result.ipClass}</Badge>
          </div>
          <div className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50 transition-colors">
            <span className="text-sm text-muted-foreground font-medium">Address Type</span>
            <Badge variant={result.isPrivate ? 'default' : 'outline'}>
              {result.isPrivate ? 'Private' : 'Public'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Bit Breakdown */}
      <BitVisualizer
        networkBits={result.networkBits}
        hostBits={result.hostBits}
        binaryAddress={result.binaryAddress}
        isIpv6={false}
      />
    </div>
  );
}

function IPv6Results({ result }: { result: IPv6Result }) {
  return (
    <div className="space-y-4">
      {/* Address Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Network Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y divide-border">
          <ResultRow label="Network Address" value={result.networkAddress} />
          <ResultRow label="Range Start" value={result.addressRangeStart} />
          <ResultRow label="Range End" value={result.addressRangeEnd} />
          <ResultRow label="Total Addresses" value={result.totalAddresses} mono={false} />
        </CardContent>
      </Card>

      {/* Address Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            Address Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y divide-border">
          <ResultRow label="Expanded Form" value={result.expandedForm} />
          <ResultRow label="Compressed Form" value={result.compressedForm} />
          <ResultRow label="CIDR Notation" value={`/${result.cidr}`} />
          <div className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50 transition-colors">
            <span className="text-sm text-muted-foreground font-medium">Address Type</span>
            <Badge variant="secondary">{result.addressType}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Bit Breakdown */}
      <BitVisualizer
        networkBits={result.networkBits}
        hostBits={result.hostBits}
        binaryAddress={result.binaryAddress}
        isIpv6={true}
      />
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function SubnetCalculatorPage() {
  const [ipVersion, setIpVersion] = useState<IpVersion>('ipv4');
  const [address, setAddress] = useState('192.168.1.0');
  const [cidr, setCidr] = useState(24);
  const [result, setResult] = useState<SubnetResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const maxCidr = ipVersion === 'ipv4' ? 32 : 128;
  const quickSubnets = ipVersion === 'ipv4' ? IPV4_QUICK_SUBNETS : IPV6_QUICK_SUBNETS;
  const samples = ipVersion === 'ipv4' ? SAMPLE_IPV4 : SAMPLE_IPV6;

  const handleCalculate = useCallback(() => {
    if (!address.trim()) {
      setError('Please enter an IP address');
      setResult(null);
      return;
    }

    const input: SubnetInput = {
      address: address.trim(),
      cidr,
      type: ipVersion,
    };

    const calcResult = calculateSubnet(input);

    if (!calcResult.valid) {
      setError('error' in calcResult ? calcResult.error : 'Invalid input');
      setResult(null);
      return;
    }

    setError(null);
    setResult(calcResult);
  }, [address, cidr, ipVersion]);

  const handleVersionChange = useCallback((version: string) => {
    const newVersion = version as IpVersion;
    setIpVersion(newVersion);
    setResult(null);
    setError(null);
    if (newVersion === 'ipv4') {
      setAddress('192.168.1.0');
      setCidr(24);
    } else {
      setAddress('2001:db8::');
      setCidr(64);
    }
  }, []);

  const handleCidrChange = useCallback(
    (value: number) => {
      const clamped = Math.max(0, Math.min(maxCidr, value));
      setCidr(clamped);
    },
    [maxCidr],
  );

  const handleSample = useCallback(
    (sampleAddress: string, sampleCidr: number) => {
      setAddress(sampleAddress);
      setCidr(sampleCidr);
      setError(null);

      const input: SubnetInput = {
        address: sampleAddress,
        cidr: sampleCidr,
        type: ipVersion,
      };
      const calcResult = calculateSubnet(input);
      if (calcResult.valid) {
        setResult(calcResult);
      }
    },
    [ipVersion],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleCalculate();
      }
    },
    [handleCalculate],
  );

  const cidrSliderPercent = useMemo(() => {
    return maxCidr > 0 ? (cidr / maxCidr) * 100 : 0;
  }, [cidr, maxCidr]);

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold">Subnet Calculator</h1>
            <span className="text-sm text-muted-foreground">
              Calculate IPv4 and IPv6 subnet details including network address, host range, masks,
              and binary representation.
            </span>
          </div>
        </div>
      </div>

      {/* Options Bar */}
      <div className="px-4 py-3 bg-muted/20 border-b">
        <div className="flex flex-col gap-3">
          {/* IP Version Toggle */}
          <div className="flex items-center gap-4">
            <Tabs value={ipVersion} onValueChange={handleVersionChange}>
              <TabsList>
                <TabsTrigger value="ipv4" className="gap-1.5">
                  <Network className="h-3.5 w-3.5" />
                  IPv4
                </TabsTrigger>
                <TabsTrigger value="ipv6" className="gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  IPv6
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="h-6 w-px bg-border" />

            <span className="text-xs text-muted-foreground">Try:</span>
            {samples.map((sample) => (
              <Button
                key={sample.label}
                variant="ghost"
                size="sm"
                className="text-xs font-mono"
                onClick={() => handleSample(sample.address, sample.cidr)}
              >
                {sample.label}
              </Button>
            ))}
          </div>

          {/* Input Row */}
          <div className="flex items-end gap-3">
            <div className="flex-1 max-w-sm">
              <Label htmlFor="ip-address" className="text-xs text-muted-foreground mb-1.5 block">
                IP Address
              </Label>
              <Input
                id="ip-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={ipVersion === 'ipv4' ? '192.168.1.0' : '2001:db8::'}
                className="font-mono text-sm"
                aria-label="IP address input"
              />
            </div>

            <div className="w-24">
              <Label htmlFor="cidr-input" className="text-xs text-muted-foreground mb-1.5 block">
                CIDR (/{cidr})
              </Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => handleCidrChange(cidr - 1)}
                  disabled={cidr <= 0}
                  aria-label="Decrease CIDR"
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <Input
                  id="cidr-input"
                  type="number"
                  min={0}
                  max={maxCidr}
                  value={cidr}
                  onChange={(e) => handleCidrChange(parseInt(e.target.value, 10) || 0)}
                  onKeyDown={handleKeyDown}
                  className="font-mono text-sm text-center w-16"
                  aria-label="CIDR prefix length"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => handleCidrChange(cidr + 1)}
                  disabled={cidr >= maxCidr}
                  aria-label="Increase CIDR"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <Button onClick={handleCalculate} aria-label="Calculate subnet">
              Calculate
            </Button>
          </div>

          {/* CIDR Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-6 text-right">0</span>
            <div className="flex-1 max-w-lg relative">
              <div className="h-2 rounded-full bg-muted border overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-150"
                  style={{ width: `${cidrSliderPercent}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={maxCidr}
                value={cidr}
                onChange={(e) => handleCidrChange(parseInt(e.target.value, 10))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="CIDR slider"
              />
            </div>
            <span className="text-xs text-muted-foreground w-8">{maxCidr}</span>
          </div>

          {/* Quick Select Subnets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Quick select:</span>
            {quickSubnets.map((subnet) => (
              <Button
                key={subnet.cidr}
                variant={cidr === subnet.cidr ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => handleCidrChange(subnet.cidr)}
                title={subnet.description}
              >
                {subnet.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && result.valid && (
            <div className="space-y-4">
              {/* Summary Header */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      {result.address}/{result.cidr}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {result.type === 'ipv4' ? 'IPv4' : 'IPv6'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Network bits:</span>
                      <Badge variant="secondary" className="font-mono">
                        {result.networkBits}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Host bits:</span>
                      <Badge variant="secondary" className="font-mono">
                        {result.hostBits}
                      </Badge>
                    </div>
                    {result.type === 'ipv4' && (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Class:</span>
                          <Badge variant="secondary">{result.ipClass}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Scope:</span>
                          <Badge variant={result.isPrivate ? 'default' : 'outline'}>
                            {result.isPrivate ? 'Private' : 'Public'}
                          </Badge>
                        </div>
                      </>
                    )}
                    {result.type === 'ipv6' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Type:</span>
                        <Badge variant="secondary">{result.addressType}</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Results */}
              {result.type === 'ipv4' && <IPv4Results result={result} />}
              {result.type === 'ipv6' && <IPv6Results result={result} />}
            </div>
          )}

          {/* Empty State */}
          {!result && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Network className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Enter an IP address and CIDR prefix
              </h3>
              <p className="text-sm text-muted-foreground/70 max-w-md">
                Calculate network details, host ranges, subnet masks, and binary representations for
                both IPv4 and IPv6 addresses.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
