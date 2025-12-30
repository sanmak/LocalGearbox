/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { useApiClientStore } from '@/lib/stores/api-client-store';
import { Button } from '@/components/ui/button';
import { History, LayoutGrid, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CookieManager } from './sidebar/CookieManager';

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const { activeSidebarView, setActiveSidebarView } = useApiClientStore();

  if (!isOpen) return null;

  const NavItem = ({
    icon: Icon,
    label,
    view,
  }: {
    icon: any;
    label: string;
    view?: 'history' | 'collections' | 'env' | 'saved';
  }) => (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => view && setActiveSidebarView(activeSidebarView === view ? null : view)}
      className={cn(
        'h-12 w-12 rounded-none border-l-2 border-transparent hover:bg-muted',
        activeSidebarView === view && 'border-primary bg-muted text-primary',
      )}
      title={label}
    >
      <Icon className="h-5 w-5" />
      <span className="sr-only">{label}</span>
    </Button>
  );

  return (
    <aside className="flex h-full w-14 flex-col border-r bg-card/50 z-20">
      <div className="flex flex-col items-center py-2">
        <NavItem icon={History} label="History" view="history" />
        <NavItem icon={FolderOpen} label="Collections" view="collections" />
        <NavItem icon={LayoutGrid} label="Environments" view="env" />
        <CookieManager />
      </div>
    </aside>
  );
}
