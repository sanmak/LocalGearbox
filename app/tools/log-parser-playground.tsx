/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { processLogParser, getLogFormats } from '@/lib/tools';

import { UrlLoaderModal } from '@/components/UrlLoaderModal';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Loader2,
  Upload,
  Link2,
  Trash2,
  Plus,
  Download,
  FileText,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

const SAMPLE_LOGS = {
  nginx: `192.168.1.100 - - [10/Dec/2023:10:15:32 +0000] "GET /api/users HTTP/1.1" 200 1024 "-" "Mozilla/5.0"
192.168.1.101 - - [10/Dec/2023:10:15:33 +0000] "POST /api/users HTTP/1.1" 201 256 "-" "curl/7.68.0"
192.168.1.102 - - [10/Dec/2023:10:15:34 +0000] "GET /api/users/123 HTTP/1.1" 404 128 "-" "PostmanRuntime/7.29.2"
192.168.1.103 - - [10/Dec/2023:10:15:35 +0000] "GET /api/users HTTP/1.1" 500 64 "-" "Mozilla/5.0"
192.168.1.104 - - [10/Dec/2023:10:16:00 +0000] "GET /api/users HTTP/1.1" 503 32 "-" "Mozilla/5.0"
192.168.1.105 - - [10/Dec/2023:10:16:05 +0000] "GET /api/users HTTP/1.1" 200 1024 "-" "Mozilla/5.0"
192.168.1.106 - - [10/Dec/2023:10:16:10 +0000] "GET /api/users HTTP/1.1" 200 1024 "-" "Mozilla/5.0"
192.168.1.107 - - [10/Dec/2023:10:16:15 +0000] "GET /api/users HTTP/1.1" 502 128 "-" "Mozilla/5.0"
192.168.1.108 - - [10/Dec/2023:10:16:20 +0000] "GET /api/users HTTP/1.1" 504 128 "-" "Mozilla/5.0"
192.168.1.109 - - [10/Dec/2023:10:16:25 +0000] "GET /api/users HTTP/1.1" 200 1024 "-" "Mozilla/5.0"`,
  apache: `192.168.1.100 - john [10/Dec/2023:10:15:32 +0000] "GET /api/users HTTP/1.1" 200 1024 "-" "Mozilla/5.0"
192.168.1.101 - alice [10/Dec/2023:10:15:33 +0000] "POST /api/users HTTP/1.1" 201 256 "-" "curl/7.68.0"
192.168.1.102 - bob [10/Dec/2023:10:15:34 +0000] "GET /api/users/123 HTTP/1.1" 404 128 "-" "PostmanRuntime/7.29.2"
192.168.1.103 - john [10/Dec/2023:10:15:35 +0000] "GET /api/users HTTP/1.1" 500 64 "-" "Mozilla/5.0"
192.168.1.104 - alice [10/Dec/2023:10:16:00 +0000] "GET /api/users HTTP/1.1" 503 32 "-" "Mozilla/5.0"`,
  json: `{"timestamp":"2023-12-10T10:15:32Z","level":"INFO","message":"User login successful","service":"auth","request_id":"req-123","user_id":"user-456","duration":150,"status":200}
{"timestamp":"2023-12-10T10:15:33Z","level":"INFO","message":"User created","service":"auth","request_id":"req-124","user_id":"user-457","duration":200,"status":201}
{"timestamp":"2023-12-10T10:15:34Z","level":"ERROR","message":"User not found","service":"auth","request_id":"req-125","user_id":"user-999","duration":50,"status":404}
{"timestamp":"2023-12-10T10:15:35Z","level":"WARN","message":"Rate limit exceeded","service":"api","request_id":"req-126","user_id":"user-456","duration":10,"status":429}`,
  syslog: `<30>Dec 10 10:15:32 web-server User login: user123 from 192.168.1.100
<30>Dec 10 10:15:33 web-server User created: user124
<27>Dec 10 10:15:34 web-server ERROR: User not found: user999
<28>Dec 10 10:15:35 web-server WARN: Rate limit exceeded for user123
<30>Dec 10 10:16:00 web-server User login: user124 from 192.168.1.101`,
  custom: `INFO 2023-12-10T10:15:32Z User login successful user123
INFO 2023-12-10T10:15:33Z User created user124
ERROR 2023-12-10T10:15:34Z User not found user999
WARN 2023-12-10T10:15:35Z Rate limit exceeded user123
INFO 2023-12-10T10:16:00Z User login successful user124`,
};

type TabType = 'overview' | 'entries' | 'stats' | 'anomalies' | 'timeline';

export default function LogParserPlaygroundPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Array<{ field: string; operator: string; value: string }>>(
    [],
  );
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [logFormat, setLogFormat] = useState('nginx');
  const [customPattern, setCustomPattern] = useState('');
  const [customFields, setCustomFields] = useState('');
  const [anomalyDetection, setAnomalyDetection] = useState(true);
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [timeWindow] = useState(5);
  const [minSamples] = useState(10);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [maxLines, setMaxLines] = useState(1000);
  const [search, setSearch] = useState('');
  const [anomalySearch, setAnomalySearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const processLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const config: any = {
        format: logFormat,
        maxLines,
        filters,
        anomalyDetection,
        sensitivity,
        timeWindow,
        minSamples,
      };

      if (logFormat === 'custom') {
        config.customPattern = customPattern;
        config.fields = customFields
          .split(',')
          .map((f: string) => f.trim())
          .filter(Boolean);
      }

      const payload = {
        logs: input,
        config,
      };

      const result = await processLogParser(JSON.stringify(payload));
      setOutput(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      setError(errorMessage);
      setOutput('');
    } finally {
      setLoading(false);
    }
  }, [
    input,
    logFormat,
    customPattern,
    customFields,
    filters,
    maxLines,
    anomalyDetection,
    sensitivity,
    timeWindow,
    minSamples,
  ]);

  useEffect(() => {
    getLogFormats().then(() => {
      // Formats loaded
    });
  }, []);

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      await processLogs();
    }, 500);

    return () => clearTimeout(timer);
  }, [
    input,
    logFormat,
    customPattern,
    customFields,
    filters,
    maxLines,
    anomalyDetection,
    sensitivity,
    timeWindow,
    minSamples,
    processLogs,
  ]);

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

  const handleSampleLoad = useCallback((format: string) => {
    setLogFormat(format);
    setInput(SAMPLE_LOGS[format as keyof typeof SAMPLE_LOGS] || '');
  }, []);

  const handleUrlLoad = useCallback(() => {
    setShowUrlModal(true);
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    setFilters([]);
    setSearch('');
  }, []);

  const addFilter = useCallback(() => {
    setFilters([...filters, { field: '', operator: 'equals', value: '' }]);
  }, [filters]);

  const updateFilter = useCallback(
    (index: number, field: string, value: any) => {
      const newFilters = [...filters];
      newFilters[index] = { ...newFilters[index], [field]: value };
      setFilters(newFilters);
    },
    [filters],
  );

  const removeFilter = useCallback(
    (index: number) => {
      setFilters(filters.filter((_, i) => i !== index));
    },
    [filters],
  );

  const parsedOutput = useMemo(() => {
    try {
      return JSON.parse(output);
    } catch {
      return null;
    }
  }, [output]);

  const filteredEntries = useMemo(() => {
    if (!parsedOutput?.entries || !Array.isArray(parsedOutput.entries)) return [];
    if (!search.trim()) return parsedOutput.entries;
    const q = search.trim().toLowerCase();
    return parsedOutput.entries.filter((entry: any) =>
      Object.values(entry)
        .filter((v) => typeof v === 'string' || typeof v === 'number')
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [parsedOutput, search]);

  const dashboardMetrics = useMemo(() => {
    if (!parsedOutput) return null;

    const summary = parsedOutput.summary || {};
    const entries = parsedOutput.entries || [];
    const anomalies = parsedOutput.anomalies || [];

    const errorCount = entries.filter((e: any) => {
      const status = e.status || e.statusCode || '';
      return String(status).startsWith('5') || String(status).startsWith('4');
    }).length;

    const successRate = entries.length ? ((entries.length - errorCount) / entries.length) * 100 : 0;

    return {
      totalLines: summary.totalLines || 0,
      parsedLines: summary.parsedLines || entries.length || 0,
      failedLines: summary.failedLines || 0,
      anomaliesDetected: anomalies.length,
      errorCount,
      successRate: successRate.toFixed(1),
      uniqueIPs: new Set(entries.map((e: any) => e.ip || e.clientIp).filter(Boolean)).size,
      timeRange: summary.timeRange || 'N/A',
    };
  }, [parsedOutput]);

  const statusDistribution = useMemo(() => {
    if (!parsedOutput?.entries) return {};
    const dist: Record<string, number> = {};
    parsedOutput.entries.forEach((e: any) => {
      const status = String(e.status || e.statusCode || 'unknown');
      dist[status] = (dist[status] || 0) + 1;
    });
    return dist;
  }, [parsedOutput]);

  const filteredAnomalies = useMemo(() => {
    if (!parsedOutput?.anomalies || !Array.isArray(parsedOutput.anomalies)) return [];
    if (!anomalySearch.trim()) return parsedOutput.anomalies;
    const q = anomalySearch.trim().toLowerCase();
    return parsedOutput.anomalies.filter((anomaly: any) =>
      Object.values(anomaly)
        .filter((v) => typeof v === 'string' || typeof v === 'number')
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [parsedOutput, anomalySearch]);

  const exportComprehensiveCsv = useCallback(() => {
    if (!parsedOutput) return;

    const escape = (v: any) => {
      if (v === null || v === undefined) return '';
      let s = typeof v === 'object' ? JSON.stringify(v) : String(v);
      s = s.replace(/"/g, '""');
      return `"${s}"`;
    };

    const sections: string[] = [];

    // Section 1: Overview
    sections.push('=== OVERVIEW ===');
    const overviewData: Array<[string, string | number]> = [
      ['Metric', 'Value'],
      ['Total Lines', dashboardMetrics?.totalLines || 0],
      ['Parsed Lines', dashboardMetrics?.parsedLines || 0],
      ['Failed Lines', dashboardMetrics?.failedLines || 0],
      ['Success Rate', `${dashboardMetrics?.successRate || 0}%`],
      ['Error Count', dashboardMetrics?.errorCount || 0],
      ['Anomalies Detected', dashboardMetrics?.anomaliesDetected || 0],
      ['Unique IPs', dashboardMetrics?.uniqueIPs || 0],
      ['Time Range', dashboardMetrics?.timeRange || 'N/A'],
    ];
    sections.push(overviewData.map((row) => row.map((v) => escape(v)).join(',')).join('\n'));
    sections.push('');
    sections.push('');

    // Section 2: Status Distribution
    if (Object.keys(statusDistribution).length > 0) {
      sections.push('=== STATUS CODE DISTRIBUTION ===');
      const statusData: Array<[string, string | number]> = [['Status Code', 'Count']];
      Object.entries(statusDistribution)
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
          statusData.push([status, count]);
        });
      sections.push(statusData.map((row) => row.map((v) => escape(v)).join(',')).join('\n'));
      sections.push('');
      sections.push('');
    }

    // Section 3: Entries
    if (parsedOutput.entries && parsedOutput.entries.length > 0) {
      sections.push('=== LOG ENTRIES ===');
      const entries = parsedOutput.entries as any[];
      const headers = Object.keys(entries[0] || {}).filter((k) => !k.startsWith('_'));
      const entryRows = [headers.map((h) => `"${h}"`).join(',')];
      for (const e of entries) {
        const row = headers.map((h) => escape(e[h]));
        entryRows.push(row.join(','));
      }
      sections.push(entryRows.join('\n'));
      sections.push('');
      sections.push('');
    }

    // Section 4: Anomalies
    if (parsedOutput.anomalies && parsedOutput.anomalies.length > 0) {
      sections.push('=== ANOMALIES ===');
      const anomalyRows = [
        ['#', 'Type', 'Severity', 'Field', 'Value', 'Expected', 'Description']
          .map((h) => `"${h}"`)
          .join(','),
      ];
      parsedOutput.anomalies.forEach((anomaly: any, idx: number) => {
        const row = [
          String(idx + 1),
          anomaly.type || 'Unknown',
          anomaly.severity || 'medium',
          anomaly.field || '-',
          String(anomaly.value || '-'),
          String(anomaly.expected || '-'),
          anomaly.description || anomaly.message || JSON.stringify(anomaly),
        ];
        anomalyRows.push(row.map(escape).join(','));
      });
      sections.push(anomalyRows.join('\n'));
      sections.push('');
      sections.push('');
    }

    // Section 5: Timeline/Time Analysis
    if (parsedOutput.timeAnalysis) {
      sections.push('=== TIME ANALYSIS ===');
      const timeData: Array<[string, string]> = [['Metric', 'Value']];
      Object.entries(parsedOutput.timeAnalysis).forEach(([key, value]) => {
        timeData.push([key, typeof value === 'object' ? JSON.stringify(value) : String(value)]);
      });
      sections.push(timeData.map((row) => row.map((v) => escape(v)).join(',')).join('\n'));
    }

    const csv = sections.join('\n');
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(
      d.getDate(),
    )}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const filename = `log-analysis-${ts}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [parsedOutput, dashboardMetrics, statusDistribution]);

  const getSeverityBadge = (severity: string) => {
    const s = (severity || 'medium').toLowerCase();
    if (s === 'critical' || s === 'high') {
      return 'destructive';
    } else if (s === 'medium' || s === 'warning') {
      return 'default';
    } else {
      return 'secondary';
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Log Parser & Analytics</h1>
            <span className="text-sm text-muted-foreground">
              Enterprise-grade log analysis with real-time insights
            </span>
          </div>
          <div className="flex items-center gap-2">
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Analyzing...</span>
              </div>
            )}
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear All
            </Button>
          </div>
        </div>
      </div>

      {/* Options Bar */}
      <div className="px-4 py-2 bg-muted/20 border-b">
        <div className="flex items-center gap-6">
          {/* Log Format */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Format:</span>
            <Select value={logFormat} onValueChange={setLogFormat}>
              <SelectTrigger className="w-[120px] h-7 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nginx" className="text-xs">
                  NGINX
                </SelectItem>
                <SelectItem value="apache" className="text-xs">
                  Apache
                </SelectItem>
                <SelectItem value="json" className="text-xs">
                  JSON
                </SelectItem>
                <SelectItem value="syslog" className="text-xs">
                  Syslog
                </SelectItem>
                <SelectItem value="custom" className="text-xs">
                  Custom
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sample Data */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Sample:</span>
            {Object.keys(SAMPLE_LOGS).map((key) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={() => handleSampleLoad(key)}
                className="h-7 text-xs"
              >
                {key.toUpperCase()}
              </Button>
            ))}
          </div>

          {/* Load Data */}
          <div className="flex items-center gap-2 ml-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept=".log,.txt,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              title="Upload file"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <Button variant="ghost" size="sm" onClick={handleUrlLoad} title="Load from URL">
              <Link2 className="h-4 w-4 mr-2" />
              From URL
            </Button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Anomaly Detection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Anomaly Detection</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={anomalyDetection}
                      onCheckedChange={(checked) => setAnomalyDetection(!!checked)}
                    />
                    <span className="text-sm">Enable</span>
                  </div>
                  {anomalyDetection && (
                    <Select
                      value={sensitivity}
                      onValueChange={(v) => setSensitivity(v as 'low' | 'medium' | 'high')}
                    >
                      <SelectTrigger className="w-[140px] h-7 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low" className="text-xs">
                          Low Sensitivity
                        </SelectItem>
                        <SelectItem value="medium" className="text-xs">
                          Medium
                        </SelectItem>
                        <SelectItem value="high" className="text-xs">
                          High Sensitivity
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Max Lines */}
              <div className="space-y-2">
                <Label htmlFor="max-lines" className="text-xs font-medium">
                  Max Lines
                </Label>
                <Input
                  id="max-lines"
                  type="number"
                  value={maxLines}
                  onChange={(e) => setMaxLines(Number(e.target.value))}
                  min="10"
                  max="100000"
                  className="h-7 text-xs w-32"
                />
              </div>
            </div>

            {/* Custom Pattern */}
            {logFormat === 'custom' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-pattern" className="text-xs font-medium">
                    Regex Pattern
                  </Label>
                  <Input
                    id="custom-pattern"
                    type="text"
                    value={customPattern}
                    onChange={(e) => setCustomPattern(e.target.value)}
                    placeholder="^(\S+) (\S+) (\S+)$"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-fields" className="text-xs font-medium">
                    Field Names
                  </Label>
                  <Input
                    id="custom-fields"
                    type="text"
                    value={customFields}
                    onChange={(e) => setCustomFields(e.target.value)}
                    placeholder="field1,field2,field3"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {/* Dynamic Filters */}
            {filters.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Active Filters ({filters.length})</Label>
                  <Button variant="outline" size="sm" onClick={addFilter} className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Filter
                  </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                  {filters.map((filter, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select
                        value={filter.field}
                        onValueChange={(v) => updateFilter(index, 'field', v)}
                      >
                        <SelectTrigger className="flex-1 h-7 text-xs bg-background">
                          <SelectValue placeholder="Field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {parsedOutput?.fieldStats &&
                            Object.keys(parsedOutput.fieldStats).map((field) => (
                              <SelectItem key={field} value={field} className="text-xs">
                                {field}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={filter.operator}
                        onValueChange={(v) => updateFilter(index, 'operator', v)}
                      >
                        <SelectTrigger className="w-24 h-7 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals" className="text-xs">
                            =
                          </SelectItem>
                          <SelectItem value="contains" className="text-xs">
                            contains
                          </SelectItem>
                          <SelectItem value="regex" className="text-xs">
                            regex
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        placeholder="value"
                        className="flex-1 h-7 text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFilter(index)}
                        className="h-7 w-7"
                        aria-label="Remove filter"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filters.length === 0 && (
              <Button variant="outline" size="sm" onClick={addFilter} className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Add Filter
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Input Panel */}
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="flex flex-col h-full">
            <div className="px-4 py-2 border-b bg-muted/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Log Input</span>
                <Badge variant="secondary" className="text-xs">
                  {input.split('\n').length} lines • {input.length.toLocaleString()} chars
                </Badge>
              </div>
            </div>
            <div className="flex-1 relative min-h-0">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your log data here, upload a file, or fetch from URL..."
                className="absolute inset-0 w-full h-full resize-none bg-background font-mono text-sm p-4 focus-visible:ring-0 border-0 rounded-none"
                spellCheck={false}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Output Panel */}
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="flex flex-col h-full">
            {/* Metrics Cards */}
            {dashboardMetrics && (
              <div className="grid grid-cols-4 gap-2 p-3 bg-muted/10 border-b">
                <div className="bg-card rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Total Lines</span>
                  </div>
                  <p className="text-xl font-bold">
                    {dashboardMetrics.totalLines.toLocaleString()}
                  </p>
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Success Rate</span>
                  </div>
                  <p className="text-xl font-bold">{dashboardMetrics.successRate}%</p>
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-xs text-muted-foreground">Anomalies</span>
                  </div>
                  <p className="text-xl font-bold">{dashboardMetrics.anomaliesDetected}</p>
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                    <span className="text-xs text-muted-foreground">Unique IPs</span>
                  </div>
                  <p className="text-xl font-bold">{dashboardMetrics.uniqueIPs}</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as TabType)}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="px-4 py-2 border-b bg-muted/10">
                <div className="flex items-center justify-between">
                  <TabsList className="h-auto p-0 bg-transparent">
                    <TabsTrigger
                      value="overview"
                      className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary text-xs"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="entries"
                      className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary text-xs"
                    >
                      Entries
                      {filteredEntries.length > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {filteredEntries.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="stats"
                      className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary text-xs"
                    >
                      Statistics
                    </TabsTrigger>
                    <TabsTrigger
                      value="anomalies"
                      className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary text-xs"
                    >
                      Anomalies
                      {parsedOutput?.anomalies?.length > 0 && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          {parsedOutput.anomalies.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="timeline"
                      className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary text-xs"
                    >
                      Timeline
                    </TabsTrigger>
                  </TabsList>
                  {parsedOutput && (
                    <Button onClick={exportComprehensiveCsv} size="sm" className="h-7">
                      <Download className="h-3 w-3 mr-1.5" />
                      Export CSV
                    </Button>
                  )}
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 min-h-0">
                {error ? (
                  <div className="flex items-center justify-center h-full p-6">
                    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm max-w-md text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-medium">Processing Error</p>
                      <p className="text-xs mt-1">{error}</p>
                    </div>
                  </div>
                ) : !parsedOutput ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                    <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
                    <p>No Data Available</p>
                    <p className="text-xs mt-1">Paste logs to begin analysis</p>
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <TabsContent value="overview" className="p-4 space-y-4 mt-0">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Status Distribution */}
                        <div className="bg-card rounded-lg p-4 border">
                          <h3 className="text-sm font-semibold mb-3">Status Code Distribution</h3>
                          <div className="space-y-2">
                            {Object.entries(statusDistribution)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 10)
                              .map(([status, count]) => {
                                const total = Object.values(statusDistribution).reduce(
                                  (a, b) => a + b,
                                  0,
                                );
                                const percentage = ((count / total) * 100).toFixed(1);
                                const isError = status.startsWith('4') || status.startsWith('5');
                                return (
                                  <div key={status} className="flex items-center gap-3">
                                    <Badge
                                      variant={isError ? 'destructive' : 'default'}
                                      className="text-xs font-mono"
                                    >
                                      {status}
                                    </Badge>
                                    <div className="flex-1">
                                      <div className="h-4 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className={`h-full ${
                                            isError ? 'bg-destructive' : 'bg-primary'
                                          }`}
                                          style={{ width: `${percentage}%` }}
                                        />
                                      </div>
                                    </div>
                                    <span className="text-sm font-semibold w-12 text-right">
                                      {count}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {/* Field Summary */}
                        <div className="bg-card rounded-lg p-4 border">
                          <h3 className="text-sm font-semibold mb-3">Field Summary</h3>
                          <div className="space-y-2">
                            {parsedOutput?.fieldStats &&
                              Object.entries(parsedOutput.fieldStats)
                                .slice(0, 8)
                                .map(([field, stats]: [string, any]) => (
                                  <div
                                    key={field}
                                    className="flex items-center justify-between text-sm"
                                  >
                                    <span className="font-medium">{field}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {stats.uniqueCount || stats.unique} unique
                                    </span>
                                  </div>
                                ))}
                          </div>
                        </div>
                      </div>

                      {/* Recent Anomalies */}
                      {parsedOutput?.anomalies && parsedOutput.anomalies.length > 0 && (
                        <div className="bg-card rounded-lg p-4 border">
                          <h3 className="text-sm font-semibold mb-3">Recent Anomalies</h3>
                          <div className="space-y-2">
                            {parsedOutput.anomalies.slice(0, 5).map((anomaly: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-start gap-3 p-2 bg-muted/50 rounded"
                              >
                                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">
                                    {anomaly.type || 'Anomaly Detected'}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {anomaly.description || JSON.stringify(anomaly)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="entries" className="p-4 mt-0">
                      <div className="mb-4">
                        <Input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search entries..."
                          className="max-w-md"
                        />
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted">
                              <tr>
                                {parsedOutput.entries[0] &&
                                  Object.keys(parsedOutput.entries[0])
                                    .filter((k) => !k.startsWith('_'))
                                    .map((key) => (
                                      <th
                                        key={key}
                                        className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider"
                                      >
                                        {key}
                                      </th>
                                    ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {filteredEntries.length > 0 ? (
                                filteredEntries.map((entry: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-muted/50">
                                    {Object.keys(parsedOutput.entries[0])
                                      .filter((k) => !k.startsWith('_'))
                                      .map((key) => (
                                        <td key={key} className="px-4 py-2 text-sm">
                                          {typeof entry[key] === 'object'
                                            ? JSON.stringify(entry[key])
                                            : String(entry[key] || '')}
                                        </td>
                                      ))}
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td
                                    colSpan={
                                      Object.keys(parsedOutput?.entries[0]).filter(
                                        (k) => !k.startsWith('_'),
                                      ).length
                                    }
                                    className="px-4 py-8 text-center text-muted-foreground"
                                  >
                                    No entries match your search
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="stats" className="p-4 mt-0">
                      {parsedOutput.fieldStats ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {Object.entries(parsedOutput.fieldStats).map(
                            ([field, stats]: [string, any]) => (
                              <div key={field} className="bg-card rounded-lg p-4 border">
                                <h4 className="text-sm font-semibold mb-2">{field}</h4>
                                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
                                  {JSON.stringify(stats, null, 2)}
                                </pre>
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No statistics available</p>
                      )}
                    </TabsContent>

                    <TabsContent value="anomalies" className="p-4 mt-0">
                      {parsedOutput.anomalies && parsedOutput.anomalies.length > 0 ? (
                        <>
                          <div className="mb-4">
                            <Input
                              type="text"
                              value={anomalySearch}
                              onChange={(e) => setAnomalySearch(e.target.value)}
                              placeholder="Search anomalies..."
                              className="max-w-md"
                            />
                          </div>
                          <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-muted">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase">
                                      #
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase">
                                      Severity
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase">
                                      Type
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase">
                                      Field
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase">
                                      Value
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase">
                                      Description
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {filteredAnomalies.length > 0 ? (
                                    filteredAnomalies.map((anomaly: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-muted/50">
                                        <td className="px-4 py-2 font-bold">
                                          {parsedOutput.anomalies.indexOf(anomaly) + 1}
                                        </td>
                                        <td className="px-4 py-2">
                                          <Badge
                                            variant={getSeverityBadge(anomaly.severity)}
                                            className="text-xs"
                                          >
                                            {(anomaly.severity || 'medium').toUpperCase()}
                                          </Badge>
                                        </td>
                                        <td className="px-4 py-2 font-medium">
                                          {anomaly.type || 'Unknown'}
                                        </td>
                                        <td className="px-4 py-2">{anomaly.field || '-'}</td>
                                        <td
                                          className="px-4 py-2 max-w-xs truncate"
                                          title={String(anomaly.value || '-')}
                                        >
                                          {String(anomaly.value || '-')}
                                        </td>
                                        <td className="px-4 py-2">
                                          {anomaly.description || anomaly.message || '-'}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                      >
                                        No anomalies match your search
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                          <CheckCircle2 className="h-12 w-12 mb-3 opacity-50 text-green-500" />
                          <p>No anomalies detected in your logs</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="timeline" className="p-4 mt-0">
                      {parsedOutput.timeAnalysis ? (
                        <div className="bg-card rounded-lg p-4 border">
                          <pre className="text-sm font-mono overflow-x-auto">
                            {JSON.stringify(parsedOutput.timeAnalysis, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No time analysis available</p>
                      )}
                    </TabsContent>
                  </ScrollArea>
                )}
              </div>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

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
