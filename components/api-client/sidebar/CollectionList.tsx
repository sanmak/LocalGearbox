/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState, useRef } from 'react';
import { useApiClientStore, Collection, ApiRequest } from '@/lib/stores/api-client-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  FileJson,
  Download,
  Upload,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CollectionAuthDialog } from './CollectionAuthDialog';

export function CollectionList() {
  const {
    collections,
    createCollection,
    deleteCollection,
    addTab,
    importCollection,
    exportCollection,
    duplicateRequest,
  } = useApiClientStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    if (newCollectionName.trim()) {
      createCollection(newCollectionName);
      setNewCollectionName('');
      setIsCreating(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      importCollection(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b">
        <span className="text-xs font-semibold text-muted-foreground uppercase">Collections</span>
        <div className="flex items-center gap-1">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleImport}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-6 w-6"
            title="Import Collection"
          >
            <Upload className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCreating(true)}
            className="h-6 w-6"
            title="New Collection"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isCreating && (
        <div className="p-2 border-b">
          <Input
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="Collection Name"
            className="h-8 text-xs mb-2"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsCreating(false)}
              className="h-6 px-2 text-xs"
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} className="h-6 px-2 text-xs">
              Create
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="flex flex-col p-2 gap-1">
          {collections.map((collection) => (
            <CollectionItem
              key={collection.id}
              collection={collection}
              onDelete={() => deleteCollection(collection.id)}
              onExport={() => exportCollection(collection.id)}
              onDuplicate={(id) => duplicateRequest(id)}
              onOpenRequest={(req) => addTab(req)}
            />
          ))}
          {collections.length === 0 && !isCreating && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Create a collection to organize your requests.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function CollectionItem({
  collection,
  onDelete,
  onExport,
  onOpenRequest,
  onDuplicate,
}: {
  collection: Collection;
  onDelete: () => void;
  onExport: () => void;
  onOpenRequest: (req: ApiRequest) => void;
  onDuplicate: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <div
        className="flex items-center gap-2 p-1 hover:bg-muted/50 rounded cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
        {isOpen ? (
          <FolderOpen className="h-4 w-4 text-yellow-500" />
        ) : (
          <Folder className="h-4 w-4 text-yellow-500" />
        )}
        <span className="text-sm flex-1 truncate">{collection.name}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
          <CollectionAuthDialog collection={collection} />
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onExport();
            }}
            className="h-5 w-5"
            title="Export"
          >
            <Download className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-5 w-5"
            title="Delete"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500 transition-colors" />
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="pl-4 border-l ml-2.5 mt-1 space-y-1">
          {collection.requests.map((req) => (
            <button
              key={req.id}
              onClick={() => onOpenRequest(req)}
              className="flex items-center gap-2 w-full p-1 hover:bg-muted/50 rounded text-left group"
            >
              <FileJson
                className={cn(
                  'h-3 w-3',
                  req.method === 'GET'
                    ? 'text-green-500'
                    : req.method === 'POST'
                      ? 'text-yellow-500'
                      : req.method === 'DELETE'
                        ? 'text-red-500'
                        : 'text-blue-500',
                )}
              />
              <span className="text-xs truncate flex-1">{req.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(req.id);
                }}
                className="h-5 w-5 opacity-0 group-hover:opacity-100"
                title="Duplicate"
              >
                <Copy className="h-2.5 w-2.5 text-muted-foreground" />
              </Button>
            </button>
          ))}
          {collection.requests.length === 0 && (
            <span className="text-[10px] text-muted-foreground pl-2 italic">Empty</span>
          )}
        </div>
      )}
    </div>
  );
}
