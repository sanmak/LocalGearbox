/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { KeyValueParam, fileMap } from '@/lib/stores/api-client-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRef } from 'react';

interface KeyValueTableProps {
  items: KeyValueParam[];
  onChange: (items: KeyValueParam[]) => void;
}

export function KeyValueTable({ items, onChange }: KeyValueTableProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeFileRowId = useRef<string | null>(null);

  const updateItem = (id: string, updates: Partial<KeyValueParam>) => {
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return;

    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };

    if (index === items.length - 1) {
      if (newItems[index].key || newItems[index].value || newItems[index].fileName) {
        newItems.push({ id: uuidv4(), key: '', value: '', enabled: true, type: 'text' });
      }
    }

    onChange(newItems);
  };

  const deleteItem = (id: string) => {
    const newItems = items.filter((i) => i.id !== id);
    if (newItems.length === 0) {
      newItems.push({ id: uuidv4(), key: '', value: '', enabled: true, type: 'text' });
    }
    fileMap.delete(id);
    onChange(newItems);
  };

  const handleFileSelect = (id: string) => {
    activeFileRowId.current = id;
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = activeFileRowId.current;
    if (file && id) {
      fileMap.set(id, file);
      updateItem(id, { fileName: file.name, value: `[File: ${file.name}]` });
    }
    e.target.value = ''; // Reset for same file selection
  };

  return (
    <div className="flex flex-col border rounded-md overflow-hidden bg-card">
      <input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} />
      <div className="flex items-center border-b bg-muted/50 px-2 py-1 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">
        <div className="w-8 pl-2"></div>
        <div className="flex-1 px-2">Key</div>
        <div className="w-20 px-2">Type</div>
        <div className="flex-1 px-2">Value</div>
        <div className="w-10"></div>
      </div>
      {items.map((item, index) => (
        <div key={item.id} className="group flex items-center border-b last:border-0 p-0 text-sm">
          <div className="flex w-8 h-9 items-center justify-center border-r bg-muted/5">
            <Checkbox
              checked={item.enabled}
              onCheckedChange={(checked) => updateItem(item.id, { enabled: !!checked })}
              className="h-3.5 w-3.5 data-[state=checked]:bg-primary/80"
            />
          </div>
          <div className="flex-1 px-0">
            <Input
              value={item.key}
              onChange={(e) => updateItem(item.id, { key: e.target.value })}
              placeholder="Key"
              className="h-9 border-none shadow-none focus-visible:ring-0 px-3 text-xs bg-transparent"
            />
          </div>
          <div className="w-20 px-0 border-l border-dotted">
            <Select
              value={item.type || 'text'}
              onValueChange={(v) =>
                updateItem(item.id, {
                  type: v as 'text' | 'file',
                  value: v === 'file' ? '' : item.value,
                  fileName: v === 'text' ? undefined : item.fileName,
                })
              }
            >
              <SelectTrigger className="h-9 border-none shadow-none focus:ring-0 px-2 text-[10px] bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text" className="text-xs">
                  Text
                </SelectItem>
                <SelectItem value="file" className="text-xs">
                  File
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 px-0 border-l border-dotted relative">
            {item.type === 'file' ? (
              <div className="flex items-center gap-2 px-3 h-9 group/file">
                <span className="text-xs text-muted-foreground truncate flex-1 italic">
                  {item.fileName || 'No file selected'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] bg-muted/50 hover:bg-muted"
                  onClick={() => handleFileSelect(item.id)}
                >
                  {item.fileName ? 'Change' : 'Select File'}
                </Button>
              </div>
            ) : (
              <Input
                value={item.value}
                onChange={(e) => updateItem(item.id, { value: e.target.value })}
                placeholder="Value"
                className="h-9 border-none shadow-none focus-visible:ring-0 px-3 text-xs bg-transparent"
              />
            )}
          </div>
          <div className="flex w-10 items-center justify-center border-l bg-muted/5">
            {index < items.length - 1 ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteItem(item.id)}
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete item"
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
              </Button>
            ) : (
              <div className="h-6 w-6" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
