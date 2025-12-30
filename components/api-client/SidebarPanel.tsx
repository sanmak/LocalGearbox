/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useApiClientStore } from '@/lib/stores/api-client-store';
import { HistoryList } from './sidebar/HistoryList';
import { CollectionList } from './sidebar/CollectionList';
import { EnvironmentList } from './sidebar/EnvironmentList';

export function SidebarPanel() {
  const { activeSidebarView } = useApiClientStore();

  if (!activeSidebarView) return null;

  return (
    <div className="w-64 border-r bg-muted/10 h-full flex flex-col">
      {activeSidebarView === 'history' && <HistoryList />}
      {activeSidebarView === 'collections' && <CollectionList />}
      {activeSidebarView === 'env' && <EnvironmentList />}
    </div>
  );
}
