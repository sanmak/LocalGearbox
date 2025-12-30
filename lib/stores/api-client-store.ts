/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// In-memory cache for file objects (not persisted)
export const fileMap = new Map<string, File>();

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface KeyValueParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  type?: 'text' | 'file';
  fileName?: string;
}

export interface AuthConfig {
  type: 'none' | 'bearer' | 'basic' | 'apikey' | 'oauth2' | 'inherit';
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  apiKey?: string;
  apiValue?: string;
  apiLocation?: 'header' | 'query';
  oauth2?: {
    grantType: 'client_credentials' | 'authorization_code';
    accessTokenUrl: string;
    clientId: string;
    clientSecret: string;
    scope: string;
    accessToken?: string;
  };
}

export interface RequestSettings {
  timeout: number;
  followRedirects: boolean;
  sslVerification: boolean;
}

export interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  message?: string;
}

export interface ApiRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValueParam[];
  headers: KeyValueParam[];
  auth: AuthConfig;
  bodyType: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw';
  body: string;
  bodyFormData: KeyValueParam[];
  bodyFormUrlEncoded: KeyValueParam[];
  preRequestScript?: string;
  testScript?: string;
  description?: string;
  settings?: RequestSettings;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  time: number;
  size: number;
  headers: Record<string, string>;
  data: any;
  loading: boolean;
  isBase64?: boolean;
  error?: string;
  errorType?: 'CORS' | 'NETWORK' | 'TIMEOUT' | 'UNKNOWN';
  errorUrl?: string;
  testResults?: TestResult[];
}

export interface Tab {
  id: string;
  title: string;
  request: ApiRequest;
  response?: ApiResponse;
  isDirty?: boolean;
  collectionId?: string;
}

export interface Collection {
  id: string;
  name: string;
  requests: ApiRequest[];
  folders?: Collection[];
  auth?: AuthConfig;
  description?: string;
}

export interface HistoryItem {
  id: string;
  request: ApiRequest;
  timestamp: number;
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
}

interface ApiClientState {
  tabs: Tab[];
  activeTabId: string | null;
  sidebarOpen: boolean;
  history: HistoryItem[];
  collections: Collection[];
  environments: Environment[];
  activeEnvironmentId: string | null;
  activeSidebarView: 'history' | 'collections' | 'env' | 'saved' | null;
  cookies: Cookie[];

  // Actions
  addTab: (_request?: ApiRequest) => void;
  closeTab: (_id: string) => void;
  setActiveTab: (_id: string) => void;
  updateTabRequest: (_tabId: string, _updates: Partial<ApiRequest>) => void;
  updateTabResponse: (_tabId: string, _response: ApiResponse) => void;
  duplicateTab: (_id: string) => void;
  closeOtherTabs: (_id: string) => void;
  renameTab: (_id: string, _title: string) => void;
  setSidebarOpen: (open: boolean) => void;

  // History Actions
  addToHistory: (_request: ApiRequest) => void;
  clearHistory: () => void;

  // Collection Actions
  createCollection: (_name: string) => void;
  addToCollection: (_collectionId: string, _request: ApiRequest) => void;
  deleteCollection: (_id: string) => void;
  updateCollectionAuth: (_id: string, _auth: AuthConfig) => void;
  importCollection: (_data: string) => void;
  exportCollection: (_id: string) => void;
  duplicateRequest: (_requestId: string, _collectionId?: string) => void;

  // Cookie Actions
  updateCookies: (_setCookieHeaders: string[], _domain: string) => void;
  clearCookies: () => void;

  // Environment Actions
  createEnvironment: (_name: string) => void;
  updateEnvironment: (_id: string, _updates: Partial<Environment>) => void;
  deleteEnvironment: (_id: string) => void;
  setActiveEnvironment: (_id: string | null) => void;

  // Sidebar Actions
  setActiveSidebarView: (_view: 'history' | 'collections' | 'env' | 'saved' | null) => void;

  // Helpers
  getActiveTab: () => Tab | undefined;
  getActiveEnvironment: () => Environment | undefined;
  resolveAuth: (requestId: string) => AuthConfig;
}

const DEFAULT_SETTINGS: RequestSettings = {
  timeout: 0,
  followRedirects: true,
  sslVerification: true,
};

const DEFAULT_AUTH: AuthConfig = {
  type: 'none',
  bearerToken: '',
  basicUsername: '',
  basicPassword: '',
  apiKey: '',
  apiValue: '',
  apiLocation: 'header',
  oauth2: {
    grantType: 'client_credentials',
    accessTokenUrl: '',
    clientId: '',
    clientSecret: '',
    scope: '',
    accessToken: '',
  },
};

const DEFAULT_REQUEST: ApiRequest = {
  id: '',
  name: 'Untitled Request',
  method: 'GET',
  url: 'https://jsonplaceholder.typicode.com/todos/1',
  params: [{ id: '1', key: '', value: '', enabled: true }],
  headers: [{ id: '1', key: '', value: '', enabled: true }],
  auth: DEFAULT_AUTH,
  bodyType: 'json',
  body: '{\n  \n}',
  bodyFormData: [{ id: '1', key: '', value: '', enabled: true }],
  bodyFormUrlEncoded: [{ id: '1', key: '', value: '', enabled: true }],
  preRequestScript: '',
  testScript: '',
  description: '',
  settings: DEFAULT_SETTINGS,
};

export const useApiClientStore = create<ApiClientState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      sidebarOpen: true,
      history: [],
      collections: [],
      environments: [],
      activeEnvironmentId: null,
      activeSidebarView: 'history',
      cookies: [],

      addTab: (request) => {
        const newTab: Tab = {
          id: uuidv4(),
          title: request?.name || 'Untitled Request',
          request: request ? { ...request, id: uuidv4() } : { ...DEFAULT_REQUEST, id: uuidv4() },
        };

        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
        }));
      },

      closeTab: (id) => {
        set((state) => {
          const newTabs = state.tabs.filter((t) => t.id !== id);
          let newActiveId = state.activeTabId;

          if (id === state.activeTabId) {
            newActiveId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
          }

          return { tabs: newTabs, activeTabId: newActiveId };
        });
      },

      setActiveTab: (id) => set({ activeTabId: id }),

      updateTabRequest: (tabId, updates) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId
              ? { ...tab, request: { ...tab.request, ...updates }, isDirty: true }
              : tab,
          ),
        }));
      },

      updateTabResponse: (tabId, response) => {
        set((state) => ({
          tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, response } : tab)),
        }));
      },

      duplicateTab: (id) => {
        set((state) => {
          const tabToDuplicate = state.tabs.find((t) => t.id === id);
          if (!tabToDuplicate) return state;

          const newTab: Tab = {
            ...tabToDuplicate,
            id: uuidv4(),
            title: `${tabToDuplicate.title} (Copy)`,
            request: {
              ...tabToDuplicate.request,
              id: uuidv4(),
              name: `${tabToDuplicate.request.name} (Copy)`,
            },
            isDirty: true,
          };

          return {
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id,
          };
        });
      },

      closeOtherTabs: (id) => {
        set((state) => {
          const tabToKeep = state.tabs.find((t) => t.id === id);
          if (!tabToKeep) return state;
          return {
            tabs: [tabToKeep],
            activeTabId: id,
          };
        });
      },

      renameTab: (id, title) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === id ? { ...tab, title, request: { ...tab.request, name: title } } : tab,
          ),
        }));
      },

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      addToHistory: (request) => {
        set((state) => {
          const history = state.history;
          if (history.length > 0) {
            const last = history[0].request;
            if (
              last.method === request.method &&
              last.url === request.url &&
              last.body === request.body
            ) {
              return { history };
            }
          }

          return {
            history: [
              { id: uuidv4(), request: { ...request }, timestamp: Date.now() },
              ...state.history,
            ].slice(0, 50),
          };
        });
      },

      clearHistory: () => set({ history: [] }),

      createCollection: (name) => {
        set((state) => ({
          collections: [...state.collections, { id: uuidv4(), name, requests: [] }],
        }));
      },

      addToCollection: (collectionId, request) => {
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId
              ? {
                  ...c,
                  requests: [
                    ...c.requests,
                    { ...request, id: uuidv4(), name: request.name || 'Saved Request' },
                  ],
                }
              : c,
          ),
        }));
      },

      deleteCollection: (id) => {
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== id),
        }));
      },

      updateCollectionAuth: (id, auth) => {
        set((state) => ({
          collections: state.collections.map((c) => (c.id === id ? { ...c, auth } : c)),
        }));
      },

      importCollection: (data) => {
        try {
          const parsed = JSON.parse(data);
          // Simple validation
          if (!parsed.name || !Array.isArray(parsed.requests)) return;

          set((state) => ({
            collections: [
              ...state.collections,
              {
                ...parsed,
                id: uuidv4(),
                requests: parsed.requests.map((r: any) => ({ ...r, id: uuidv4() })),
              },
            ],
          }));
        } catch (e) {
          console.error('Import failed', e);
        }
      },

      exportCollection: (id) => {
        const state = get();
        const collection = state.collections.find((c) => c.id === id);
        if (!collection) return;

        const dataStr = JSON.stringify(collection, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `${collection.name.replace(/\s+/g, '_')}_collection.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      },

      duplicateRequest: (requestId) => {
        set((state) => {
          const newCollections = [...state.collections];
          let targetRequest: ApiRequest | undefined;
          let targetCollIdx = -1;

          // Find the request and its collection
          newCollections.forEach((coll, idx) => {
            const req = coll.requests.find((r) => r.id === requestId);
            if (req) {
              targetRequest = req;
              targetCollIdx = idx;
            }
          });

          if (targetRequest && targetCollIdx !== -1) {
            const duplicated = {
              ...targetRequest,
              id: uuidv4(),
              name: `${targetRequest.name} (Copy)`,
            };
            newCollections[targetCollIdx] = {
              ...newCollections[targetCollIdx],
              requests: [...newCollections[targetCollIdx].requests, duplicated],
            };
          }

          return { collections: newCollections };
        });
      },

      updateCookies: (setCookieHeaders, domain) => {
        set((state) => {
          const newCookies = [...state.cookies];
          setCookieHeaders.forEach((header) => {
            const parts = header.split(';').map((p) => p.trim());
            const [nameValue, ...rest] = parts;
            const [name, value] = nameValue.split('=');
            if (!name) return;

            // Find domain/path in rest
            let cookieDomain = domain;
            let cookiePath = '/';
            rest.forEach((r) => {
              if (r.toLowerCase().startsWith('domain=')) cookieDomain = r.split('=')[1];
              if (r.toLowerCase().startsWith('path=')) cookiePath = r.split('=')[1];
            });

            // Update existing or add new
            const idx = newCookies.findIndex((c) => c.name === name && c.domain === cookieDomain);
            if (idx > -1) {
              newCookies[idx] = { ...newCookies[idx], value };
            } else {
              newCookies.push({ name, value, domain: cookieDomain, path: cookiePath });
            }
          });
          return { cookies: newCookies };
        });
      },

      clearCookies: () => set({ cookies: [] }),

      createEnvironment: (name) => {
        set((state) => ({
          environments: [...state.environments, { id: uuidv4(), name, variables: [] }],
        }));
      },

      updateEnvironment: (id, updates) => {
        set((state) => ({
          environments: state.environments.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        }));
      },

      deleteEnvironment: (id) => {
        set((state) => ({
          environments: state.environments.filter((e) => e.id !== id),
          activeEnvironmentId: state.activeEnvironmentId === id ? null : state.activeEnvironmentId,
        }));
      },

      setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),

      setActiveSidebarView: (view) => set({ activeSidebarView: view }),

      getActiveTab: () => {
        const state = get();
        return state.tabs.find((t) => t.id === state.activeTabId);
      },

      getActiveEnvironment: () => {
        const state = get();
        return state.environments.find((e) => e.id === state.activeEnvironmentId);
      },

      resolveAuth: (requestId: string) => {
        const state = get();
        const tab = state.tabs.find((t) => t.id === requestId);
        if (!tab) return { type: 'none' };

        let auth = tab.request.auth || { type: 'none' };
        if (auth.type !== 'inherit') return auth;

        if (tab.collectionId) {
          const collection = state.collections.find((c) => c.id === tab.collectionId);
          if (collection && collection.auth && collection.auth.type !== 'none') {
            return collection.auth;
          }
        }

        return { type: 'none' };
      },
    }),
    {
      name: 'api-client-storage',
      skipHydration: true,
    },
  ),
);
