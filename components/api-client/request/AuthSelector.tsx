/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useApiClientStore, AuthConfig } from '@/lib/stores/api-client-store';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function AuthSelector() {
  const { getActiveTab, updateTabRequest } = useApiClientStore();
  const activeTab = getActiveTab();

  if (!activeTab) return null;

  const auth = activeTab.request.auth || { type: 'none' };

  const updateAuth = (updates: Partial<AuthConfig>) => {
    updateTabRequest(activeTab.id, { auth: { ...auth, ...updates } });
  };

  // OAuth2 token fetching removed - users should obtain tokens via their OAuth provider's flow
  // and paste them here. Automated token fetching would require server-side proxy which
  // contradicts our 100% client-side architecture.

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl">
      <div className="flex flex-col gap-2">
        <Label>Authentication Type</Label>
        <Select value={auth.type} onValueChange={(v) => updateAuth({ type: v as any })}>
          <SelectTrigger className="w-[300px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="inherit">Inherit from parent</SelectItem>
            <SelectItem value="bearer">Bearer Token</SelectItem>
            <SelectItem value="basic">Basic Auth</SelectItem>
            <SelectItem value="apikey">API Key</SelectItem>
            <SelectItem value="oauth2">OAuth 2.0</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {auth.type === 'inherit' && (
        <div className="flex flex-col gap-2 p-4 border rounded bg-muted/20">
          <p className="text-sm text-muted-foreground italic">
            Request will use authentication settings from the parent collection.
          </p>
        </div>
      )}

      {auth.type === 'oauth2' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Grant Type</Label>
            <Select
              value={auth.oauth2?.grantType || 'client_credentials'}
              onValueChange={(v) =>
                updateAuth({ oauth2: { ...auth.oauth2!, grantType: v as any } })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client_credentials">Client Credentials</SelectItem>
                <SelectItem value="authorization_code">Authorization Code</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Access Token URL</Label>
              <Input
                value={auth.oauth2?.accessTokenUrl || ''}
                onChange={(e) =>
                  updateAuth({ oauth2: { ...auth.oauth2!, accessTokenUrl: e.target.value } })
                }
                placeholder="https://auth.com/token"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Client ID</Label>
              <Input
                value={auth.oauth2?.clientId || ''}
                onChange={(e) =>
                  updateAuth({ oauth2: { ...auth.oauth2!, clientId: e.target.value } })
                }
                placeholder="Client ID"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Client Secret</Label>
              <Input
                value={auth.oauth2?.clientSecret || ''}
                onChange={(e) =>
                  updateAuth({ oauth2: { ...auth.oauth2!, clientSecret: e.target.value } })
                }
                placeholder="Client Secret"
                type="password"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Scope</Label>
            <Input
              value={auth.oauth2?.scope || ''}
              onChange={(e) => updateAuth({ oauth2: { ...auth.oauth2!, scope: e.target.value } })}
              placeholder="e.g. read write"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t mt-2">
            <Label>Access Token</Label>
            <Input
              value={auth.oauth2?.accessToken || ''}
              onChange={(e) =>
                updateAuth({ oauth2: { ...auth.oauth2!, accessToken: e.target.value } })
              }
              placeholder="Paste your OAuth2 access token here"
              className="font-mono text-xs"
              type="password"
            />
            <p className="text-xs text-muted-foreground">
              Obtain your token from your OAuth provider and paste it here.
            </p>
          </div>
        </div>
      )}

      {auth.type === 'bearer' && (
        <div className="flex flex-col gap-2">
          <Label>Token</Label>
          <Input
            value={auth.bearerToken || ''}
            onChange={(e) => updateAuth({ bearerToken: e.target.value })}
            placeholder="Enter Bearer Token"
            type="password"
          />
        </div>
      )}

      {auth.type === 'basic' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Username</Label>
            <Input
              value={auth.basicUsername || ''}
              onChange={(e) => updateAuth({ basicUsername: e.target.value })}
              placeholder="Username"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Password</Label>
            <Input
              value={auth.basicPassword || ''}
              onChange={(e) => updateAuth({ basicPassword: e.target.value })}
              placeholder="Password"
              type="password"
            />
          </div>
        </div>
      )}

      {auth.type === 'apikey' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Key</Label>
            <Input
              value={auth.apiKey || ''}
              onChange={(e) => updateAuth({ apiKey: e.target.value })}
              placeholder="Key (e.g. X-API-KEY)"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Value</Label>
            <Input
              value={auth.apiValue || ''}
              onChange={(e) => updateAuth({ apiValue: e.target.value })}
              placeholder="Value"
              type="password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Add To</Label>
            <Select
              value={auth.apiLocation || 'header'}
              onValueChange={(v) => updateAuth({ apiLocation: v as any })}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="query">Query Params</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
