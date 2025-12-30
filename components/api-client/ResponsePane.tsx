/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useApiClientStore } from '@/lib/stores/api-client-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Loader2, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CorsErrorPanel } from '@/components/errors/CorsErrorPanel';

export function ResponsePane() {
  const { getActiveTab } = useApiClientStore();
  const activeTab = getActiveTab();
  const response = activeTab?.response;

  if (!activeTab) return null;

  if (!response) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground bg-muted/10">
        <Zap className="h-12 w-12 mb-4 opacity-20" />
        <p>Enter a URL and click Send to get a response</p>
      </div>
    );
  }

  if (response.loading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-muted/10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isSuccess = response.status >= 200 && response.status < 300;
  const passedTests = response.testResults?.filter((t) => t.status === 'pass').length || 0;
  const totalTests = response.testResults?.length || 0;

  return (
    <div className="flex h-full flex-col bg-card h-full">
      <div className="flex items-center gap-4 border-b bg-card px-4 py-2 text-sm shadow-sm justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <span className={cn('font-medium', isSuccess ? 'text-green-500' : 'text-red-500')}>
              {response.status} {response.statusText}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Time:</span>
            <span className="font-medium text-foreground">{response.time}ms</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Size:</span>
            <span className="font-medium text-foreground">
              {(response.size / 1024).toFixed(2)} KB
            </span>
          </div>
        </div>
        {totalTests > 0 && (
          <div className="flex items-center gap-2 text-xs">
            Tests:{' '}
            <span
              className={
                passedTests === totalTests ? 'text-green-500 font-bold' : 'text-red-500 font-bold'
              }
            >
              {passedTests}/{totalTests}
            </span>
          </div>
        )}
      </div>

      {response.error ? (
        <div className="h-full w-full p-4 bg-muted/10 overflow-auto">
          {response.errorType === 'CORS' ? (
            <CorsErrorPanel url={response.errorUrl || activeTab.request.url} />
          ) : (
            <>
              <div className="text-red-500 font-semibold mb-2">Error</div>
              <div className="text-sm border border-red-200 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                {response.error}
              </div>
            </>
          )}
        </div>
      ) : (
        <Tabs defaultValue="body" className="flex-1 flex flex-col min-h-0">
          <div className="px-2 border-b bg-muted/10">
            <TabsList className="h-9 w-auto bg-transparent p-0">
              <TabsTrigger
                value="body"
                className="h-9 rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary text-xs"
              >
                Body
              </TabsTrigger>
              <TabsTrigger
                value="headers"
                className="h-9 rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary text-xs"
              >
                Headers
              </TabsTrigger>
              {totalTests > 0 && (
                <TabsTrigger
                  value="tests"
                  className="h-9 rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary text-xs"
                >
                  Test Results
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="body" className="flex-1 p-0 m-0 min-h-0 relative">
            <ScrollArea className="h-full w-full">
              <div className="p-4">
                {response.isBase64 && response.headers['content-type']?.startsWith('image/') ? (
                  <div className="flex justify-center bg-muted/20 p-8 rounded-lg overflow-auto">
                    <img
                      src={`data:${response.headers['content-type']};base64,${response.data}`}
                      alt="Response Preview"
                      className="max-w-full h-auto shadow-lg"
                    />
                  </div>
                ) : response.headers['content-type']?.includes('text/html') ? (
                  <div className="border rounded-lg bg-white overflow-hidden h-[500px]">
                    <iframe
                      srcDoc={
                        typeof response.data === 'string'
                          ? response.data
                          : JSON.stringify(response.data)
                      }
                      className="w-full h-full border-0"
                      sandbox="allow-scripts"
                    />
                  </div>
                ) : (
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground/90">
                    {typeof response.data === 'string'
                      ? response.data
                      : JSON.stringify(response.data, null, 2)}
                  </pre>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="headers" className="flex-1 p-0 m-0 min-h-0">
            <ScrollArea className="h-full w-full">
              <div className="p-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                {Object.entries(response.headers).map(([k, v]) => (
                  <div key={k} className="contents">
                    <span className="font-semibold text-muted-foreground text-right text-xs">
                      {k}:
                    </span>
                    <span className="font-mono text-xs">{v}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tests" className="flex-1 p-0 m-0 min-h-0">
            <ScrollArea className="h-full w-full">
              <div className="flex flex-col p-4 gap-2">
                {response.testResults?.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded bg-card/50">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        t.status === 'pass' ? 'bg-green-500' : 'bg-red-500',
                      )}
                    />
                    <span
                      className={cn(
                        'font-medium text-sm',
                        t.status === 'pass' ? 'text-green-600' : 'text-red-600',
                      )}
                    >
                      {t.status === 'pass' ? 'PASS' : 'FAIL'}
                    </span>
                    <span className="font-medium text-sm flex-1">{t.name}</span>
                  </div>
                ))}
                {response.testResults?.map(
                  (t, i) =>
                    t.message && (
                      <div
                        key={`err-${i}`}
                        className="ml-6 text-xs text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded"
                      >
                        {t.message}
                      </div>
                    ),
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
