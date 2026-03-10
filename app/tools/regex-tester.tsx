/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { testRegex } from '@/lib/tools';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Copy,
  Check,
  Trash2,
  Zap,
  AlertCircle,
  Hash,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface RegexMatch {
  fullMatch: string;
  index: number;
  length: number;
  groups: Record<string, string | undefined>;
  captureGroups: (string | undefined)[];
}

interface RegexTestResult {
  valid: boolean;
  pattern: string;
  flags: string;
  error?: string;
  matchCount: number;
  matches: RegexMatch[];
  executionTimeMs: number;
}

interface CommonPattern {
  name: string;
  pattern: string;
  flags: string;
  description: string;
  testSample: string;
}

interface FlagOption {
  flag: string;
  label: string;
  description: string;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const FLAG_OPTIONS: FlagOption[] = [
  { flag: 'g', label: 'Global', description: 'Find all matches' },
  { flag: 'i', label: 'Case Insensitive', description: 'Ignore case' },
  { flag: 'm', label: 'Multiline', description: '^ and $ match line boundaries' },
  { flag: 's', label: 'DotAll', description: '. matches newlines' },
  { flag: 'u', label: 'Unicode', description: 'Enable Unicode support' },
];

const COMMON_PATTERNS: CommonPattern[] = [
  {
    name: 'Email',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    flags: 'g',
    description: 'Match email addresses',
    testSample:
      'Contact us at support@example.com or sales@company.co.uk for more info. Invalid: user@, @domain.com',
  },
  {
    name: 'URL',
    pattern: 'https?://[\\w\\-]+(\\.[\\w\\-]+)+([\\w.,@?^=%&:/~+#\\-]*[\\w@?^=%&/~+#\\-])?',
    flags: 'g',
    description: 'Match HTTP/HTTPS URLs',
    testSample:
      'Visit https://www.example.com/page?q=1 or http://api.test.co.uk/v2/data for details.',
  },
  {
    name: 'IPv4 Address',
    pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b',
    flags: 'g',
    description: 'Match IPv4 addresses',
    testSample:
      'Server IPs: 192.168.1.1, 10.0.0.255, 255.255.255.0. Invalid: 999.999.999.999, 256.1.1.1',
  },
  {
    name: 'Phone (US)',
    pattern: '(?:\\+?1[\\s.-]?)?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}',
    flags: 'g',
    description: 'Match US phone numbers',
    testSample: 'Call us: (555) 123-4567, +1-800-555-0199, 555.867.5309, or 1 234 567 8901',
  },
  {
    name: 'Date (YYYY-MM-DD)',
    pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])',
    flags: 'g',
    description: 'Match ISO 8601 dates',
    testSample: 'Dates: 2024-01-15, 2023-12-31, 2025-06-30. Invalid: 2024-13-01, 2024-00-15',
  },
  {
    name: 'Hex Color',
    pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
    flags: 'g',
    description: 'Match hex color codes',
    testSample: 'Colors: #fff, #FF5733, #000000, #1a2b3c. Not a color: #xyz, #12',
  },
  {
    name: 'HTML Tag',
    pattern: '<(?<tag>[a-zA-Z][a-zA-Z0-9]*)(?<attrs>[^>]*)>(?<content>.*?)</\\k<tag>>',
    flags: 'gs',
    description: 'Match HTML tags with named groups',
    testSample: '<div class="main">Hello World</div> <p>Paragraph</p> <span id="x">Text</span>',
  },
  {
    name: 'UUID',
    pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
    flags: 'g',
    description: 'Match UUID v4 format',
    testSample: 'IDs: 550e8400-e29b-41d4-a716-446655440000, 6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  },
];

/* -------------------------------------------------------------------------- */
/*  Highlighted Text Component                                                */
/* -------------------------------------------------------------------------- */

interface HighlightedTextProps {
  text: string;
  matches: RegexMatch[];
}

const HIGHLIGHT_COLORS = [
  'bg-yellow-500/30 border-yellow-500/50',
  'bg-cyan-500/30 border-cyan-500/50',
  'bg-pink-500/30 border-pink-500/50',
  'bg-green-500/30 border-green-500/50',
  'bg-orange-500/30 border-orange-500/50',
  'bg-purple-500/30 border-purple-500/50',
];

function HighlightedText({ text, matches }: HighlightedTextProps) {
  if (matches.length === 0) {
    return <span className="text-text-primary whitespace-pre-wrap break-all">{text}</span>;
  }

  const segments: { text: string; isMatch: boolean; matchIndex: number }[] = [];
  let lastEnd = 0;

  const sortedMatches = [...matches].sort((a, b) => a.index - b.index);

  for (let i = 0; i < sortedMatches.length; i++) {
    const match = sortedMatches[i];
    if (match.index > lastEnd) {
      segments.push({
        text: text.slice(lastEnd, match.index),
        isMatch: false,
        matchIndex: -1,
      });
    }
    if (match.index >= lastEnd) {
      segments.push({
        text: text.slice(match.index, match.index + match.length),
        isMatch: true,
        matchIndex: i,
      });
      lastEnd = match.index + match.length;
    }
  }

  if (lastEnd < text.length) {
    segments.push({
      text: text.slice(lastEnd),
      isMatch: false,
      matchIndex: -1,
    });
  }

  return (
    <span className="whitespace-pre-wrap break-all">
      {segments.map((segment, idx) =>
        segment.isMatch ? (
          <mark
            key={idx}
            className={`${HIGHLIGHT_COLORS[segment.matchIndex % HIGHLIGHT_COLORS.length]} border-b-2 rounded-sm px-0.5 text-text-primary`}
            title={`Match ${segment.matchIndex + 1} at index ${sortedMatches[segment.matchIndex].index}`}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={idx} className="text-text-primary">
            {segment.text}
          </span>
        ),
      )}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<Set<string>>(new Set(['g']));
  const [testString, setTestString] = useState('');
  const [result, setResult] = useState<RegexTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

  const patternRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flagsString = useMemo(() => {
    const order = ['g', 'i', 'm', 's', 'u', 'v'];
    return order.filter((f) => flags.has(f)).join('');
  }, [flags]);

  /* ---- Process regex ---- */

  const processRegex = useCallback(async (p: string, f: string, t: string) => {
    if (!p && !t) {
      setResult(null);
      setError(null);
      return;
    }

    if (!p) {
      setResult(null);
      setError(null);
      return;
    }

    try {
      const input = JSON.stringify({ pattern: p, flags: f, testString: t });
      const raw = await testRegex(input);
      const parsed = JSON.parse(raw) as RegexTestResult;
      setResult(parsed);
      if (!parsed.valid && parsed.error) {
        setError(parsed.error);
      } else {
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setResult(null);
    }
  }, []);

  /* ---- Debounced auto-process ---- */

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      processRegex(pattern, flagsString, testString);
    }, 200);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [pattern, flagsString, testString, processRegex]);

  /* ---- Flag toggle ---- */

  const toggleFlag = useCallback((flag: string) => {
    setFlags((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(flag)) {
        next.delete(flag);
      } else {
        // u and v flags are mutually exclusive
        if (flag === 'u') next.delete('v');
        if (flag === 'v') next.delete('u');
        next.add(flag);
      }
      return next;
    });
  }, []);

  /* ---- Load preset ---- */

  const loadPreset = useCallback((preset: CommonPattern) => {
    setPattern(preset.pattern);
    const newFlags = new Set<string>();
    for (const ch of preset.flags) {
      newFlags.add(ch);
    }
    setFlags(newFlags);
    setTestString(preset.testSample);
    setShowPresets(false);
    setExpandedMatch(null);
  }, []);

  /* ---- Clear ---- */

  const handleClear = useCallback(() => {
    setPattern('');
    setFlags(new Set(['g']));
    setTestString('');
    setResult(null);
    setError(null);
    setExpandedMatch(null);
    patternRef.current?.focus();
  }, []);

  /* ---- Copy results ---- */

  const handleCopyResults = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }, [result]);

  /* ---- Keyboard shortcuts ---- */

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleClear();
      }
    },
    [handleClear],
  );

  /* ---- Matches for highlight ---- */

  const displayMatches = useMemo(() => {
    if (!result || !result.valid) return [];
    return result.matches;
  }, [result]);

  return (
    <div
      className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-text-primary">Regex Tester</h1>
            {result && result.valid && (
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-400 border-green-500/30"
              >
                {result.matchCount} {result.matchCount === 1 ? 'match' : 'matches'}
              </Badge>
            )}
            {error && (
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                Invalid
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors flex items-center gap-1.5"
              aria-label="Toggle common patterns panel"
              aria-expanded={showPresets}
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Patterns</span>
            </button>
            <button
              onClick={handleClear}
              disabled={!pattern && !testString}
              className="p-2 text-text-tertiary hover:text-red-500 hover:bg-red-500/10 rounded transition-colors disabled:opacity-30"
              title="Clear all (Cmd+K)"
              aria-label="Clear all fields"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          Test regular expressions with real-time match highlighting and capture group analysis
        </p>
      </div>

      {/* Common Patterns Dropdown */}
      {showPresets && (
        <div className="flex-shrink-0 border-b border-border bg-surface-secondary/30 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Common Patterns
            </span>
            <button
              onClick={() => setShowPresets(false)}
              className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
              aria-label="Close patterns panel"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {COMMON_PATTERNS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => loadPreset(preset)}
                className="text-left p-2 rounded border border-border/50 hover:border-accent/50 hover:bg-surface-secondary/50 transition-colors group"
                aria-label={`Load ${preset.name} pattern: ${preset.description}`}
              >
                <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                  {preset.name}
                </span>
                <span className="block text-xs text-text-tertiary mt-0.5 truncate">
                  {preset.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pattern & Flags Row */}
      <div className="flex-shrink-0 border-b border-border bg-surface px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Pattern Input */}
          <div className="flex-1">
            <Label htmlFor="regex-pattern" className="text-xs text-text-secondary mb-1.5 block">
              Pattern
            </Label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary font-mono text-sm select-none"
                aria-hidden="true"
              >
                /
              </span>
              <input
                ref={patternRef}
                id="regex-pattern"
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="w-full pl-6 pr-16 py-2 bg-surface-secondary border border-border rounded font-mono text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50"
                placeholder="Enter regex pattern..."
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                aria-label="Regular expression pattern"
                aria-invalid={!!error}
                aria-describedby={error ? 'pattern-error' : undefined}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary font-mono text-sm select-none"
                aria-hidden="true"
              >
                /{flagsString}
              </span>
            </div>
          </div>

          {/* Flags */}
          <div className="flex-shrink-0">
            <span className="text-xs text-text-secondary mb-1.5 block">Flags</span>
            <div
              className="flex items-center gap-3 flex-wrap"
              role="group"
              aria-label="Regex flags"
            >
              {FLAG_OPTIONS.map((opt) => (
                <div key={opt.flag} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`flag-${opt.flag}`}
                    checked={flags.has(opt.flag)}
                    onCheckedChange={() => toggleFlag(opt.flag)}
                    aria-label={`${opt.label} flag (${opt.flag}): ${opt.description}`}
                  />
                  <Label
                    htmlFor={`flag-${opt.flag}`}
                    className="text-xs text-text-secondary cursor-pointer select-none"
                    title={opt.description}
                  >
                    <span className="font-mono font-bold">{opt.flag}</span>
                    <span className="hidden sm:inline ml-1">{opt.label}</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div
            id="pattern-error"
            className="mt-2 flex items-center gap-2 px-3 py-2 rounded bg-red-500/10 border border-red-500/30"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Test String Panel */}
        <div className="flex-1 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-border/30">
          <div className="flex-shrink-0 px-4 py-2 border-b border-border/30 bg-surface-secondary/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Test String
              </span>
              <span className="text-xs text-text-tertiary">
                {testString.length > 0 && `${testString.length.toLocaleString()} characters`}
              </span>
            </div>
          </div>
          <div className="flex-1 relative min-h-0 overflow-auto">
            {/* Highlight overlay */}
            {displayMatches.length > 0 && testString && (
              <div
                className="absolute inset-0 p-4 font-mono text-sm pointer-events-none overflow-auto"
                aria-hidden="true"
              >
                <HighlightedText text={testString} matches={displayMatches} />
              </div>
            )}
            <textarea
              value={testString}
              onChange={(e) => {
                setTestString(e.target.value);
                setExpandedMatch(null);
              }}
              className={`absolute inset-0 w-full h-full resize-none font-mono text-sm p-4 focus:outline-none focus:ring-1 focus:ring-accent/20 border-0 ${
                displayMatches.length > 0 && testString
                  ? 'text-transparent bg-transparent caret-text-primary selection:bg-accent/30'
                  : 'bg-surface text-text-primary'
              }`}
              placeholder="Enter test string here..."
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              aria-label="Test string to match against the regular expression"
            />
          </div>
        </div>

        {/* Results Panel */}
        <div className="flex-1 flex flex-col min-h-0 lg:max-w-[50%]">
          <div className="flex-shrink-0 px-4 py-2 border-b border-border/30 bg-surface-secondary/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Match Results
              </span>
              <div className="flex items-center gap-2">
                {result && result.valid && result.matchCount > 0 && (
                  <>
                    <div
                      className="flex items-center gap-1 text-xs text-text-tertiary"
                      title="Execution time"
                    >
                      <Clock className="w-3 h-3" />
                      <span>{result.executionTimeMs}ms</span>
                    </div>
                    <button
                      onClick={handleCopyResults}
                      className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors"
                      title="Copy results as JSON"
                      aria-label="Copy match results as JSON"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            {!pattern && !testString && (
              <div className="flex flex-col items-center justify-center h-full text-text-tertiary px-4">
                <Hash className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm text-center">
                  Enter a regex pattern and test string to see matches
                </span>
                <button
                  onClick={() => setShowPresets(true)}
                  className="mt-3 text-xs text-accent hover:text-accent-hover transition-colors"
                >
                  Or try a common pattern
                </button>
              </div>
            )}

            {pattern && !error && result && result.valid && result.matchCount === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-text-tertiary px-4">
                <span className="text-sm">No matches found</span>
                <span className="text-xs mt-1">Try adjusting your pattern or flags</span>
              </div>
            )}

            {result && result.valid && result.matchCount > 0 && (
              <div className="p-3 space-y-2">
                {/* Summary */}
                <div className="flex items-center gap-3 px-3 py-2 bg-surface-secondary/30 rounded border border-border/30">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs font-medium text-text-primary">
                      {result.matchCount} {result.matchCount === 1 ? 'match' : 'matches'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                    <span className="text-xs text-text-tertiary">{result.executionTimeMs}ms</span>
                  </div>
                </div>

                {/* Match List */}
                {result.matches.map((match, idx) => {
                  const isExpanded = expandedMatch === idx;
                  const hasGroups =
                    match.captureGroups.length > 0 || Object.keys(match.groups).length > 0;

                  return (
                    <div key={idx} className="rounded border border-border/50 overflow-hidden">
                      <button
                        onClick={() => setExpandedMatch(isExpanded ? null : idx)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-secondary/30 transition-colors text-left"
                        aria-expanded={isExpanded}
                        aria-label={`Match ${idx + 1}: "${match.fullMatch}" at index ${match.index}`}
                      >
                        <span
                          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${HIGHLIGHT_COLORS[idx % HIGHLIGHT_COLORS.length]} text-text-primary`}
                        >
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-sm text-text-primary truncate block">
                            {match.fullMatch.length > 60
                              ? match.fullMatch.slice(0, 60) + '...'
                              : match.fullMatch}
                          </span>
                          <span className="text-xs text-text-tertiary">
                            Index {match.index}
                            {match.length > 0 && ` \u2022 ${match.length} chars`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {hasGroups && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              groups
                            </Badge>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-text-tertiary" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-text-tertiary" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-border/30 pt-2 space-y-2">
                          {/* Full match detail */}
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">
                              Full Match
                            </span>
                            <div className="mt-1 px-2 py-1.5 bg-surface-secondary/50 rounded font-mono text-sm text-text-primary break-all">
                              {match.fullMatch}
                            </div>
                          </div>

                          {/* Position */}
                          <div className="flex gap-4">
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">
                                Index
                              </span>
                              <div className="mt-0.5 font-mono text-sm text-text-primary">
                                {match.index}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">
                                Length
                              </span>
                              <div className="mt-0.5 font-mono text-sm text-text-primary">
                                {match.length}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">
                                Range
                              </span>
                              <div className="mt-0.5 font-mono text-sm text-text-primary">
                                [{match.index}, {match.index + match.length})
                              </div>
                            </div>
                          </div>

                          {/* Capture groups */}
                          {match.captureGroups.length > 0 && (
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">
                                Capture Groups
                              </span>
                              <div className="mt-1 space-y-1">
                                {match.captureGroups.map((group, gIdx) => (
                                  <div
                                    key={gIdx}
                                    className="flex items-center gap-2 px-2 py-1 bg-surface-secondary/30 rounded"
                                  >
                                    <span className="text-xs font-mono text-text-tertiary flex-shrink-0">
                                      ${gIdx + 1}
                                    </span>
                                    <span className="font-mono text-sm text-text-primary break-all">
                                      {group ?? (
                                        <span className="text-text-tertiary italic">undefined</span>
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Named groups */}
                          {Object.keys(match.groups).length > 0 && (
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">
                                Named Groups
                              </span>
                              <div className="mt-1 space-y-1">
                                {Object.entries(match.groups).map(([name, value]) => (
                                  <div
                                    key={name}
                                    className="flex items-center gap-2 px-2 py-1 bg-surface-secondary/30 rounded"
                                  >
                                    <span className="text-xs font-mono text-accent flex-shrink-0">
                                      {name}
                                    </span>
                                    <span className="font-mono text-sm text-text-primary break-all">
                                      {value ?? (
                                        <span className="text-text-tertiary italic">undefined</span>
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
