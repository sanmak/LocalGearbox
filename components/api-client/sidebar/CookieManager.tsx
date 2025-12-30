/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState } from 'react';
import { useApiClientStore } from '@/lib/stores/api-client-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Cookie as CookieIcon, ShieldCheck } from 'lucide-react';

export function CookieManager() {
  const { cookies, clearCookies } = useApiClientStore();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-muted-foreground hover:text-primary"
          title="Cookie Jar"
        >
          <CookieIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <CookieIcon className="h-5 w-5 text-primary" />
              Manage Cookies
            </DialogTitle>
            {cookies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCookies}
                className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                Clear All
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="h-[400px] mt-4 pr-4">
          <div className="space-y-3">
            {cookies.map((cookie, idx) => (
              <div
                key={`${cookie.domain}-${cookie.name}-${idx}`}
                className="p-3 border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold truncate flex-1">{cookie.name}</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    <ShieldCheck className="h-3 w-3" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      {cookie.domain}
                    </span>
                  </div>
                </div>
                <div className="text-xs font-mono break-all text-muted-foreground bg-muted/50 p-1.5 rounded mt-1 overflow-x-auto">
                  {cookie.value}
                </div>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                  <span>Path: {cookie.path}</span>
                </div>
              </div>
            ))}
            {cookies.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CookieIcon className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-sm">Your cookie jar is empty.</p>
                <p className="text-xs opacity-60">
                  Cookies will appear here when you receive them from APIs.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
