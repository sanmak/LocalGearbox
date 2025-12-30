/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useEffect, useState } from 'react';
import { X, Plus, Edit2, Copy, Trash2, Layers } from 'lucide-react';
import { useApiClientStore, Tab } from '@/lib/stores/api-client-store';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function RequestTabs() {
  const {
    tabs,
    activeTabId,
    setActiveTab,
    closeTab,
    addTab,
    duplicateTab,
    closeOtherTabs,
    renameTab,
  } = useApiClientStore();
  const [renamingTab, setRenamingTab] = useState<Tab | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Ensure at least one tab exists on mount
  useEffect(() => {
    useApiClientStore.persist.rehydrate();
    if (tabs.length === 0) {
      addTab();
    }
  }, [addTab, tabs.length]);

  const handleRename = () => {
    if (renamingTab && newTitle.trim()) {
      renameTab(renamingTab.id, newTitle.trim());
      setRenamingTab(null);
    }
  };

  return (
    <div className="flex h-10 w-full items-center border-b bg-background">
      <div className="flex h-full flex-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <ContextMenu key={tab.id}>
            <ContextMenuTrigger asChild>
              <div
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'group flex h-full min-w-[140px] max-w-[200px] cursor-pointer items-center justify-between border-r px-3 text-sm transition-colors hover:bg-muted/50',
                  activeTabId === tab.id
                    ? 'border-t-2 border-t-primary bg-background font-medium text-primary'
                    : 'border-t-2 border-t-transparent text-muted-foreground',
                )}
              >
                <div
                  className={`flex items-center gap-2 truncate ${tab.request.method === 'GET' ? 'text-green-500' : tab.request.method === 'POST' ? 'text-yellow-500' : tab.request.method === 'DELETE' ? 'text-red-500' : 'text-blue-500'}`}
                >
                  <span className="text-xs font-bold">{tab.request.method}</span>
                  <span
                    className={cn(
                      'truncate text-foreground',
                      activeTabId !== tab.id && 'text-muted-foreground',
                    )}
                  >
                    {tab.title || 'Untitled'}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </ContextMenuTrigger>

            <ContextMenuContent className="w-56">
              <ContextMenuItem
                onClick={() => {
                  setRenamingTab(tab);
                  setNewTitle(tab.title);
                }}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                <span>Rename Request</span>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => duplicateTab(tab.id)}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Duplicate Tab</span>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => closeTab(tab.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Close Tab</span>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => closeOtherTabs(tab.id)}>
                <Layers className="mr-2 h-4 w-4" />
                <span>Close other Tabs</span>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}

        <button
          onClick={() => addTab()}
          className="flex h-full w-10 items-center justify-center border-r hover:bg-muted"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <Dialog open={!!renamingTab} onOpenChange={(open) => !open && setRenamingTab(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Request</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              placeholder="Enter request name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingTab(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
