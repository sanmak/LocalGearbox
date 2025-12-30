/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState } from 'react';
import { useApiClientStore, ApiRequest } from '@/lib/stores/api-client-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Save, Folder, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function SaveRequestDialog({ request }: { request: ApiRequest }) {
  const { collections, addToCollection, createCollection } = useApiClientStore();
  const [open, setOpen] = useState(false);
  const [reqName, setReqName] = useState(request.name || 'My Request');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  const handleSave = () => {
    if (!selectedCollectionId && !newCollectionName) return;

    let targetCollectionId = selectedCollectionId;

    if (targetCollectionId) {
      addToCollection(targetCollectionId, { ...request, name: reqName });
      setOpen(false);
    }
  };

  const handleCreateCollection = () => {
    if (!newCollectionName) return;
    createCollection(newCollectionName);
    setNewCollectionName('');
    setIsCreatingCollection(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="h-10 font-semibold px-4">
          <Save className="mr-2 h-4 w-4" /> Save
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Request</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Request Name</label>
            <Input value={reqName} onChange={(e) => setReqName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Select Collection</label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setIsCreatingCollection(!isCreatingCollection)}
              >
                <Plus className="mr-1 h-3 w-3" /> New Collection
              </Button>
            </div>

            {isCreatingCollection && (
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Collection Name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="h-8"
                />
                <Button size="sm" onClick={handleCreateCollection} className="h-8">
                  Create
                </Button>
              </div>
            )}

            <ScrollArea className="h-[200px] border rounded-md p-2">
              <div className="flex flex-col gap-1">
                {collections.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted',
                      selectedCollectionId === c.id && 'bg-primary/10 text-primary font-medium',
                    )}
                    onClick={() => setSelectedCollectionId(c.id)}
                  >
                    <Folder className="h-4 w-4 text-yellow-500" />
                    {c.name}
                  </div>
                ))}
                {collections.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    No collections found. Create one!
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <Button onClick={handleSave} disabled={!selectedCollectionId} className="w-full">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
