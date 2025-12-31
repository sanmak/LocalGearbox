/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * URL Loader Modal Component - Redesigned with New Design Language
 * A comprehensive modal for loading data from URLs with full REST support
 * Features:
 * - Simple GET requests
 * - Complex REST endpoints (GET, POST, PUT, PATCH, DELETE, etc.)
 * - Custom headers
 * - Query parameters
 * - Multiple authentication types (Basic, Bearer, API Key, Custom)
 * - Request body with multiple content types
 * - CURL command parsing
 * - Request/Response preview
 */

/**
 * Safely escapes a string for use in double-quoted strings
 * IMPORTANT: Escapes backslashes FIRST to prevent double-escaping
 */
const escapeDoubleQuoted = (str: string): string => {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
};

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  RequestConfig,
  ResponseData,
  Header,
  QueryParam,
  HttpMethod,
  ContentType,
  DEFAULT_REQUEST_CONFIG,
  HTTP_METHODS,
  CONTENT_TYPES,
  AUTH_TYPES,
} from '@/lib/url-loader/types';
import { parseCurl, toCurl, validateUrl } from '@/lib/url-loader/curl-parser';
import {
  executeRequest,
  formatSize,
  formatDuration,
  formatResponseBody,
} from '@/lib/url-loader/executor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Link2,
  Plus,
  Trash2,
  Copy,
  Terminal,
  Check,
  Sparkles,
  Wrench,
  Loader2,
  X,
} from 'lucide-react';
import { Label } from '@/components/ui/label';

/**
 * Fix common JSON body issues:
 * - Unquoted property names
 * - Single quotes instead of double quotes
 * - Trailing commas
 * - Missing quotes around string values
 */
function fixJsonBody(body: string): string {
  // First check if it's already valid JSON
  try {
    JSON.parse(body);
    return body;
  } catch {
    // Need to fix
  }

  let fixed = body;

  // Remove trailing commas before } or ]
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

  // Replace single quotes with double quotes for string values
  // Handle: 'value' -> "value"
  fixed = fixed.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, content) => {
    return `: "${escapeDoubleQuoted(content)}"`;
  });

  // Handle single-quoted property names: 'key': -> "key":
  fixed = fixed.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g, (_, content) => {
    return `"${escapeDoubleQuoted(content)}":`;
  });

  // Handle unquoted property names: key: -> "key":
  // Match word characters followed by colon, but not if already quoted
  fixed = fixed.replace(/(?<=[{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '"$1":');

  // Handle array values with single quotes
  fixed = fixed.replace(/\[\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, content) => {
    return `["${escapeDoubleQuoted(content)}"`;
  });
  fixed = fixed.replace(/,\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, content) => {
    return `, "${escapeDoubleQuoted(content)}"`;
  });

  // Try to parse the fixed version
  try {
    JSON.parse(fixed);
    return fixed;
  } catch {
    // Still not valid, try more aggressive fixes
  }

  // More aggressive: try to add quotes to unquoted string values
  // This is risky but can help in some cases
  fixed = fixed.replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*([,}\]])/g, ': "$1"$2');

  return fixed;
}

// Method colors matching API Client design
const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-green-500',
  POST: 'bg-yellow-500',
  PUT: 'bg-blue-500',
  PATCH: 'bg-purple-500',
  DELETE: 'bg-red-500',
  HEAD: 'bg-gray-500',
  OPTIONS: 'bg-gray-500',
};

interface UrlLoaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (data: string, contentType: string) => void;
  title?: string;
  acceptContentTypes?: string[];
}

export function UrlLoaderModal({
  isOpen,
  onClose,
  onLoad,
  title = 'Load from URL',
  acceptContentTypes,
}: UrlLoaderModalProps) {
  // Request configuration state
  const [config, setConfig] = useState<RequestConfig>({
    ...DEFAULT_REQUEST_CONFIG,
  });
  const [activeTab, setActiveTab] = useState<string>('simple');
  const [curlInput, setCurlInput] = useState('');
  const [curlError, setCurlError] = useState<string | null>(null);

  // Execution state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [showResponse, setShowResponse] = useState(false);

  // Simple mode toggle
  const [simpleMode, setSimpleMode] = useState(true);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfig({ ...DEFAULT_REQUEST_CONFIG });
      setActiveTab('simple');
      setCurlInput('');
      setCurlError(null);
      setLoading(false);
      setError(null);
      setResponse(null);
      setShowResponse(false);
      setSimpleMode(true);
    }
  }, [isOpen]);

  // Update CURL preview when config changes
  useEffect(() => {
    if (activeTab === 'curl' && config.url) {
      setCurlInput(toCurl(config));
    }
  }, [config, activeTab]);

  // Handlers
  const updateConfig = useCallback((updates: Partial<RequestConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleUrlChange = useCallback(
    (url: string) => {
      // Try to parse query params from URL
      try {
        const urlObj = new URL(url);
        const params: QueryParam[] = [];
        urlObj.searchParams.forEach((value, key) => {
          params.push({ key, value, enabled: true });
        });
        if (params.length > 0) {
          updateConfig({
            url: urlObj.origin + urlObj.pathname,
            queryParams: params,
          });
          return;
        }
      } catch {
        // Not a valid URL yet, just update the URL
      }
      updateConfig({ url });
    },
    [updateConfig],
  );

  const addHeader = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      headers: [...prev.headers, { key: '', value: '', enabled: true }],
    }));
  }, []);

  const updateHeader = useCallback((index: number, updates: Partial<Header>) => {
    setConfig((prev) => ({
      ...prev,
      headers: prev.headers.map((h, i) => (i === index ? { ...h, ...updates } : h)),
    }));
  }, []);

  const removeHeader = useCallback((index: number) => {
    setConfig((prev) => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index),
    }));
  }, []);

  const addQueryParam = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      queryParams: [...prev.queryParams, { key: '', value: '', enabled: true }],
    }));
  }, []);

  const updateQueryParam = useCallback((index: number, updates: Partial<QueryParam>) => {
    setConfig((prev) => ({
      ...prev,
      queryParams: prev.queryParams.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    }));
  }, []);

  const removeQueryParam = useCallback((index: number) => {
    setConfig((prev) => ({
      ...prev,
      queryParams: prev.queryParams.filter((_, i) => i !== index),
    }));
  }, []);

  const handleParseCurl = useCallback(() => {
    if (!curlInput.trim()) {
      setCurlError('Please enter a cURL command');
      return;
    }

    try {
      const parsed = parseCurl(curlInput);
      if (!parsed.url) {
        setCurlError('Could not find URL in cURL command');
        return;
      }
      setConfig(parsed);
      setCurlError(null);
      setActiveTab('params');
      setSimpleMode(false);
    } catch (err) {
      setCurlError(err instanceof Error ? err.message : 'Failed to parse cURL command');
    }
  }, [curlInput]);

  const handleExecute = useCallback(async () => {
    // Validate URL
    const validation = validateUrl(config.url);
    if (!validation.valid) {
      setError(validation.error || 'Invalid URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await executeRequest(config);
      setResponse(res);
      setShowResponse(true);

      // Check content type if filtering is enabled
      if (acceptContentTypes && acceptContentTypes.length > 0) {
        const isAccepted = acceptContentTypes.some((ct) =>
          res.contentType.toLowerCase().includes(ct.toLowerCase()),
        );
        if (!isAccepted && res.status >= 200 && res.status < 300) {
          setError(
            `Response content type "${
              res.contentType
            }" is not accepted. Expected: ${acceptContentTypes.join(', ')}`,
          );
          return;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [config, acceptContentTypes]);

  const handleLoadResponse = useCallback(() => {
    if (response && response.status >= 200 && response.status < 300) {
      onLoad(response.body, response.contentType);
      onClose();
    }
  }, [response, onLoad, onClose]);

  const handleCopyCurl = useCallback(() => {
    const curl = toCurl(config);
    navigator.clipboard.writeText(curl);
  }, [config]);

  // Beautify request body based on content type
  const handleBeautifyBody = useCallback(() => {
    if (!config.body.trim()) return;

    let beautified = config.body;
    const contentType =
      config.contentType === 'custom' ? config.customContentType || '' : config.contentType;

    if (contentType.includes('json')) {
      try {
        // First try to parse and format
        const parsed = JSON.parse(config.body);
        beautified = JSON.stringify(parsed, null, 2);
      } catch {
        // If parsing fails, try to fix common issues first
        beautified = fixJsonBody(config.body);
        try {
          const parsed = JSON.parse(beautified);
          beautified = JSON.stringify(parsed, null, 2);
        } catch {
          // Still can't parse, return the fixed version
        }
      }
    } else if (contentType.includes('xml')) {
      // Simple XML formatting
      beautified = config.body
        .replace(/></g, '>\n<')
        .replace(/^\s+|\s+$/gm, '')
        .split('\n')
        .map((line, i, arr) => {
          const indent =
            (line.match(/^<\//) ? -1 : 0) +
            (arr.slice(0, i).filter((l) => l.match(/^<[^/!?]/) && !l.match(/\/>$/)).length -
              arr.slice(0, i).filter((l) => l.match(/^<\//)).length);
          return '  '.repeat(Math.max(0, indent)) + line;
        })
        .join('\n');
    }

    updateConfig({ body: beautified });
  }, [config.body, config.contentType, config.customContentType, updateConfig]);

  // Fix and beautify JSON body (handles unquoted keys, single quotes, trailing commas)
  const handleFixBody = useCallback(() => {
    if (!config.body.trim()) return;

    const contentType =
      config.contentType === 'custom' ? config.customContentType || '' : config.contentType;

    if (contentType.includes('json')) {
      const fixed = fixJsonBody(config.body);
      try {
        const parsed = JSON.parse(fixed);
        updateConfig({ body: JSON.stringify(parsed, null, 2) });
      } catch {
        updateConfig({ body: fixed });
      }
    }
  }, [config.body, config.contentType, config.customContentType, updateConfig]);

  // Generate full URL with query params for display
  const fullUrl = useMemo(() => {
    if (!config.url) return '';
    const enabledParams = config.queryParams.filter((p) => p.enabled && p.key);
    if (enabledParams.length === 0) return config.url;
    const params = new URLSearchParams();
    enabledParams.forEach((p) => params.append(p.key, p.value));
    return config.url + (config.url.includes('?') ? '&' : '?') + params.toString();
  }, [config.url, config.queryParams]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              <DialogTitle>{title}</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={simpleMode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSimpleMode(true)}
                className="h-8"
              >
                Simple
              </Button>
              <Button
                variant={!simpleMode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSimpleMode(false)}
                className="h-8"
              >
                Advanced
              </Button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Load data from a URL with optional authentication and custom headers
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1">
          {simpleMode ? (
            /* Simple Mode */
            <div className="p-6 space-y-6">
              {/* URL Input */}
              <div className="space-y-2">
                <Label>URL</Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={config.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !loading) {
                        handleExecute();
                      }
                    }}
                    placeholder="https://api.example.com/data.json"
                    className="flex-1 font-mono"
                    autoFocus
                  />
                  <Button
                    onClick={handleExecute}
                    disabled={loading || !config.url.trim()}
                    className="shrink-0"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Loading...' : 'Fetch'}
                  </Button>
                </div>
              </div>

              {/* Quick CURL Import */}
              <div className="space-y-2">
                <Label>Or paste a cURL command</Label>
                <Textarea
                  value={curlInput}
                  onChange={(e) => setCurlInput(e.target.value)}
                  placeholder={`curl -X POST 'https://api.example.com/data' \\
  -H 'Content-Type: application/json' \\
  -d '{"key": "value"}'`}
                  className="font-mono"
                  rows={4}
                />
                <Button
                  variant="outline"
                  onClick={handleParseCurl}
                  disabled={!curlInput.trim()}
                  size="sm"
                >
                  <Terminal className="h-4 w-4 mr-2" />
                  Import cURL
                </Button>
                {curlError && <p className="text-sm text-destructive">{curlError}</p>}
              </div>

              <p className="text-sm text-muted-foreground">
                For complex requests with headers, authentication, or custom methods, switch to{' '}
                <Button
                  variant="link"
                  onClick={() => setSimpleMode(false)}
                  className="h-auto p-0 text-sm"
                >
                  Advanced mode
                </Button>
              </p>
            </div>
          ) : (
            /* Advanced Mode */
            <div className="flex flex-col h-full">
              {/* URL Bar */}
              <div className="p-6 border-b">
                <div className="flex gap-2">
                  {/* Method Selector */}
                  <div className="relative w-32">
                    <Select
                      value={config.method}
                      onValueChange={(v) => updateConfig({ method: v as HttpMethod })}
                    >
                      <SelectTrigger
                        className={`${METHOD_COLORS[config.method]} text-white border-0 font-semibold h-10`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HTTP_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            <span className="font-semibold">{method}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* URL Input */}
                  <Input
                    type="url"
                    value={config.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !loading) {
                        handleExecute();
                      }
                    }}
                    placeholder="Enter request URL"
                    className="flex-1 font-mono"
                  />

                  {/* Send Button */}
                  <Button
                    onClick={handleExecute}
                    disabled={loading || !config.url.trim()}
                    className="shrink-0"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Send
                  </Button>
                </div>

                {/* Full URL Preview */}
                {fullUrl && fullUrl !== config.url && (
                  <p className="mt-2 text-xs text-muted-foreground font-mono truncate">{fullUrl}</p>
                )}
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b h-auto p-0 bg-transparent px-6">
                  <TabsTrigger
                    value="params"
                    className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
                  >
                    Params
                    {config.queryParams.filter((p) => p.enabled).length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {config.queryParams.filter((p) => p.enabled).length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="headers"
                    className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
                  >
                    Headers
                    {config.headers.filter((h) => h.enabled).length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {config.headers.filter((h) => h.enabled).length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="body"
                    className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
                  >
                    Body
                  </TabsTrigger>
                  <TabsTrigger
                    value="auth"
                    className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
                  >
                    Auth
                  </TabsTrigger>
                  <TabsTrigger
                    value="curl"
                    className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
                  >
                    cURL
                  </TabsTrigger>
                </TabsList>

                {/* Query Params Tab */}
                <TabsContent value="params" className="flex-1 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Query Parameters</h4>
                    <Button variant="outline" size="sm" onClick={addQueryParam}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Parameter
                    </Button>
                  </div>
                  {config.queryParams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No query parameters added</p>
                  ) : (
                    <div className="space-y-2">
                      {config.queryParams.map((param, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Checkbox
                            checked={param.enabled}
                            onCheckedChange={(checked) =>
                              updateQueryParam(index, { enabled: !!checked })
                            }
                          />
                          <Input
                            type="text"
                            value={param.key}
                            onChange={(e) => updateQueryParam(index, { key: e.target.value })}
                            placeholder="Key"
                            className="flex-1"
                          />
                          <Input
                            type="text"
                            value={param.value}
                            onChange={(e) => updateQueryParam(index, { value: e.target.value })}
                            placeholder="Value"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQueryParam(index)}
                            aria-label="Remove query parameter"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Headers Tab */}
                <TabsContent value="headers" className="flex-1 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Request Headers</h4>
                    <Button variant="outline" size="sm" onClick={addHeader}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Header
                    </Button>
                  </div>
                  {config.headers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No custom headers added</p>
                  ) : (
                    <div className="space-y-2">
                      {config.headers.map((header, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Checkbox
                            checked={header.enabled}
                            onCheckedChange={(checked) =>
                              updateHeader(index, { enabled: !!checked })
                            }
                          />
                          <Input
                            type="text"
                            value={header.key}
                            onChange={(e) => updateHeader(index, { key: e.target.value })}
                            placeholder="Header name"
                            className="flex-1"
                          />
                          <Input
                            type="text"
                            value={header.value}
                            onChange={(e) => updateHeader(index, { value: e.target.value })}
                            placeholder="Value"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeHeader(index)}
                            aria-label="Remove header"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Body Tab */}
                <TabsContent value="body" className="flex-1 p-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <h4 className="text-sm font-medium">Request Body</h4>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground">Content-Type:</Label>
                        <Select
                          value={config.contentType}
                          onValueChange={(v) => updateConfig({ contentType: v as ContentType })}
                        >
                          <SelectTrigger className="w-[200px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTENT_TYPES.map((ct) => (
                              <SelectItem key={ct.value} value={ct.value} className="text-xs">
                                {ct.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {config.body && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBeautifyBody}
                          title="Beautify body (format JSON/XML)"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Beautify
                        </Button>
                        {(config.contentType === 'application/json' ||
                          config.contentType === 'custom') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleFixBody}
                            title="Fix JSON (quotes, trailing commas, etc.)"
                          >
                            <Wrench className="h-4 w-4 mr-2" />
                            Fix JSON
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {config.contentType === 'custom' && (
                    <Input
                      type="text"
                      value={config.customContentType || ''}
                      onChange={(e) => updateConfig({ customContentType: e.target.value })}
                      placeholder="Custom content type (e.g., application/vnd.api+json)"
                      className="text-sm"
                    />
                  )}
                  <Textarea
                    value={config.body}
                    onChange={(e) => updateConfig({ body: e.target.value })}
                    placeholder={
                      config.contentType === 'application/json'
                        ? '{\n  "key": "value"\n}'
                        : 'Enter request body...'
                    }
                    className="h-48 font-mono resize-none"
                  />
                  {config.method === 'GET' && config.body && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                      Note: GET requests typically don&apos;t have a body. Consider using POST or
                      another method.
                    </p>
                  )}
                </TabsContent>

                {/* Auth Tab */}
                <TabsContent value="auth" className="flex-1 p-6 space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Authentication Type</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {AUTH_TYPES.map((auth) => (
                        <button
                          key={auth.value}
                          onClick={() =>
                            updateConfig({ auth: { ...config.auth, type: auth.value } })
                          }
                          className={`p-3 rounded-lg border-2 text-left transition-colors ${
                            config.auth.type === auth.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-sm font-medium">{auth.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {auth.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auth Configuration */}
                  {config.auth.type === 'basic' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                          type="text"
                          value={config.auth.username || ''}
                          onChange={(e) =>
                            updateConfig({ auth: { ...config.auth, username: e.target.value } })
                          }
                          placeholder="Enter username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                          type="password"
                          value={config.auth.password || ''}
                          onChange={(e) =>
                            updateConfig({ auth: { ...config.auth, password: e.target.value } })
                          }
                          placeholder="Enter password"
                        />
                      </div>
                    </div>
                  )}

                  {config.auth.type === 'bearer' && (
                    <div className="space-y-2">
                      <Label>Token</Label>
                      <Input
                        type="text"
                        value={config.auth.token || ''}
                        onChange={(e) =>
                          updateConfig({ auth: { ...config.auth, token: e.target.value } })
                        }
                        placeholder="Enter bearer token (without 'Bearer ' prefix)"
                        className="font-mono"
                      />
                    </div>
                  )}

                  {config.auth.type === 'api-key' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Key Name</Label>
                          <Input
                            type="text"
                            value={config.auth.apiKeyName || ''}
                            onChange={(e) =>
                              updateConfig({ auth: { ...config.auth, apiKeyName: e.target.value } })
                            }
                            placeholder="e.g., X-API-Key"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Key Value</Label>
                          <Input
                            type="text"
                            value={config.auth.apiKeyValue || ''}
                            onChange={(e) =>
                              updateConfig({
                                auth: { ...config.auth, apiKeyValue: e.target.value },
                              })
                            }
                            placeholder="Your API key"
                            className="font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Add to</Label>
                        <div className="flex gap-2">
                          <Button
                            variant={
                              config.auth.apiKeyLocation === 'header' || !config.auth.apiKeyLocation
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() =>
                              updateConfig({ auth: { ...config.auth, apiKeyLocation: 'header' } })
                            }
                          >
                            Header
                          </Button>
                          <Button
                            variant={config.auth.apiKeyLocation === 'query' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() =>
                              updateConfig({ auth: { ...config.auth, apiKeyLocation: 'query' } })
                            }
                          >
                            Query Parameter
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {config.auth.type === 'custom' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Header Name</Label>
                        <Input
                          type="text"
                          value={config.auth.customHeaderName || ''}
                          onChange={(e) =>
                            updateConfig({
                              auth: { ...config.auth, customHeaderName: e.target.value },
                            })
                          }
                          placeholder="e.g., Authorization"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Header Value</Label>
                        <Input
                          type="text"
                          value={config.auth.customHeaderValue || ''}
                          onChange={(e) =>
                            updateConfig({
                              auth: { ...config.auth, customHeaderValue: e.target.value },
                            })
                          }
                          placeholder="Full header value"
                          className="font-mono"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* cURL Tab */}
                <TabsContent value="curl" className="flex-1 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">cURL Command</h4>
                    <Button variant="outline" size="sm" onClick={handleCopyCurl}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={curlInput}
                    onChange={(e) => setCurlInput(e.target.value)}
                    placeholder="Paste a cURL command here to import, or view the generated cURL for current request"
                    className="h-48 font-mono resize-none"
                  />
                  {curlError && <p className="text-sm text-destructive">{curlError}</p>}
                  <Button variant="outline" onClick={handleParseCurl} disabled={!curlInput.trim()}>
                    <Terminal className="h-4 w-4 mr-2" />
                    Import cURL
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mx-6 mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Response Preview */}
          {showResponse && response && (
            <div className="border-t">
              <div className="px-6 py-3 bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Response</span>
                  <Badge
                    variant={
                      response.status >= 200 && response.status < 300 ? 'default' : 'destructive'
                    }
                    className="font-mono"
                  >
                    {response.status} {response.statusText}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(response.duration)} • {formatSize(response.size)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowResponse(false)}
                  aria-label="Close response"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="p-6 max-h-48">
                <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                  {formatResponseBody(response.body, response.contentType).slice(0, 5000)}
                  {response.body.length > 5000 && (
                    <span className="text-muted-foreground">... (truncated)</span>
                  )}
                </pre>
              </ScrollArea>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-muted-foreground">
              {response && response.status >= 200 && response.status < 300
                ? "Response received. Click 'Use Response' to load the data."
                : 'Enter a URL or paste a cURL command to fetch data.'}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleLoadResponse}
                disabled={!response || response.status < 200 || response.status >= 300}
              >
                <Check className="h-4 w-4 mr-2" />
                Use Response
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UrlLoaderModal;
