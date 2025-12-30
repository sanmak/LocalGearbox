/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON Studio - Comprehensive JSON Tool
 * Combines all JSON operations in a unified tabbed interface
 * Transformed to new design system with shadcn/ui components
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import jmespath from 'jmespath';
import {
  // Utilities
  formatJson,
  validateJson,
  fixJson,
  sortKeys,
  sortByField,
  extractFieldNames,
  hasSortableArrays,
  searchJson,
  findRelatedValues,
  inferJsonSchema,
  formatSchema,
  calculateStats,
  SAMPLE_JSON,
  // Types
  IndentOption,
  INDENT_OPTIONS,
  SortDirection,
  SearchResult,
  JsonStats,
} from '@/lib/json';
import {
  // Components
  JsonTreeView,
  useTreeExpansion,
  JsonStatsBar,
  JsonContentPreview,
  JsonShortcutsModal,
  JsonColumnView,
  JsonPathBar,
} from '@/components/json';
import { UrlLoaderModal } from '@/components/UrlLoaderModal';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Link2,
  Copy,
  Check,
  Trash2,
  FileText,
  CheckCircle,
  Wrench,
  ArrowUpDown,
  Search,
  FileJson,
  Code,
  TreePine,
  Columns,
  Download,
  HelpCircle,
  X,
  Maximize2,
  Minimize2,
  Play,
} from 'lucide-react';

// Tab definitions
type TabId = 'format' | 'validate' | 'fix' | 'sort' | 'query' | 'schema' | 'search';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const TABS: Tab[] = [
  {
    id: 'format',
    label: 'Format',
    icon: <Code className="h-4 w-4" />,
    description: 'Format & beautify JSON',
  },
  {
    id: 'validate',
    label: 'Validate',
    icon: <CheckCircle className="h-4 w-4" />,
    description: 'Check JSON validity',
  },
  {
    id: 'fix',
    label: 'Fix',
    icon: <Wrench className="h-4 w-4" />,
    description: 'Auto-fix common errors',
  },
  {
    id: 'sort',
    label: 'Sort',
    icon: <ArrowUpDown className="h-4 w-4" />,
    description: 'Sort keys or values',
  },
  {
    id: 'query',
    label: 'Query',
    icon: <Search className="h-4 w-4" />,
    description: 'JMESPath queries',
  },
  {
    id: 'schema',
    label: 'Schema',
    icon: <FileJson className="h-4 w-4" />,
    description: 'Generate JSON Schema',
  },
  {
    id: 'search',
    label: 'Search',
    icon: <Search className="h-4 w-4" />,
    description: 'Search & explore',
  },
];

type ViewMode = 'code' | 'tree' | 'column';

export default function JsonStudioPage(): React.ReactNode {
  // Core state
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('format');
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [indentOption, setIndentOption] = useState<IndentOption>('2');
  const [parsedJson, setParsedJson] = useState<unknown>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Tree view state
  const { expandedPaths, togglePath, expandAll, collapseAll } = useTreeExpansion();
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [selectedValue, setSelectedValue] = useState<unknown>(null);

  // Sort state
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [sortMode, setSortMode] = useState<'keys' | 'field'>('keys');
  const [sortField, setSortField] = useState('');
  const [availableFields, setAvailableFields] = useState<string[]>([]);

  // Query state
  const [jmesQuery, setJmesQuery] = useState('');
  const [queryResult, setQueryResult] = useState('');
  const [queryError, setQueryError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [relatedValues, setRelatedValues] = useState<{ path: string; value: unknown }[]>([]);

  // UI state
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Stats calculation
  const stats = useMemo<JsonStats | null>(() => {
    if (!parsedJson) return null;
    const s = calculateStats(parsedJson);
    s.size = input.length;
    return s;
  }, [parsedJson, input.length]);

  // Update available fields when input changes
  useEffect(() => {
    if (!input.trim()) {
      setAvailableFields([]);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      const fields = extractFieldNames(parsed);
      setAvailableFields(fields);
      if (fields.length > 0 && !sortField) {
        setSortField(fields[0]);
      }
    } catch {
      setAvailableFields([]);
    }
  }, [input, sortField]);

  // Auto-parse input
  useEffect(() => {
    if (!input.trim()) {
      setParsedJson(null);
      setOutput('');
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      try {
        const parsed = JSON.parse(input);
        setParsedJson(parsed);

        // Auto-process based on active tab
        switch (activeTab) {
          case 'format':
            setOutput(formatJson(parsed, indentOption));
            break;
          case 'validate':
            const result = validateJson(input);
            setOutput(result.valid ? '✅ Valid JSON' : '');
            if (!result.valid) setError(result.message);
            else setError(null);
            break;
          case 'fix':
            // For fix tab, we want to show original input even if it's invalid
            const fixResult = fixJson(input);
            if (fixResult.success && fixResult.fixed) {
              try {
                const fixedParsed = JSON.parse(fixResult.fixed);
                setOutput(formatJson(fixedParsed, indentOption));
                setError(null);
              } catch {
                setError('Could not fix JSON');
              }
            } else {
              setError('Could not automatically fix JSON');
            }
            break;
          case 'sort':
            let sorted;
            if (sortMode === 'keys') {
              sorted = sortKeys(parsed, sortDirection);
            } else if (sortMode === 'field' && sortField) {
              sorted = sortByField(parsed, sortField, sortDirection);
            } else {
              sorted = parsed;
            }
            setOutput(formatJson(sorted, indentOption));
            break;
          case 'schema':
            const schema = inferJsonSchema(parsed);
            setOutput(formatSchema(schema));
            break;
        }

        // Clear any previous error if we successfully parsed
        if (activeTab !== 'fix' && activeTab !== 'validate') {
          setError(null);
        }
      } catch (err) {
        setParsedJson(null);
        if (activeTab !== 'fix') {
          setError(err instanceof Error ? err.message : 'Invalid JSON');
        } else {
          // For fix tab, try to fix invalid JSON
          const fixResult = fixJson(input);
          if (fixResult.success && fixResult.fixed) {
            try {
              const fixedParsed = JSON.parse(fixResult.fixed);
              setOutput(formatJson(fixedParsed, indentOption));
              setParsedJson(fixedParsed);
              setError(null);
            } catch {
              setError('Could not fix JSON');
            }
          } else {
            setError('Could not automatically fix JSON');
          }
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [input, indentOption, activeTab, sortMode, sortDirection, sortField]);

  // Auto-query when query changes
  useEffect(() => {
    if (activeTab !== 'query' || !input.trim() || !jmesQuery.trim()) {
      if (activeTab === 'query') {
        setQueryResult('');
        setQueryError(null);
      }
      return;
    }

    const timer = setTimeout(() => {
      try {
        const parsed = JSON.parse(input);
        const result = jmespath.search(parsed, jmesQuery);
        setQueryResult(formatJson(result, indentOption));
        setQueryError(null);
      } catch (err) {
        setQueryError(err instanceof Error ? err.message : 'Query failed');
        setQueryResult('');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [input, jmesQuery, indentOption, activeTab]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim() || !parsedJson) {
      setSearchResults([]);
      return;
    }
    const results = searchJson(parsedJson, searchQuery);
    setSearchResults(results);
  }, [searchQuery, parsedJson]);

  // Tab-specific actions
  const handleSelectValue = useCallback(
    (path: string, value: unknown, key: string) => {
      setSelectedPath(path);
      setSelectedValue(value);
      // Find related values with same key
      if (parsedJson && key) {
        const related = findRelatedValues(parsedJson, key);
        setRelatedValues(related.filter((r) => r.path !== path));
      }
    },
    [parsedJson],
  );

  // Common actions
  const handleCopy = useCallback(async () => {
    const textToCopy = activeTab === 'query' ? queryResult : output;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }, [output, queryResult, activeTab]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    setQueryResult('');
    setQueryError(null);
    setSearchQuery('');
    setSearchResults([]);
    setParsedJson(null);
    inputRef.current?.focus();
  }, []);

  const loadSample = useCallback(() => {
    setInput(SAMPLE_JSON);
    setError(null);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInput(content);
      setError(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleDownload = useCallback(() => {
    const content = activeTab === 'query' ? queryResult : output;
    if (!content) return;
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `json-studio-output-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [output, queryResult, activeTab]);

  // Handle loading data from URL
  const handleUrlLoad = useCallback((data: string) => {
    setInput(data);
    setError(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleClear();
      } else if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts((s) => !s);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear]);

  // Render tab-specific options
  const renderTabOptions = (): React.ReactNode => {
    switch (activeTab) {
      case 'format':
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Indent:</span>
            <Select value={indentOption} onValueChange={(v) => setIndentOption(v as IndentOption)}>
              <SelectTrigger className="w-[100px] h-7 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'sort':
        return (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Sort by:</span>
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={sortMode === 'keys' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortMode('keys')}
                  className="h-7 px-3 text-xs rounded-none"
                >
                  Keys
                </Button>
                <Button
                  variant={sortMode === 'field' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortMode('field')}
                  disabled={!hasSortableArrays(parsedJson)}
                  className="h-7 px-3 text-xs rounded-none"
                >
                  Field
                </Button>
              </div>
            </div>
            {sortMode === 'field' && availableFields.length > 0 && (
              <Select value={sortField} onValueChange={setSortField}>
                <SelectTrigger className="w-[140px] h-7 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map((f) => (
                    <SelectItem key={f} value={f} className="text-xs">
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Order:</span>
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={sortDirection === 'asc' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortDirection('asc')}
                  className="h-7 px-3 text-xs rounded-none"
                >
                  A→Z
                </Button>
                <Button
                  variant={sortDirection === 'desc' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortDirection('desc')}
                  className="h-7 px-3 text-xs rounded-none"
                >
                  Z→A
                </Button>
              </div>
            </div>
          </div>
        );
      case 'query':
        return (
          <div className="flex-1 flex items-center gap-2 max-w-md">
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
              Query:
            </span>
            <Input
              type="text"
              value={jmesQuery}
              onChange={(e) => setJmesQuery(e.target.value)}
              placeholder="users[*].name"
              className="flex-1 h-7 text-xs font-mono"
            />
          </div>
        );
      case 'search':
        return (
          <div className="flex-1 flex items-center gap-2 max-w-md">
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
              Search:
            </span>
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search JSON..."
              className="flex-1 h-7 text-xs"
            />
            {searchResults.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {searchResults.length} results
              </Badge>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">JSON Studio</h1>
            <span className="text-sm text-muted-foreground">
              All-in-one JSON toolkit with instant processing
            </span>
          </div>
          {/* Action Icons */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              title="Upload JSON file"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUrlModal(true)}
              title="Load from URL"
            >
              <Link2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={loadSample} title="Load sample">
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShortcuts(true)}
              title="Keyboard shortcuts (⌘+/)"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!input}
              title="Clear (⌘+K)"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabId)}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="px-4 py-2 bg-muted/20 border-b">
          <TabsList className="h-auto p-0 bg-transparent">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary text-xs"
                title={tab.description}
              >
                {tab.icon}
                <span className="ml-2 hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Options Bar */}
        <div className="px-4 py-2 bg-muted/10 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">{renderTabOptions()}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Input Panel */}
            <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
              <div className="flex flex-col h-full">
                <div className="px-4 py-2 border-b bg-muted/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Input JSON</span>
                    {input.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {input.length} chars
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex-1 relative min-h-0">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="absolute inset-0 w-full h-full resize-none bg-background font-mono text-sm p-4 focus-visible:ring-0 border-0 rounded-none"
                    placeholder="Paste your JSON here..."
                    spellCheck={false}
                  />
                </div>
                {/* Stats Bar */}
                {stats && <JsonStatsBar data={parsedJson} rawSize={input.length} />}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Output Panel */}
            <ResizablePanel defaultSize={45} minSize={25} maxSize={60}>
              <div className="flex flex-col h-full">
                <div className="px-4 py-2 border-b bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        {activeTab === 'query'
                          ? 'Query Result'
                          : activeTab === 'schema'
                            ? 'JSON Schema'
                            : 'Output'}
                      </span>
                      {activeTab !== 'query' && activeTab !== 'search' && (
                        <div className="flex border rounded-md overflow-hidden">
                          <Button
                            variant={viewMode === 'code' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('code')}
                            className="h-7 w-7 p-0 rounded-none"
                            title="Code view"
                          >
                            <Code className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={viewMode === 'tree' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('tree')}
                            className="h-7 w-7 p-0 rounded-none"
                            title="Tree view"
                          >
                            <TreePine className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={viewMode === 'column' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('column')}
                            className="h-7 w-7 p-0 rounded-none"
                            title="Column view"
                          >
                            <Columns className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {(output || queryResult) && (
                        <Badge variant="secondary" className="text-xs">
                          {activeTab === 'query' ? queryResult.length : output.length} chars
                        </Badge>
                      )}
                      {(viewMode === 'tree' || viewMode === 'column') && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => expandAll(parsedJson)}
                            title="Expand all"
                            className="h-7"
                          >
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={collapseAll}
                            title="Collapse all"
                            className="h-7"
                          >
                            <Minimize2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDownload}
                        disabled={!(activeTab === 'query' ? queryResult : output)}
                        title="Download"
                        className="h-7"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={handleCopy}
                        disabled={!(activeTab === 'query' ? queryResult : output)}
                        size="sm"
                        className="h-7"
                        title={copied ? 'Copied!' : 'Copy to clipboard'}
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Output Content */}
                <div className="flex-1 relative min-h-0 overflow-hidden">
                  {error || queryError ? (
                    <div className="absolute inset-0 p-4 overflow-auto">
                      <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                        {error || queryError}
                      </div>
                    </div>
                  ) : activeTab === 'search' ? (
                    <div className="absolute inset-0 overflow-auto p-4">
                      {searchResults.length > 0 ? (
                        <div className="space-y-2">
                          {searchResults.map((result, idx) => (
                            <button
                              key={idx}
                              onClick={() =>
                                handleSelectValue(result.path, result.value, result.key)
                              }
                              className={`w-full text-left p-3 rounded border transition-colors ${
                                selectedPath === result.path
                                  ? 'bg-primary/10 border-primary'
                                  : 'bg-card border hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <Badge
                                  variant={
                                    result.matchType === 'key'
                                      ? 'default'
                                      : result.matchType === 'value'
                                        ? 'secondary'
                                        : 'outline'
                                  }
                                  className="text-[10px]"
                                >
                                  {result.matchType}
                                </Badge>
                                <span className="font-mono truncate">{result.path}</span>
                              </div>
                              <div className="font-mono text-sm truncate">
                                {typeof result.value === 'string'
                                  ? `"${result.value}"`
                                  : String(result.value)}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : searchQuery ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                          <Search className="h-12 w-12 mb-3 opacity-50" />
                          <p>No results found</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                          <Search className="h-12 w-12 mb-3 opacity-50" />
                          <p>Enter a search query above</p>
                        </div>
                      )}
                    </div>
                  ) : viewMode === 'column' && parsedJson ? (
                    <div className="absolute inset-0 overflow-hidden flex flex-col">
                      {selectedPath && (
                        <div className="border-b bg-muted/10 p-2 shrink-0">
                          <JsonPathBar
                            path={selectedPath}
                            onNavigate={(newPath) => {
                              if (newPath === '') {
                                setSelectedPath('');
                                setSelectedValue(null);
                              } else {
                                try {
                                  const value = jmespath.search(parsedJson, newPath);
                                  setSelectedPath(newPath);
                                  setSelectedValue(value);
                                } catch (error) {
                                  console.warn('Failed to navigate to path:', newPath, error);
                                }
                              }
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-h-0">
                        <JsonColumnView data={parsedJson} onSelect={handleSelectValue} />
                      </div>
                    </div>
                  ) : viewMode === 'tree' && parsedJson ? (
                    <div className="absolute inset-0 overflow-hidden flex flex-col">
                      {selectedPath && (
                        <div className="border-b bg-muted/10 p-2 shrink-0">
                          <JsonPathBar
                            path={selectedPath}
                            onNavigate={(newPath) => {
                              if (newPath === '') {
                                setSelectedPath('');
                                setSelectedValue(null);
                              } else {
                                try {
                                  const value = jmespath.search(parsedJson, newPath);
                                  setSelectedPath(newPath);
                                  setSelectedValue(value);
                                } catch (error) {
                                  console.warn('Failed to navigate to path:', newPath, error);
                                }
                              }
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-h-0 overflow-auto">
                        <JsonTreeView
                          data={parsedJson}
                          expandedPaths={expandedPaths}
                          onTogglePath={togglePath}
                          selectedPath={selectedPath}
                          onSelect={handleSelectValue}
                          showTypeBadges={true}
                          showCopyButtons={true}
                          enableKeyboardNav={true}
                        />
                      </div>
                    </div>
                  ) : (
                    <Textarea
                      value={activeTab === 'query' ? queryResult : output}
                      readOnly
                      className="absolute inset-0 w-full h-full resize-none bg-background font-mono text-sm p-4 focus-visible:ring-0 border-0 rounded-none"
                      placeholder={
                        activeTab === 'query'
                          ? 'Query result will appear here...'
                          : 'Output will appear here...'
                      }
                    />
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Preview Panel */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
              <div className="flex flex-col h-full bg-muted/10">
                <div className="px-4 py-2 border-b bg-muted/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Preview</span>
                    {selectedPath && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPath('');
                          setSelectedValue(null);
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-3">
                  {selectedValue !== null ? (
                    <>
                      <JsonContentPreview
                        value={selectedValue}
                        path={selectedPath}
                        onFindRelated={(key) => {
                          if (parsedJson) {
                            const related = findRelatedValues(parsedJson, key);
                            setRelatedValues(related);
                          }
                        }}
                      />
                      {relatedValues.length > 1 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-xs font-medium text-muted-foreground mb-2">
                            Related Values ({relatedValues.length})
                          </h4>
                          <div className="space-y-1 max-h-48 overflow-auto">
                            {relatedValues.slice(0, 20).map((rv, idx) => (
                              <button
                                key={idx}
                                onClick={() =>
                                  handleSelectValue(
                                    rv.path,
                                    rv.value,
                                    rv.path.split('.').pop() || '',
                                  )
                                }
                                className={`w-full text-left p-2 text-xs rounded transition-colors ${
                                  selectedPath === rv.path
                                    ? 'bg-primary/20 ring-1 ring-primary'
                                    : 'hover:bg-muted'
                                }`}
                              >
                                <div className="text-muted-foreground font-mono truncate">
                                  {rv.path}
                                </div>
                                <div className="truncate">
                                  {typeof rv.value === 'string'
                                    ? rv.value
                                    : JSON.stringify(rv.value)}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : parsedJson ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm text-center">
                      <TreePine className="h-12 w-12 mb-3 opacity-50" />
                      <p className="mb-2">Select a value to preview</p>
                      <p className="text-xs">Click on any item in the Tree or Column view</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                      <FileJson className="h-12 w-12 mb-3 opacity-50" />
                      <p>Paste JSON to get started</p>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </Tabs>

      {/* Shortcuts Modal */}
      <JsonShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={[
          {
            title: 'Actions',
            icon: <Play className="h-4 w-4" />,
            shortcuts: [
              { key: '⌘+Enter', description: 'Run current action' },
              { key: '⌘+K', description: 'Clear all' },
              { key: '⌘+Shift+C', description: 'Copy output' },
            ],
          },
          {
            title: 'Navigation',
            icon: <Search className="h-4 w-4" />,
            shortcuts: [
              { key: '⌘+/', description: 'Toggle shortcuts' },
              { key: 'Tab', description: 'Switch tabs' },
            ],
          },
        ]}
      />

      {/* URL Loader Modal */}
      <UrlLoaderModal
        isOpen={showUrlModal}
        onClose={() => setShowUrlModal(false)}
        onLoad={handleUrlLoad}
        title="Load JSON from URL"
        acceptContentTypes={['application/json', 'text/plain', 'text/']}
      />
    </div>
  );
}
