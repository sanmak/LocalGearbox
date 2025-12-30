/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState } from 'react';
import { useApiClientStore } from '@/lib/stores/api-client-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Eye, Edit3 } from 'lucide-react';

export function RequestDocs() {
  const { activeTabId, tabs, updateTabRequest } = useApiClientStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  if (!activeTab) return null;

  const description = activeTab.request.description || '';

  return (
    <div className="flex flex-col h-full bg-background border-t">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium">Documentation</span>
        </div>
        <div className="flex bg-muted/20 p-0.5 rounded-md">
          <Button
            variant={mode === 'edit' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setMode('edit')}
            className="h-7 px-3 text-[10px] gap-1.5"
          >
            <Edit3 className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant={mode === 'preview' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setMode('preview')}
            className="h-7 px-3 text-[10px] gap-1.5"
          >
            <Eye className="h-3 w-3" />
            Preview
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        {mode === 'edit' ? (
          <div className="h-full flex flex-col gap-4">
            <Textarea
              value={description}
              onChange={(e) => updateTabRequest(activeTab.id, { description: e.target.value })}
              placeholder="Add markdown description for this request..."
              className="flex-1 font-mono text-sm resize-none focus-visible:ring-1 border-none shadow-none bg-transparent"
            />
            <div className="text-[10px] text-muted-foreground italic border-t pt-2">
              Supports standard Markdown. Use this to document API requirements, examples, or notes.
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
            {description ? (
              <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {description}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground italic">
                <p>No documentation provided yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
