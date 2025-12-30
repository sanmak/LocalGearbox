/**
 * OptionsPanel - Format-specific comparison options
 */

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

export interface DiffOptions {
  // Text options
  ignoreCase?: boolean;
  ignoreWhitespace?: boolean;
  ignoreBlankLines?: boolean;

  // JSON options (for future)
  ignoreKeyOrder?: boolean;
  ignoreFormatting?: boolean;

  // CSV options
  csvDelimiter?: string;
  csvHasHeader?: boolean;
  csvIgnoreHeader?: boolean;
  csvKeyColumns?: string;
  csvDetectRenames?: boolean;
}

interface OptionsPanelProps {
  format: 'json' | 'csv' | 'text';
  options: DiffOptions;
  onChange: (options: DiffOptions) => void;
}

export function OptionsPanel({ format, options, onChange }: OptionsPanelProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (key: keyof DiffOptions) => {
    onChange({
      ...options,
      [key]: !options[key],
    });
  };

  const handleChange = (key: keyof DiffOptions, value: string | boolean) => {
    onChange({
      ...options,
      [key]: value,
    });
  };

  const handleReset = () => {
    onChange({
      ignoreCase: false,
      ignoreWhitespace: false,
      ignoreBlankLines: false,
      ignoreKeyOrder: false,
      ignoreFormatting: false,
      csvDelimiter: 'auto',
      csvHasHeader: true,
      csvIgnoreHeader: false,
      csvKeyColumns: '',
      csvDetectRenames: false,
    });
  };

  const handleDone = () => {
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Comparison options">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Comparison Options</h4>
            <p className="text-xs text-muted-foreground">
              {format === 'json'
                ? 'Configure JSON comparison behavior'
                : format === 'csv'
                  ? 'Configure CSV comparison behavior'
                  : 'Configure text comparison behavior'}
            </p>
          </div>

          <div className="space-y-3">
            {format === 'text' ? (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ignore-case" className="text-sm cursor-pointer">
                    Ignore case
                  </Label>
                  <Switch
                    id="ignore-case"
                    checked={options.ignoreCase || false}
                    onCheckedChange={() => handleToggle('ignoreCase')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ignore-whitespace" className="text-sm cursor-pointer">
                    Ignore whitespace
                  </Label>
                  <Switch
                    id="ignore-whitespace"
                    checked={options.ignoreWhitespace || false}
                    onCheckedChange={() => handleToggle('ignoreWhitespace')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ignore-blank-lines" className="text-sm cursor-pointer">
                    Ignore blank lines
                  </Label>
                  <Switch
                    id="ignore-blank-lines"
                    checked={options.ignoreBlankLines || false}
                    onCheckedChange={() => handleToggle('ignoreBlankLines')}
                  />
                </div>
              </>
            ) : format === 'csv' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="csv-delimiter" className="text-sm">
                    Delimiter
                  </Label>
                  <Select
                    value={options.csvDelimiter || 'auto'}
                    onValueChange={(v) => handleChange('csvDelimiter', v)}
                  >
                    <SelectTrigger id="csv-delimiter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value=",">Comma (,)</SelectItem>
                      <SelectItem value="	">Tab (↹)</SelectItem>
                      <SelectItem value="|">Pipe (|)</SelectItem>
                      <SelectItem value=";">Semicolon (;)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="csv-has-header" className="text-sm cursor-pointer">
                    First row is header
                  </Label>
                  <Switch
                    id="csv-has-header"
                    checked={options.csvHasHeader !== undefined ? options.csvHasHeader : true}
                    onCheckedChange={(v) => handleChange('csvHasHeader', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="csv-ignore-header" className="text-sm cursor-pointer">
                    Ignore header in diff
                  </Label>
                  <Switch
                    id="csv-ignore-header"
                    checked={options.csvIgnoreHeader || false}
                    onCheckedChange={(v) => handleChange('csvIgnoreHeader', v)}
                    disabled={!options.csvHasHeader}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="csv-detect-renames" className="text-sm cursor-pointer">
                    Detect column renames
                  </Label>
                  <Switch
                    id="csv-detect-renames"
                    checked={options.csvDetectRenames || false}
                    onCheckedChange={(v) => handleChange('csvDetectRenames', v)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="csv-key-columns" className="text-sm">
                    Primary key columns
                  </Label>
                  <Input
                    id="csv-key-columns"
                    placeholder="e.g., id, user_id"
                    value={options.csvKeyColumns || ''}
                    onChange={(e) => handleChange('csvKeyColumns', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated column names for intelligent row matching
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="csv-ignore-case" className="text-sm cursor-pointer">
                    Ignore case
                  </Label>
                  <Switch
                    id="csv-ignore-case"
                    checked={options.ignoreCase || false}
                    onCheckedChange={() => handleToggle('ignoreCase')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="csv-ignore-whitespace" className="text-sm cursor-pointer">
                    Ignore whitespace
                  </Label>
                  <Switch
                    id="csv-ignore-whitespace"
                    checked={options.ignoreWhitespace || false}
                    onCheckedChange={() => handleToggle('ignoreWhitespace')}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ignore-key-order" className="text-sm cursor-pointer">
                    Ignore key order
                  </Label>
                  <Switch
                    id="ignore-key-order"
                    checked={options.ignoreKeyOrder || false}
                    onCheckedChange={() => handleToggle('ignoreKeyOrder')}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Treat {'{'}a:1, b:2{'}'} as equal to {'{'}b:2, a:1{'}'}
                </p>

                <div className="flex items-center justify-between">
                  <Label htmlFor="ignore-formatting" className="text-sm cursor-pointer">
                    Ignore formatting
                  </Label>
                  <Switch
                    id="ignore-formatting"
                    checked={options.ignoreFormatting || false}
                    onCheckedChange={() => handleToggle('ignoreFormatting')}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Trim whitespace from string values</p>
              </>
            )}
          </div>

          <div className="flex justify-between pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={handleDone}>
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
