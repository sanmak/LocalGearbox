/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState } from 'react';
import { useApiClientStore, AuthConfig, Collection } from '@/lib/stores/api-client-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface CollectionAuthDialogProps {
  collection: Collection;
}

export function CollectionAuthDialog({ collection }: CollectionAuthDialogProps) {
  const { updateCollectionAuth } = useApiClientStore();
  const [open, setOpen] = useState(false);
  const auth = collection.auth || { type: 'none' };

  const updateAuth = (updates: Partial<AuthConfig>) => {
    // We need a way to update collection auth in store
    updateCollectionAuth(collection.id, { ...auth, ...updates });
  };

  // OAuth2 token fetching removed - users should obtain tokens via their OAuth provider's flow
  // and paste them here. Automated token fetching would require server-side proxy which
  // contradicts our 100% client-side architecture.

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 hover:text-primary"
          aria-label="Configure collection authentication"
        >
          <Shield className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Collection Authentication: {collection.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label>Auth Type</Label>
            <Select value={auth.type} onValueChange={(v) => updateAuth({ type: v as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
                <SelectItem value="apikey">API Key</SelectItem>
                <SelectItem value="oauth2">OAuth 2.0</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {auth.type === 'bearer' && (
            <div className="flex flex-col gap-2">
              <Label>Token</Label>
              <Input
                value={auth.bearerToken || ''}
                onChange={(e) => updateAuth({ bearerToken: e.target.value })}
                type="password"
              />
            </div>
          )}

          {auth.type === 'oauth2' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Access Token URL</Label>
                <Input
                  value={auth.oauth2?.accessTokenUrl || ''}
                  onChange={(e) =>
                    updateAuth({ oauth2: { ...auth.oauth2!, accessTokenUrl: e.target.value } })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-2">
                  <Label>Client ID</Label>
                  <Input
                    value={auth.oauth2?.clientId || ''}
                    onChange={(e) =>
                      updateAuth({ oauth2: { ...auth.oauth2!, clientId: e.target.value } })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Client Secret</Label>
                  <Input
                    value={auth.oauth2?.clientSecret || ''}
                    onChange={(e) =>
                      updateAuth({ oauth2: { ...auth.oauth2!, clientSecret: e.target.value } })
                    }
                    type="password"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Access Token</Label>
                <Input
                  value={auth.oauth2?.accessToken || ''}
                  onChange={(e) =>
                    updateAuth({ oauth2: { ...auth.oauth2!, accessToken: e.target.value } })
                  }
                  type="password"
                  placeholder="Paste your OAuth2 access token here"
                />
                <p className="text-xs text-muted-foreground">
                  Obtain your token from your OAuth provider and paste it here.
                </p>
              </div>
            </div>
          )}

          {/* API Key UI similar to above... omitted for brevity or implemented briefly */}
          {auth.type === 'apikey' && (
            <div className="flex flex-col gap-2">
              <Label>Key</Label>
              <Input
                value={auth.apiKey || ''}
                onChange={(e) => updateAuth({ apiKey: e.target.value })}
              />
              <Label>Value</Label>
              <Input
                value={auth.apiValue || ''}
                onChange={(e) => updateAuth({ apiValue: e.target.value })}
                type="password"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
