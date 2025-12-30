/**
 * InputPanel - Reusable input panel component for left and right data
 */

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, Link2, FileText } from 'lucide-react';

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
  return (
    <div className="flex flex-col h-full bg-card">
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">{title}</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUploadClick}
              className="h-7 px-2"
              aria-label="Upload file"
            >
              <Upload className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onUrlClick}
              className="h-7 px-2"
              aria-label="Load from URL"
            >
              <Link2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSampleClick}
              className="h-7 px-2"
              aria-label="Load sample data"
            >
              <FileText className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 resize-none border-0 font-mono text-xs focus-visible:ring-0 rounded-none bg-card"
      />
    </div>
  );
}
