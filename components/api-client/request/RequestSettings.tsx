/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useApiClientStore } from '@/lib/stores/api-client-store';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Shield, ArrowRightLeft, Clock } from 'lucide-react';

export function RequestSettings() {
  const { activeTabId, tabs, updateTabRequest } = useApiClientStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (!activeTab) return null;

  const settings = activeTab.request.settings || {
    timeout: 0,
    followRedirects: true,
    sslVerification: true,
  };

  const updateSettings = (updates: Partial<typeof settings>) => {
    updateTabRequest(activeTab.id, {
      settings: { ...settings, ...updates },
    });
  };

  return (
    <div className="p-6 space-y-8 max-w-2xl">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Request Settings</h3>
        <p className="text-xs text-muted-foreground">
          Configure behavior for this specific request.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">SSL Certificate Verification</Label>
              <p className="text-xs text-muted-foreground">
                Verify SSL certificates for HTTPS requests. Disable to allow self-signed
                certificates.
              </p>
            </div>
          </div>
          <Switch
            checked={settings.sslVerification}
            onCheckedChange={(val: boolean) => updateSettings({ sslVerification: val })}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
          <div className="flex gap-3">
            <ArrowRightLeft className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Follow Redirects</Label>
              <p className="text-xs text-muted-foreground">
                Automatically follow HTTP 3xx responses.
              </p>
            </div>
          </div>
          <Switch
            checked={settings.followRedirects}
            onCheckedChange={(val: boolean) => updateSettings({ followRedirects: val })}
          />
        </div>

        <div className="p-4 rounded-lg border bg-muted/20">
          <div className="flex gap-3 mb-4">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Request Timeout</Label>
              <p className="text-xs text-muted-foreground">
                Set connection timeout in milliseconds (0 for no timeout).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={settings.timeout}
              onChange={(e) => updateSettings({ timeout: parseInt(e.target.value) || 0 })}
              className="w-32 h-9 text-sm"
              placeholder="e.g. 5000"
            />
            <span className="text-xs text-muted-foreground font-mono">ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
