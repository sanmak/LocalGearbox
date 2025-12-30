/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Code,
  Eye,
  Download,
  Upload,
  Settings,
  HelpCircle,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { useDiagramStore } from './store/diagram-store';
import { DiagramCanvas } from './components/DiagramCanvas';
import { ComponentPalette } from './components/ComponentPalette';
import { PropertyInspector } from './components/PropertyInspector';

export default function ArchitectureDiagramPage() {
  const [isMounted, setIsMounted] = useState(false);
  const {
    components,
    connections,
    editMode,
    setEditMode,
    selectedComponentIds,
    selectedConnectionIds,
    undo,
    redo,
    history,
    historyIndex,
  } = useDiagramStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  if (!isMounted) return null;

  const selectedCount = selectedComponentIds.length + selectedConnectionIds.length;

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Architecture Diagram</h1>
            <Badge variant="secondary" className="text-xs">
              {components.length} components
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {connections.length} connections
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={editMode} onValueChange={(v) => setEditMode(v as any)}>
              <TabsList>
                <TabsTrigger value="visual" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Visual
                </TabsTrigger>
                <TabsTrigger value="code" className="gap-2">
                  <Code className="h-4 w-4" />
                  Code
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="default" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Help">
              <HelpCircle className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => undo()}
              disabled={historyIndex <= 0}
              title="Undo"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => redo()}
              disabled={historyIndex >= history.length - 1}
              title="Redo"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel - Component Library */}
        <ResizablePanel defaultSize={20}>
          <div className="flex flex-col h-full bg-card border-r">
            <div className="px-4 py-3 border-b">
              <h2 className="text-sm font-medium">Components</h2>
            </div>
            <div className="flex-1 overflow-auto">
              <ComponentPalette />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center Panel - Canvas */}
        <ResizablePanel defaultSize={50}>
          <div className="flex flex-col h-full bg-background">
            <DiagramCanvas />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Inspector */}
        <ResizablePanel defaultSize={30}>
          <div className="flex flex-col h-full bg-card border-l">
            <div className="px-4 py-3 border-b">
              <h2 className="text-sm font-medium">
                {selectedCount > 0 ? `Properties (${selectedCount} selected)` : 'Properties'}
              </h2>
            </div>
            <div className="flex-1 overflow-auto">
              <PropertyInspector />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Bottom Status Bar */}
      <div className="px-4 py-2 border-t bg-card text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>{components.length} components</span>
            <span>•</span>
            <span>{connections.length} connections</span>
            <span>•</span>
            <span>{selectedCount} selected</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Zoom: 100%</span>
            <span>•</span>
            <span>Pan: 0, 0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
