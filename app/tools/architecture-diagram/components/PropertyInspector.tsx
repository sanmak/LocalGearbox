/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useDiagramStore } from '../store/diagram-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

function EmptyState() {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <p className="text-sm">No component selected</p>
      <p className="text-xs mt-1">Click a component to edit its properties</p>
    </div>
  );
}

export function PropertyInspector() {
  const {
    components,
    connections,
    selectedComponentIds,
    selectedConnectionIds,
    updateComponent,
    updateConnection,
    deleteComponent,
    deleteConnection,
  } = useDiagramStore();

  // Component editing
  if (selectedComponentIds.length === 1) {
    const component = components.find((c) => c.id === selectedComponentIds[0]);
    if (!component) return <EmptyState />;

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Component Properties</h3>
          <Button variant="destructive" size="sm" onClick={() => deleteComponent(component.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="id" className="text-xs">
              ID
            </Label>
            <Input
              id="id"
              value={component.id}
              onChange={(e) => updateComponent(component.id, { id: e.target.value })}
              className="h-8 text-sm"
            />
          </div>

          <div>
            <Label htmlFor="label" className="text-xs">
              Label
            </Label>
            <Input
              id="label"
              value={component.label}
              onChange={(e) => updateComponent(component.id, { label: e.target.value })}
              className="h-8 text-sm"
            />
          </div>

          <div>
            <Label htmlFor="type" className="text-xs">
              Type
            </Label>
            <Input id="type" value={component.type} disabled className="h-8 text-sm bg-muted" />
          </div>

          <div>
            <Label htmlFor="description" className="text-xs">
              Description
            </Label>
            <Textarea
              id="description"
              value={component.description || ''}
              onChange={(e) => updateComponent(component.id, { description: e.target.value })}
              className="text-sm min-h-[60px]"
              placeholder="Add a description..."
            />
          </div>

          {component.position && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="x" className="text-xs">
                  X Position
                </Label>
                <Input
                  id="x"
                  type="number"
                  value={Math.round(component.position.x)}
                  onChange={(e) =>
                    updateComponent(component.id, {
                      position: {
                        ...component.position!,
                        x: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="y" className="text-xs">
                  Y Position
                </Label>
                <Input
                  id="y"
                  type="number"
                  value={Math.round(component.position.y)}
                  onChange={(e) =>
                    updateComponent(component.id, {
                      position: {
                        ...component.position!,
                        y: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Connection editing
  if (selectedConnectionIds.length === 1) {
    const connection = connections.find((c) => c.id === selectedConnectionIds[0]);
    if (!connection) return <EmptyState />;

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Connection Properties</h3>
          <Button variant="destructive" size="sm" onClick={() => deleteConnection(connection.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="conn-label" className="text-xs">
              Label
            </Label>
            <Input
              id="conn-label"
              value={connection.label || ''}
              onChange={(e) => updateConnection(connection.id, { label: e.target.value })}
              className="h-8 text-sm"
              placeholder="Connection label..."
            />
          </div>

          <div>
            <Label htmlFor="conn-type" className="text-xs">
              Type
            </Label>
            <Input
              id="conn-type"
              value={connection.type}
              disabled
              className="h-8 text-sm bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="from" className="text-xs">
              From
            </Label>
            <Input id="from" value={connection.from} disabled className="h-8 text-sm bg-muted" />
          </div>

          <div>
            <Label htmlFor="to" className="text-xs">
              To
            </Label>
            <Input id="to" value={connection.to} disabled className="h-8 text-sm bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  // Multi-select
  if (selectedComponentIds.length > 1 || selectedConnectionIds.length > 1) {
    const totalSelected = selectedComponentIds.length + selectedConnectionIds.length;
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">{totalSelected} items selected</p>
        <p className="text-xs mt-1">Select a single item to edit properties</p>
      </div>
    );
  }

  return <EmptyState />;
}
