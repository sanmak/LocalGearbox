/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState } from 'react';
import { useApiClientStore, Environment } from '@/lib/stores/api-client-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Plus, Edit2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function EnvironmentList() {
  const {
    environments,
    activeEnvironmentId,
    setActiveEnvironment,
    createEnvironment,
    deleteEnvironment,
  } = useApiClientStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [, setEditingEnvId] = useState<string | null>(null);

  const handleCreate = () => {
    if (newEnvName.trim()) {
      createEnvironment(newEnvName);
      setNewEnvName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b">
        <span className="text-xs font-semibold text-muted-foreground uppercase">Environments</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCreating(true)}
          className="h-6 w-6"
          aria-label="Add environment"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isCreating && (
        <div className="p-2 border-b">
          <Input
            value={newEnvName}
            onChange={(e) => setNewEnvName(e.target.value)}
            placeholder="Env Name"
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
          {environments.map((env) => (
            <div
              key={env.id}
              className="flex items-center justify-between p-2 hover:bg-muted/50 rounded group border border-transparent hover:border-border"
            >
              <div
                className="flex items-center gap-2 flex-1 cursor-pointer"
                onClick={() => setActiveEnvironment(activeEnvironmentId === env.id ? null : env.id)}
              >
                <div
                  className={`w-2 h-2 rounded-full ${activeEnvironmentId === env.id ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
                />
                <span className="text-sm font-medium">{env.name}</span>
              </div>

              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setEditingEnvId(env.id)}
                      aria-label="Edit environment"
                    >
                      <Edit2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </DialogTrigger>
                  <EnvironmentEditor env={env} onClose={() => setEditingEnvId(null)} />
                </Dialog>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => deleteEnvironment(env.id)}
                  aria-label="Delete environment"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
          {environments.length === 0 && !isCreating && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No environments created.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function EnvironmentEditor({ env }: { env: Environment; onClose: () => void }) {
  const { updateEnvironment } = useApiClientStore();

  const updateVariable = (id: string, updates: any) => {
    updateEnvironment(env.id, {
      variables: env.variables.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    });
  };

  const addVariable = () => {
    updateEnvironment(env.id, {
      variables: [...env.variables, { id: uuidv4(), key: '', value: '', enabled: true }],
    });
  };

  const deleteVariable = (id: string) => {
    updateEnvironment(env.id, {
      variables: env.variables.filter((v) => v.id !== id),
    });
  };

  return (
    <DialogContent className="max-w-2xl bg-background">
      <DialogHeader>
        <DialogTitle>Edit Environment: {env.name}</DialogTitle>
      </DialogHeader>
      <div className="mt-4 max-h-[60vh] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variable</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {env.variables.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <Input
                    value={v.key}
                    onChange={(e) => updateVariable(v.id, { key: e.target.value })}
                    placeholder="KEY"
                    className="h-8 font-mono text-xs"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={v.value}
                    onChange={(e) => updateVariable(v.id, { value: e.target.value })}
                    placeholder="Value"
                    className="h-8 font-mono text-xs"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteVariable(v.id)}
                    className="h-6 w-6"
                    aria-label="Delete variable"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button variant="outline" size="sm" onClick={addVariable} className="mt-2 w-full">
          <Plus className="mr-2 h-3 w-3" /> Add Variable
        </Button>
      </div>
    </DialogContent>
  );
}
