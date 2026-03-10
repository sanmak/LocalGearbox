/**
 * InputPanel - Editor panel with line numbers for data diff input
 */

'use client';

import { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Link2, FileText, X } from 'lucide-react';

interface InputPanelProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onUploadClick: () => void;
  onUrlClick: () => void;
  onSampleClick: () => void;
}

export function InputPanel({
  title,
  value,
  onChange,
  placeholder = 'Paste data here...',
  onUploadClick,
  onUrlClick,
  onSampleClick,
}: InputPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lines = value ? value.split('\n') : [];
  const lineCount = lines.length;
  const charCount = value.length;

  const handleScroll = useCallback(() => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const handleClear = useCallback(() => {
    onChange('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [onChange]);

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSampleClick}
            className="h-7 px-2 text-xs"
            aria-label={`Load sample data for ${title}`}
          >
            <FileText className="h-3.5 w-3.5 mr-1" />
            Sample
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onUploadClick}
            className="h-7 px-2 text-xs"
            aria-label={`Upload file for ${title}`}
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            File
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onUrlClick}
            className="h-7 px-2 text-xs"
            aria-label={`Load from URL for ${title}`}
          >
            <Link2 className="h-3.5 w-3.5 mr-1" />
            URL
          </Button>
          {value.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
              aria-label={`Clear ${title}`}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Editor area with line numbers */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Line numbers gutter */}
        <div
          ref={gutterRef}
          className="flex-shrink-0 w-12 bg-muted/20 border-r select-none overflow-hidden"
          aria-hidden="true"
        >
          <div className="py-2 pr-2">
            {lineCount > 0 ? (
              lines.map((_, idx) => (
                <div
                  key={idx}
                  className="text-right text-xs leading-[20px] text-muted-foreground/50 font-mono px-1"
                >
                  {idx + 1}
                </div>
              ))
            ) : (
              <div className="text-right text-xs leading-[20px] text-muted-foreground/30 font-mono px-1">
                1
              </div>
            )}
          </div>
        </div>

        {/* Textarea */}
        <ScrollArea className="flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            placeholder={placeholder}
            className="w-full h-full min-h-[200px] resize-none bg-transparent py-2 px-3 text-sm font-mono leading-[20px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            spellCheck={false}
            aria-label={title}
          />
        </ScrollArea>
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t bg-muted/20 text-xs text-muted-foreground">
        <span>{lineCount > 0 ? `${lineCount} line${lineCount !== 1 ? 's' : ''}` : 'Empty'}</span>
        <span>{charCount > 0 ? `${charCount.toLocaleString()} chars` : ''}</span>
      </div>
    </div>
  );
}
