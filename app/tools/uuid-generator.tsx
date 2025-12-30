/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  generateUUIDv1,
  generateUUIDv3,
  generateUUIDv4,
  generateUUIDv5,
  generateTimestampFirstUUID,
  generateNilUUID,
  generateMaxUUID,
  generateBulkUUIDs,
} from '@/lib/tools';
import { CopyIcon, CheckIcon, ClearIcon, SampleIcon } from '@/components/json/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';

type UUIDVersion = 'v1' | 'v3' | 'v4' | 'v5' | 'timestamp-first' | 'nil' | 'max';

interface UUIDType {
  value: UUIDVersion;
  label: string;
  description: string;
  needsInput: boolean;
}

const UUID_TYPES: UUIDType[] = [
  {
    value: 'v4',
    label: 'Version 4 (Random)',
    description: 'Random UUID - Most commonly used',
    needsInput: false,
  },
  {
    value: 'v1',
    label: 'Version 1 (Time-based)',
    description: 'Based on timestamp and MAC address',
    needsInput: false,
  },
  {
    value: 'v3',
    label: 'Version 3 (MD5)',
    description: 'Based on MD5 hash of namespace and name',
    needsInput: true,
  },
  {
    value: 'v5',
    label: 'Version 5 (SHA-1)',
    description: 'Based on SHA-1 hash of namespace and name',
    needsInput: true,
  },
  {
    value: 'timestamp-first',
    label: 'Timestamp First',
    description: 'Optimized for database ordering',
    needsInput: false,
  },
  {
    value: 'nil',
    label: 'Nil UUID',
    description: 'All zeros (00000000-0000-0000-0000-000000000000)',
    needsInput: false,
  },
  {
    value: 'max',
    label: 'Max UUID',
    description: 'All ones (ffffffff-ffff-ffff-ffff-ffffffffffff)',
    needsInput: false,
  },
];

export default function UUIDGeneratorPage() {
  const [selectedVersion, setSelectedVersion] = useState<UUIDVersion>('v4');
  const [generatedUUID, setGeneratedUUID] = useState('');
  const [bulkUUIDs, setBulkUUIDs] = useState<string[]>([]);
  const [bulkCount, setBulkCount] = useState(10);
  const [showBulk, setShowBulk] = useState(false);
  const [namespace, setNamespace] = useState('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
  const [name, setName] = useState('example-name');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = UUID_TYPES.find((type) => type.value === selectedVersion)!;

  const generateSingle = useCallback(() => {
    setError(null);
    try {
      let uuid: string;

      switch (selectedVersion) {
        case 'v1':
          uuid = generateUUIDv1();
          break;
        case 'v3':
          uuid = generateUUIDv3(namespace, name);
          break;
        case 'v4':
          uuid = generateUUIDv4();
          break;
        case 'v5':
          uuid = generateUUIDv5(namespace, name);
          break;
        case 'timestamp-first':
          uuid = generateTimestampFirstUUID();
          break;
        case 'nil':
          uuid = generateNilUUID();
          break;
        case 'max':
          uuid = generateMaxUUID();
          break;
        default:
          uuid = generateUUIDv4();
      }

      setGeneratedUUID(uuid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate UUID');
    }
  }, [selectedVersion, namespace, name]);

  const generateBulk = useCallback(() => {
    setError(null);
    try {
      const uuids = generateBulkUUIDs(bulkCount, selectedVersion, namespace, name);
      setBulkUUIDs(uuids);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate bulk UUIDs');
    }
  }, [bulkCount, selectedVersion, namespace, name]);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }, []);

  const handleCopyAll = useCallback(async () => {
    try {
      const allText = bulkUUIDs.join('\n');
      await navigator.clipboard.writeText(allText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }, [bulkUUIDs]);

  const handleClear = useCallback(() => {
    setGeneratedUUID('');
    setBulkUUIDs([]);
    setError(null);
  }, []);

  const loadSample = useCallback(() => {
    setNamespace('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
    setName('example-name');
    generateSingle();
  }, [generateSingle]);

  // Generate initial UUID
  useEffect(() => {
    generateSingle();
  }, [generateSingle]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
      <Card className="border-none rounded-none shadow-none">
        <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl">UUID Generator</CardTitle>
            <span className="text-sm text-muted-foreground">
              Generate UUIDs with multiple version support
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={loadSample} title="Load sample">
              <SampleIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              title="Clear all"
              disabled={!generatedUUID && bulkUUIDs.length === 0}
            >
              <ClearIcon />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-3 border-b border-border/30 bg-muted/10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="uuid-type" className="whitespace-nowrap">
                UUID Type:
              </Label>
              <Select
                value={selectedVersion}
                onValueChange={(v) => setSelectedVersion(v as UUIDVersion)}
              >
                <SelectTrigger className="w-[340px]">
                  <SelectValue placeholder="Select UUID type" />
                </SelectTrigger>
                <SelectContent>
                  {UUID_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} – {type.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedType.needsInput && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="namespace">Namespace UUID:</Label>
                  <Input
                    id="namespace"
                    type="text"
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                    placeholder="6ba7b810-9dad-11d1-80b4-00c04fd430c8"
                    className="font-mono"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="name">Name:</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="example-name"
                  />
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button onClick={generateSingle}>Generate UUID</Button>
              <Button variant="secondary" onClick={() => setShowBulk(!showBulk)}>
                {showBulk ? 'Hide Bulk' : 'Bulk Generator'}
              </Button>
            </div>
            {showBulk && (
              <div className="flex items-center gap-4 pt-2 border-t border-border/30">
                <Label htmlFor="bulk-count" className="whitespace-nowrap">
                  Count:
                </Label>
                <Input
                  id="bulk-count"
                  type="number"
                  min={1}
                  max={1000}
                  value={bulkCount}
                  onChange={(e) => setBulkCount(Number(e.target.value))}
                  className="w-24"
                />
                <Button onClick={generateBulk}>Generate {bulkCount} UUIDs</Button>
              </div>
            )}
            {error && (
              <div className="mt-3 text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {generatedUUID && (
          <Card className="border-none rounded-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border/30">
              <span className="text-sm font-medium text-muted-foreground">
                Generated {selectedType.label}
              </span>
              <Button
                onClick={() => handleCopy(generatedUUID)}
                className="flex items-center gap-1.5"
                title="Copy UUID"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded border font-mono text-lg select-all">
                {generatedUUID}
              </div>
            </CardContent>
          </Card>
        )}
        {bulkUUIDs.length > 0 && (
          <Card className="flex-1 flex flex-col min-h-0 border-none rounded-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border/30 bg-muted/10">
              <span className="text-sm font-medium text-muted-foreground">
                Bulk Generated UUIDs ({bulkUUIDs.length})
              </span>
              <Button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5"
                title="Copy all UUIDs"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                Copy All
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-4">
              <div className="space-y-2">
                {bulkUUIDs.map((uuid, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded border hover:bg-muted/70 transition-colors"
                  >
                    <span className="font-mono text-sm select-all">{uuid}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(uuid)}
                      title="Copy UUID"
                    >
                      <CopyIcon />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
