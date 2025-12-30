/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useApiClientStore } from '@/lib/stores/api-client-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeyValueTable } from './request/KeyValueTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AuthSelector } from './request/AuthSelector';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RequestSettings } from './request/RequestSettings';
import { RequestDocs } from './request/RequestDocs';
import { useState } from 'react';

export function RequestPanel() {
  const { getActiveTab, updateTabRequest } = useApiClientStore();
  const [activeTabValue, setActiveTabValue] = useState('params');
  const activeTab = getActiveTab();

  if (!activeTab) return null;

  return (
    <div className="flex h-full flex-col">
      <Tabs
        value={activeTabValue}
        onValueChange={setActiveTabValue}
        className="flex-1 flex flex-col w-full overflow-auto"
      >
        <div className="border-b px-2">
          <TabsList className="h-9 w-auto bg-transparent p-0">
            <TabsTrigger
              value="params"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 text-xs font-semibold text-muted-foreground shadow-none transition-all data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
            >
              Parameters
              {activeTab.request.params.filter((p) => p.key && p.enabled).length > 0 && (
                <span className="ml-2 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 text-[10px] leading-none">
                  {activeTab.request.params.filter((p) => p.key && p.enabled).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="headers"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 text-xs font-semibold text-muted-foreground shadow-none transition-all data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
            >
              Headers
              {activeTab.request.headers.filter((p) => p.key && p.enabled).length > 0 && (
                <span className="ml-2 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 text-[10px] leading-none">
                  {activeTab.request.headers.filter((p) => p.key && p.enabled).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="body"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 text-xs font-semibold text-muted-foreground shadow-none transition-all data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
            >
              Body
              {activeTab.request.body && activeTab.request.body.length > 5 && (
                <span className="ml-2 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="auth"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 text-xs font-semibold text-muted-foreground shadow-none transition-all data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
            >
              Auth
            </TabsTrigger>
            <TabsTrigger
              value="pre"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 text-xs font-semibold text-muted-foreground shadow-none transition-all data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
            >
              Pre-request
            </TabsTrigger>
            <TabsTrigger
              value="tests"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 text-xs font-semibold text-muted-foreground shadow-none transition-all data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
            >
              Tests
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 text-xs font-semibold text-muted-foreground shadow-none transition-all data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
            >
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="docs"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 text-xs font-semibold text-muted-foreground shadow-none transition-all data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
            >
              Docs
              {activeTab.request.description && activeTab.request.description.length > 0 && (
                <span className="ml-2 h-1.5 w-1.5 rounded-full bg-blue-400" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="params" className="flex-1 border-0 mt-0 overflow-hidden">
          {activeTabValue === 'params' && (
            <ScrollArea className="h-full w-full">
              <div className="p-4 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Query Parameters
                </p>
                <KeyValueTable
                  items={activeTab.request.params}
                  onChange={(items) => updateTabRequest(activeTab.id, { params: items })}
                />
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="headers" className="flex-1 border-0 mt-0 overflow-hidden">
          {activeTabValue === 'headers' && (
            <ScrollArea className="h-full w-full">
              <div className="p-4 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Request Headers
                </p>
                <KeyValueTable
                  items={activeTab.request.headers}
                  onChange={(items) => updateTabRequest(activeTab.id, { headers: items })}
                />
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="body" className="flex-1 border-0 mt-0 overflow-hidden h-full">
          {activeTabValue === 'body' && (
            <div className="flex flex-col h-full p-4">
              <div className="mb-3 flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mr-auto">
                  Body Type
                </p>
                <Select
                  value={activeTab.request.bodyType}
                  onValueChange={(v) => updateTabRequest(activeTab.id, { bodyType: v as any })}
                >
                  <SelectTrigger className="w-[180px] h-7 text-[10px] bg-muted/20 border-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">
                      None
                    </SelectItem>
                    <SelectItem value="json" className="text-xs">
                      JSON
                    </SelectItem>
                    <SelectItem value="form-data" className="text-xs">
                      Multipart Form
                    </SelectItem>
                    <SelectItem value="x-www-form-urlencoded" className="text-xs">
                      Form URL Encoded
                    </SelectItem>
                    <SelectItem value="raw" className="text-xs">
                      Raw Text
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-h-0">
                {activeTab.request.bodyType === 'json' && (
                  <Textarea
                    value={activeTab.request.body}
                    onChange={(e) => updateTabRequest(activeTab.id, { body: e.target.value })}
                    className="h-full font-mono text-xs resize-none bg-muted/5 focus-visible:ring-primary/20 p-4 border-muted"
                    placeholder="{}"
                  />
                )}

                {activeTab.request.bodyType === 'raw' && (
                  <Textarea
                    value={activeTab.request.body}
                    onChange={(e) => updateTabRequest(activeTab.id, { body: e.target.value })}
                    className="h-full font-mono text-xs resize-none bg-muted/5 focus-visible:ring-primary/20 p-4 border-muted"
                    placeholder="Raw text"
                  />
                )}

                {activeTab.request.bodyType === 'form-data' && (
                  <ScrollArea className="h-full w-full">
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                        Multipart Form Data (Text & Files)
                      </p>
                      <KeyValueTable
                        items={activeTab.request.bodyFormData || []}
                        onChange={(items) =>
                          updateTabRequest(activeTab.id, { bodyFormData: items })
                        }
                      />
                    </div>
                  </ScrollArea>
                )}

                {activeTab.request.bodyType === 'x-www-form-urlencoded' && (
                  <ScrollArea className="h-full w-full">
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                        URL Encoded Params
                      </p>
                      <KeyValueTable
                        items={activeTab.request.bodyFormUrlEncoded || []}
                        onChange={(items) =>
                          updateTabRequest(activeTab.id, {
                            bodyFormUrlEncoded: items,
                          })
                        }
                      />
                    </div>
                  </ScrollArea>
                )}

                {activeTab.request.bodyType === 'none' && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 text-[10px] uppercase font-bold tracking-widest bg-muted/5 rounded-lg border border-dashed">
                    No body content
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="auth" className="flex-1 border-0 mt-0 overflow-hidden">
          {activeTabValue === 'auth' && (
            <ScrollArea className="h-full w-full">
              <div className="p-4 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Authorization
                </p>
                <AuthSelector />
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="pre" className="flex-1 border-0 mt-0 overflow-hidden">
          {activeTabValue === 'pre' && (
            <div className="flex flex-col h-full p-4">
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Pre-request Script
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1 italic">
                  Run scripts before the request. Use <code>pm.environment.set()</code> to set
                  variables.
                </p>
              </div>
              <div className="flex-1 min-h-0">
                <Textarea
                  value={activeTab.request.preRequestScript || ''}
                  onChange={(e) =>
                    updateTabRequest(activeTab.id, {
                      preRequestScript: e.target.value,
                    })
                  }
                  className="h-full font-mono text-xs resize-none bg-muted/5 focus-visible:ring-primary/20 p-4 border-muted"
                  placeholder="// Example: pm.environment.set('timestamp', Date.now());"
                />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tests" className="flex-1 border-0 mt-0 overflow-hidden">
          {activeTabValue === 'tests' && (
            <div className="flex flex-col h-full p-4">
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Tests Script
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1 italic">
                  Assert results after the request. Use <code>pm.test()</code> to define assertions.
                </p>
              </div>
              <div className="flex-1 min-h-0">
                <Textarea
                  value={activeTab.request.testScript || ''}
                  onChange={(e) => updateTabRequest(activeTab.id, { testScript: e.target.value })}
                  className="h-full font-mono text-xs resize-none bg-muted/5 focus-visible:ring-primary/20 p-4 border-muted"
                  placeholder="// Example: pm.test('Status is 200', () => { pm.expect(pm.response.code).to.equal(200); });"
                />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="flex-1 border-0 mt-0 overflow-hidden">
          {activeTabValue === 'settings' && (
            <ScrollArea className="h-full w-full">
              <div className="p-4 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Request Settings
                </p>
                <RequestSettings />
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="docs" className="flex-1 border-0 mt-0 overflow-hidden">
          {activeTabValue === 'docs' && (
            <ScrollArea className="h-full w-full">
              <div className="p-4 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Documentation
                </p>
                <RequestDocs />
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
