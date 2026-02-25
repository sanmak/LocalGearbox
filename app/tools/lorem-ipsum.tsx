/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState, useCallback } from 'react';
import { generateLoremIpsumText } from '@/lib/tools';
import { CopyIcon, CheckIcon, ClearIcon } from '@/components/json/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlignLeft, Type, LetterText, RefreshCw } from 'lucide-react';

type LoremMode = 'paragraphs' | 'sentences' | 'words';

interface ModeConfig {
  value: LoremMode;
  label: string;
  defaultCount: number;
  min: number;
  max: number;
  unit: string;
}

const MODE_CONFIGS: ModeConfig[] = [
  {
    value: 'paragraphs',
    label: 'Paragraphs',
    defaultCount: 3,
    min: 1,
    max: 100,
    unit: 'paragraphs',
  },
  {
    value: 'sentences',
    label: 'Sentences',
    defaultCount: 5,
    min: 1,
    max: 500,
    unit: 'sentences',
  },
  {
    value: 'words',
    label: 'Words',
    defaultCount: 50,
    min: 1,
    max: 5000,
    unit: 'words',
  },
];

const countWords = (text: string): number => {
  if (!text.trim()) return 0;
  return text.split(/\s+/).filter((w) => w.length > 0).length;
};

export default function LoremIpsumPage() {
  const [mode, setMode] = useState<LoremMode>('paragraphs');
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [includeHtml, setIncludeHtml] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentConfig = MODE_CONFIGS.find((c) => c.value === mode)!;

  const handleGenerate = useCallback(async () => {
    setError(null);
    setCopied(false);
    try {
      const input = JSON.stringify({
        mode,
        count,
        startWithLorem,
        includeHtml,
      });
      const result = await generateLoremIpsumText(input);
      setOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate text');
      setOutput('');
    }
  }, [mode, count, startWithLorem, includeHtml]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }, [output]);

  const handleClear = useCallback(() => {
    setOutput('');
    setError(null);
    setCopied(false);
  }, []);

  const handleModeChange = useCallback((newMode: string) => {
    const modeValue = newMode as LoremMode;
    setMode(modeValue);
    const config = MODE_CONFIGS.find((c) => c.value === modeValue);
    if (config) {
      setCount(config.defaultCount);
    }
  }, []);

  const handleCountChange = useCallback(
    (value: string) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return;
      const clamped = Math.max(currentConfig.min, Math.min(currentConfig.max, num));
      setCount(clamped);
    },
    [currentConfig],
  );

  const wordCount = countWords(output.replace(/<[^>]*>/g, ''));
  const charCount = output.length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
      <Card className="border-none rounded-none shadow-none">
        <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl">Lorem Ipsum Generator</CardTitle>
            <span className="text-sm text-muted-foreground">
              Generate placeholder text for designs and layouts
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              title="Clear output"
              aria-label="Clear output"
              disabled={!output}
            >
              <ClearIcon />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-4 py-4 border-b border-border/30 bg-muted/10">
          <div className="flex flex-col gap-4">
            {/* Mode selector */}
            <div className="flex flex-col gap-2">
              <Label id="mode-label" className="text-sm font-medium">
                Generation Mode
              </Label>
              <Tabs value={mode} onValueChange={handleModeChange} aria-labelledby="mode-label">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                  <TabsTrigger
                    value="paragraphs"
                    className="flex items-center gap-2"
                    aria-label="Generate paragraphs"
                  >
                    <AlignLeft className="w-4 h-4" />
                    Paragraphs
                  </TabsTrigger>
                  <TabsTrigger
                    value="sentences"
                    className="flex items-center gap-2"
                    aria-label="Generate sentences"
                  >
                    <Type className="w-4 h-4" />
                    Sentences
                  </TabsTrigger>
                  <TabsTrigger
                    value="words"
                    className="flex items-center gap-2"
                    aria-label="Generate words"
                  >
                    <LetterText className="w-4 h-4" />
                    Words
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Count and options row */}
            <div className="flex flex-wrap items-end gap-6">
              {/* Count input */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lorem-count" className="text-sm font-medium">
                  Count ({currentConfig.min}-{currentConfig.max})
                </Label>
                <Input
                  id="lorem-count"
                  type="number"
                  min={currentConfig.min}
                  max={currentConfig.max}
                  value={count}
                  onChange={(e) => handleCountChange(e.target.value)}
                  className="w-28 font-mono"
                  aria-label={`Number of ${currentConfig.unit} to generate`}
                />
              </div>

              {/* Start with Lorem ipsum toggle */}
              <div className="flex items-center gap-2.5 pb-1">
                <Switch
                  id="start-lorem"
                  checked={startWithLorem}
                  onCheckedChange={setStartWithLorem}
                  aria-label="Start with classic Lorem ipsum text"
                />
                <Label htmlFor="start-lorem" className="text-sm cursor-pointer select-none">
                  Start with &quot;Lorem ipsum...&quot;
                </Label>
              </div>

              {/* HTML tags toggle */}
              <div className="flex items-center gap-2.5 pb-1">
                <Switch
                  id="include-html"
                  checked={includeHtml}
                  onCheckedChange={setIncludeHtml}
                  aria-label="Wrap output in HTML paragraph tags"
                />
                <Label htmlFor="include-html" className="text-sm cursor-pointer select-none">
                  Wrap in HTML tags
                </Label>
              </div>
            </div>

            {/* Generate button */}
            <div>
              <Button
                onClick={handleGenerate}
                className="flex items-center gap-2"
                aria-label="Generate Lorem Ipsum text"
              >
                <RefreshCw className="w-4 h-4" />
                Generate
              </Button>
            </div>

            {error && (
              <div className="text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded" role="alert">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Output area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Card className="flex-1 flex flex-col min-h-0 border-none rounded-none shadow-none">
          <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border/30 bg-muted/10">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Generated Text</span>
              {output && (
                <span className="text-xs text-muted-foreground">
                  {wordCount.toLocaleString()} words &middot; {charCount.toLocaleString()}{' '}
                  characters
                </span>
              )}
            </div>
            <Button
              onClick={handleCopy}
              disabled={!output}
              className="flex items-center gap-1.5"
              title="Copy to clipboard"
              aria-label="Copy generated text to clipboard"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            {output ? (
              <Textarea
                value={output}
                readOnly
                className="h-full w-full resize-none border-0 rounded-none font-mono text-sm p-4 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Generated Lorem Ipsum text output"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Click &quot;Generate&quot; to create Lorem Ipsum text
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
