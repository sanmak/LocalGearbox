/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState, useEffect } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Sidebar } from '@/components/api-client/Sidebar';
import { SidebarPanel } from '@/components/api-client/SidebarPanel';
import { RequestTabs } from '@/components/api-client/RequestTabs';
import { IntegratedURLBar } from '@/components/api-client/IntegratedURLBar';
import { ResponsePane } from '@/components/api-client/ResponsePane';
import { RequestPanel } from '@/components/api-client/RequestPanel';
import { useApiClientStore } from '@/lib/stores/api-client-store';

export default function ApiClientPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { sidebarOpen } = useApiClientStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null; // Avoid hydration mismatch with resizable panels

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
      {/* Top Header / Nav could go here if needed, but Hoppscotch keeps it minimal */}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} />
        <SidebarPanel />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0">
          <RequestTabs />
          <div className="border-b" /> {/* Separator */}
          <IntegratedURLBar />
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            <ResizablePanel defaultSize={50} minSize={20}>
              <RequestPanel />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={50} minSize={20}>
              <ResponsePane />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}
