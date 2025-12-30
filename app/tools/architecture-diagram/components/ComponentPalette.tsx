/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Server, Database, Cloud, Network, User } from 'lucide-react';
import type { ComponentType } from '@/lib/tools/workbenches/architecture-diagram/types';

interface ComponentTemplate {
  type: ComponentType;
  label: string;
  category: string;
  icon: React.ReactNode;
}

const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  // Infrastructure
  {
    type: 'server',
    label: 'Server',
    category: 'Infrastructure',
    icon: <Server className="h-4 w-4" />,
  },
  {
    type: 'database',
    label: 'Database',
    category: 'Infrastructure',
    icon: <Database className="h-4 w-4" />,
  },
  {
    type: 'container',
    label: 'Container',
    category: 'Infrastructure',
    icon: <Server className="h-4 w-4" />,
  },
  {
    type: 'vm',
    label: 'Virtual Machine',
    category: 'Infrastructure',
    icon: <Server className="h-4 w-4" />,
  },
  {
    type: 'storage',
    label: 'Storage',
    category: 'Infrastructure',
    icon: <Database className="h-4 w-4" />,
  },

  // Services
  {
    type: 'api',
    label: 'API',
    category: 'Services',
    icon: <Cloud className="h-4 w-4" />,
  },
  {
    type: 'function',
    label: 'Function',
    category: 'Services',
    icon: <Cloud className="h-4 w-4" />,
  },
  {
    type: 'queue',
    label: 'Queue',
    category: 'Services',
    icon: <Cloud className="h-4 w-4" />,
  },
  {
    type: 'cache',
    label: 'Cache',
    category: 'Services',
    icon: <Database className="h-4 w-4" />,
  },
  {
    type: 'cdn',
    label: 'CDN',
    category: 'Services',
    icon: <Network className="h-4 w-4" />,
  },
  {
    type: 'dns',
    label: 'DNS',
    category: 'Services',
    icon: <Network className="h-4 w-4" />,
  },

  // Network
  {
    type: 'load-balancer',
    label: 'Load Balancer',
    category: 'Network',
    icon: <Network className="h-4 w-4" />,
  },
  {
    type: 'firewall',
    label: 'Firewall',
    category: 'Network',
    icon: <Network className="h-4 w-4" />,
  },
  {
    type: 'gateway',
    label: 'Gateway',
    category: 'Network',
    icon: <Network className="h-4 w-4" />,
  },

  // Users
  {
    type: 'user',
    label: 'User',
    category: 'Users',
    icon: <User className="h-4 w-4" />,
  },
  {
    type: 'external-service',
    label: 'External Service',
    category: 'Users',
    icon: <Cloud className="h-4 w-4" />,
  },
];

export function ComponentPalette() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredComponents = COMPONENT_TEMPLATES.filter((comp) =>
    comp.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const categories = Array.from(new Set(filteredComponents.map((c) => c.category)));

  const handleDragStart = (event: React.DragEvent, template: ComponentTemplate) => {
    event.dataTransfer.setData('component-type', template.type);
    event.dataTransfer.setData('component-label', template.label);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {categories.map((category) => {
          const categoryComponents = filteredComponents.filter((c) => c.category === category);

          return (
            <div key={category}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase">{category}</h3>
                <Badge variant="secondary" className="text-xs">
                  {categoryComponents.length}
                </Badge>
              </div>
              <div className="space-y-1">
                {categoryComponents.map((component) => (
                  <div
                    key={component.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, component)}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-move transition-colors"
                  >
                    {component.icon}
                    <span className="text-sm">{component.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
