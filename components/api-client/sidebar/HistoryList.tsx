/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useApiClientStore, HttpMethod } from '@/lib/stores/api-client-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'text-green-500',
  POST: 'text-yellow-500',
  PUT: 'text-blue-500',
  DELETE: 'text-red-500',
  PATCH: 'text-purple-500',
  HEAD: 'text-gray-500',
  OPTIONS: 'text-pink-500',
};

export function HistoryList() {
  const { history, clearHistory, addTab } = useApiClientStore();

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
        <p className="text-sm">No history yet</p>
        <p className="text-xs mt-1">Requests you send will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b">
        <span className="text-xs font-semibold text-muted-foreground uppercase">History</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearHistory}
          className="h-6 w-6"
          aria-label="Clear history"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => addTab(item.request)}
              className="flex flex-col gap-1 p-3 border-b hover:bg-muted/50 text-left transition-colors group"
            >
              <div className="flex items-center gap-2 w-full overflow-hidden">
                <span className={cn('text-xs font-bold w-12', METHOD_COLORS[item.request.method])}>
                  {item.request.method}
                </span>
                <span className="text-sm truncate flex-1">{item.request.url}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {/* Requires date-fns, but for now simple JS date */}
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
                <RotateCw className="h-3 w-3 opacity-0 group-hover:opacity-100 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
