/**
 * OptionsPanel - Format-specific comparison options in a popover
 * Adapts to JSON, CSV, or text format selection
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DiffOptions, CsvDiffOptions, JsonDiffOptions } from '@/lib/tools/comparators';

type CombinedOptions = DiffOptions & CsvDiffOptions & JsonDiffOptions;

interface OptionsPanelProps {
  format: 'json' | 'csv' | 'text';
  options: CombinedOptions;
  onChange: (options: CombinedOptions) => void;
}

export function OptionsPanel({ format, options, onChange }: OptionsPanelProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (key: keyof CombinedOptions) => {
    const currentValue = options[key];
    onChange({
      ...options,
      [key]: typeof currentValue === 'boolean' ? !currentValue : true,
    });
  };

  const handleChange = (
    key: keyof CombinedOptions,
    value: string | boolean | string[] | undefined,
  ) => {
    const updated = { ...options };
    if (value === undefined) {
      delete updated[key];
    } else {
      (updated as Record<string, string | boolean | string[] | undefined>)[key] = value;
    }
    onChange(updated);
  };

  const handleReset = () => {
    onChange({});
  };

  // Count how many non-default options are active
  const activeCount = Object.values(options).filter(
    (v) => v !== undefined && v !== false && v !== '' && v !== 'auto',
  ).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Comparison options" className="relative">
          <Settings2 className="h-4 w-4" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="font-medium text-sm">Comparison Options</h4>
            <p className="text-xs text-muted-foreground">
              {format === 'json' && 'Configure JSON structural comparison'}
              {format === 'csv' && 'Configure CSV table-aware comparison'}
              {format === 'text' && 'Configure text line-by-line comparison'}
            </p>
          </div>

          <div className="space-y-3">
            {/* ---------- TEXT OPTIONS ---------- */}
            {format === 'text' && (
              <>
                <OptionSwitch
                  id="opt-ignore-case"
                  label="Ignore case"
                  description="Treat uppercase and lowercase as equal"
                  checked={options.ignoreCase ?? false}
                  onToggle={() => handleToggle('ignoreCase')}
                />
                <OptionSwitch
                  id="opt-ignore-ws"
                  label="Ignore whitespace"
                  description="Trim leading and trailing whitespace"
                  checked={options.ignoreWhitespace ?? false}
                  onToggle={() => handleToggle('ignoreWhitespace')}
                />
                <OptionSwitch
                  id="opt-ignore-blank"
                  label="Ignore blank lines"
                  description="Skip empty lines when comparing"
                  checked={options.ignoreBlankLines ?? false}
                  onToggle={() => handleToggle('ignoreBlankLines')}
                />
              </>
            )}

            {/* ---------- JSON OPTIONS ---------- */}
            {format === 'json' && (
              <>
                <OptionSwitch
                  id="opt-ignore-key-order"
                  label="Ignore key order"
                  description='Treat {"a":1,"b":2} as equal to {"b":2,"a":1}'
                  checked={options.ignoreKeyOrder ?? false}
                  onToggle={() => handleToggle('ignoreKeyOrder')}
                />
                <OptionSwitch
                  id="opt-ignore-formatting"
                  label="Ignore formatting"
                  description="Trim whitespace from string values"
                  checked={options.ignoreFormatting ?? false}
                  onToggle={() => handleToggle('ignoreFormatting')}
                />
              </>
            )}

            {/* ---------- CSV OPTIONS ---------- */}
            {format === 'csv' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="csv-delimiter" className="text-sm">
                    Delimiter
                  </Label>
                  <Select
                    value={options.delimiter ?? 'auto'}
                    onValueChange={(v) => handleChange('delimiter', v === 'auto' ? undefined : v)}
                  >
                    <SelectTrigger id="csv-delimiter" aria-label="CSV delimiter">
                      <SelectValue placeholder="Auto-detect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value=",">Comma (,)</SelectItem>
                      <SelectItem value={'\t'}>Tab</SelectItem>
                      <SelectItem value="|">Pipe (|)</SelectItem>
                      <SelectItem value=";">Semicolon (;)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <OptionSwitch
                  id="opt-csv-header"
                  label="First row is header"
                  checked={options.hasHeader ?? true}
                  onToggle={() => handleChange('hasHeader', !(options.hasHeader ?? true))}
                />

                <OptionSwitch
                  id="opt-csv-ignore-header"
                  label="Ignore header in diff"
                  checked={options.ignoreHeader ?? false}
                  onToggle={() => handleToggle('ignoreHeader')}
                  disabled={!(options.hasHeader ?? true)}
                />

                <OptionSwitch
                  id="opt-csv-detect-renames"
                  label="Detect column renames"
                  description="Identify renamed columns by content similarity"
                  checked={options.detectRenames ?? false}
                  onToggle={() => handleToggle('detectRenames')}
                />

                <div className="space-y-1.5">
                  <Label htmlFor="csv-key-columns" className="text-sm">
                    Primary key columns
                  </Label>
                  <Input
                    id="csv-key-columns"
                    placeholder="e.g., id, user_id"
                    value={options.keyColumns ? options.keyColumns.join(', ') : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.trim() === '') {
                        handleChange('keyColumns', undefined);
                      } else {
                        handleChange(
                          'keyColumns',
                          val
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        );
                      }
                    }}
                    aria-label="Primary key columns for row matching"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Comma-separated column names for intelligent row matching
                  </p>
                </div>

                <div className="border-t pt-3 mt-3" />

                <OptionSwitch
                  id="opt-csv-ignore-case"
                  label="Ignore case"
                  checked={options.ignoreCase ?? false}
                  onToggle={() => handleToggle('ignoreCase')}
                />
                <OptionSwitch
                  id="opt-csv-ignore-ws"
                  label="Ignore whitespace"
                  checked={options.ignoreWhitespace ?? false}
                  onToggle={() => handleToggle('ignoreWhitespace')}
                />
              </>
            )}
          </div>

          <div className="flex justify-between pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset all
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ---------- Helper sub-component ---------- */

function OptionSwitch({
  id,
  label,
  description,
  checked,
  onToggle,
  disabled,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className={cn('text-sm cursor-pointer', disabled && 'opacity-50')}>
          {label}
        </Label>
        <Switch id={id} checked={checked} onCheckedChange={onToggle} disabled={disabled} />
      </div>
      {description && (
        <p className="text-[11px] text-muted-foreground leading-tight">{description}</p>
      )}
    </div>
  );
}
