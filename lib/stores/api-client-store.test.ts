/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useApiClientStore } from './api-client-store';
import type { ApiRequest, AuthConfig } from './api-client-store';

describe('useApiClientStore', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset the store to initial state
    useApiClientStore.setState({
      tabs: [],
      activeTabId: null,
      sidebarOpen: true,
      history: [],
      collections: [],
      environments: [],
      activeEnvironmentId: null,
      activeSidebarView: 'history',
      cookies: [],
    });
  });

  describe('Tab Management', () => {
    it('should add a new tab', () => {
      const { addTab } = useApiClientStore.getState();
      addTab();
      expect(useApiClientStore.getState().tabs).toHaveLength(1);
      expect(useApiClientStore.getState().tabs[0].title).toBe('Untitled Request');
    });

    it('should add a tab with custom request', () => {
      const { addTab } = useApiClientStore.getState();
      const customRequest: Partial<ApiRequest> = {
        name: 'Custom Request',
        method: 'POST',
        url: 'https://api.example.com/data',
      };
      addTab(customRequest as ApiRequest);
      const state = useApiClientStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0].title).toBe('Custom Request');
      expect(state.tabs[0].request.method).toBe('POST');
    });

    it('should set active tab when adding', () => {
      const { addTab } = useApiClientStore.getState();
      addTab();
      const state = useApiClientStore.getState();
      expect(state.activeTabId).toBe(state.tabs[0].id);
    });

    it('should close a tab', () => {
      const { addTab, closeTab } = useApiClientStore.getState();
      addTab();
      const tabId = useApiClientStore.getState().tabs[0].id;
      closeTab(tabId);
      expect(useApiClientStore.getState().tabs).toHaveLength(0);
    });

    it('should update active tab when closing active tab', () => {
      const { addTab, closeTab } = useApiClientStore.getState();
      addTab();
      addTab();
      const state = useApiClientStore.getState();
      const firstTabId = state.tabs[0].id;
      const secondTabId = state.tabs[1].id;

      closeTab(secondTabId);
      expect(useApiClientStore.getState().activeTabId).toBe(firstTabId);
    });

    it('should duplicate a tab', () => {
      const { addTab, duplicateTab } = useApiClientStore.getState();
      addTab();
      const tabId = useApiClientStore.getState().tabs[0].id;
      duplicateTab(tabId);

      const state = useApiClientStore.getState();
      expect(state.tabs).toHaveLength(2);
      expect(state.tabs[1].title).toContain('(Copy)');
    });

    it('should close other tabs', () => {
      const { addTab, closeOtherTabs } = useApiClientStore.getState();
      addTab();
      addTab();
      addTab();
      const tabId = useApiClientStore.getState().tabs[1].id;
      closeOtherTabs(tabId);

      const state = useApiClientStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0].id).toBe(tabId);
    });

    it('should rename a tab', () => {
      const { addTab, renameTab } = useApiClientStore.getState();
      addTab();
      const tabId = useApiClientStore.getState().tabs[0].id;
      renameTab(tabId, 'New Name');

      const state = useApiClientStore.getState();
      expect(state.tabs[0].title).toBe('New Name');
      expect(state.tabs[0].request.name).toBe('New Name');
    });

    it('should update tab request', () => {
      const { addTab, updateTabRequest } = useApiClientStore.getState();
      addTab();
      const tabId = useApiClientStore.getState().tabs[0].id;
      updateTabRequest(tabId, { url: 'https://new-url.com', method: 'POST' });

      const state = useApiClientStore.getState();
      expect(state.tabs[0].request.url).toBe('https://new-url.com');
      expect(state.tabs[0].request.method).toBe('POST');
      expect(state.tabs[0].isDirty).toBe(true);
    });

    it('should update tab response', () => {
      const { addTab, updateTabResponse } = useApiClientStore.getState();
      addTab();
      const tabId = useApiClientStore.getState().tabs[0].id;
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        time: 123,
        size: 456,
        headers: {},
        data: { foo: 'bar' },
        loading: false,
      };
      updateTabResponse(tabId, mockResponse);

      const state = useApiClientStore.getState();
      expect(state.tabs[0].response).toEqual(mockResponse);
    });
  });

  describe('History Management', () => {
    it('should add request to history', () => {
      const { addToHistory } = useApiClientStore.getState();
      const mockRequest: Partial<ApiRequest> = {
        id: '1',
        name: 'Test',
        method: 'GET',
        url: 'https://api.example.com',
        body: '',
      };
      addToHistory(mockRequest as ApiRequest);

      const state = useApiClientStore.getState();
      expect(state.history).toHaveLength(1);
      expect(state.history[0].request.url).toBe('https://api.example.com');
    });

    it('should not add duplicate consecutive requests', () => {
      const { addToHistory } = useApiClientStore.getState();
      const mockRequest: Partial<ApiRequest> = {
        id: '1',
        name: 'Test',
        method: 'GET',
        url: 'https://api.example.com',
        body: '',
      };
      addToHistory(mockRequest as ApiRequest);
      addToHistory(mockRequest as ApiRequest);

      expect(useApiClientStore.getState().history).toHaveLength(1);
    });

    it('should limit history to 50 items', () => {
      const { addToHistory } = useApiClientStore.getState();
      for (let i = 0; i < 60; i++) {
        const mockRequest: Partial<ApiRequest> = {
          id: `${i}`,
          name: 'Test',
          method: 'GET',
          url: `https://api.example.com/${i}`,
          body: '',
        };
        addToHistory(mockRequest as ApiRequest);
      }

      expect(useApiClientStore.getState().history).toHaveLength(50);
    });

    it('should clear history', () => {
      const { addToHistory, clearHistory } = useApiClientStore.getState();
      const mockRequest: Partial<ApiRequest> = {
        id: '1',
        name: 'Test',
        method: 'GET',
        url: 'https://api.example.com',
        body: '',
      };
      addToHistory(mockRequest as ApiRequest);
      clearHistory();

      expect(useApiClientStore.getState().history).toHaveLength(0);
    });
  });

  describe('Collection Management', () => {
    it('should create a collection', () => {
      const { createCollection } = useApiClientStore.getState();
      createCollection('My Collection');

      const state = useApiClientStore.getState();
      expect(state.collections).toHaveLength(1);
      expect(state.collections[0].name).toBe('My Collection');
    });

    it('should add request to collection', () => {
      const { createCollection, addToCollection } = useApiClientStore.getState();
      createCollection('My Collection');
      const collectionId = useApiClientStore.getState().collections[0].id;

      const mockRequest: Partial<ApiRequest> = {
        name: 'Test Request',
        method: 'GET',
        url: 'https://api.example.com',
      };
      addToCollection(collectionId, mockRequest as ApiRequest);

      const state = useApiClientStore.getState();
      expect(state.collections[0].requests).toHaveLength(1);
      expect(state.collections[0].requests[0].name).toBe('Test Request');
    });

    it('should delete a collection', () => {
      const { createCollection, deleteCollection } = useApiClientStore.getState();
      createCollection('My Collection');
      const collectionId = useApiClientStore.getState().collections[0].id;
      deleteCollection(collectionId);

      expect(useApiClientStore.getState().collections).toHaveLength(0);
    });

    it('should update collection auth', () => {
      const { createCollection, updateCollectionAuth } = useApiClientStore.getState();
      createCollection('My Collection');
      const collectionId = useApiClientStore.getState().collections[0].id;

      const auth: AuthConfig = { type: 'bearer', bearerToken: 'test-token' };
      updateCollectionAuth(collectionId, auth);

      const state = useApiClientStore.getState();
      expect(state.collections[0].auth).toEqual(auth);
    });

    it('should duplicate a request', () => {
      const { createCollection, addToCollection, duplicateRequest } = useApiClientStore.getState();
      createCollection('My Collection');
      const collectionId = useApiClientStore.getState().collections[0].id;

      const mockRequest: Partial<ApiRequest> = {
        name: 'Original Request',
        method: 'GET',
        url: 'https://api.example.com',
      };
      addToCollection(collectionId, mockRequest as ApiRequest);
      const requestId = useApiClientStore.getState().collections[0].requests[0].id;

      duplicateRequest(requestId);

      const state = useApiClientStore.getState();
      expect(state.collections[0].requests).toHaveLength(2);
      expect(state.collections[0].requests[1].name).toContain('(Copy)');
    });
  });

  describe('Environment Management', () => {
    it('should create an environment', () => {
      const { createEnvironment } = useApiClientStore.getState();
      createEnvironment('Production');

      const state = useApiClientStore.getState();
      expect(state.environments).toHaveLength(1);
      expect(state.environments[0].name).toBe('Production');
    });

    it('should update an environment', () => {
      const { createEnvironment, updateEnvironment } = useApiClientStore.getState();
      createEnvironment('Production');
      const envId = useApiClientStore.getState().environments[0].id;

      updateEnvironment(envId, { name: 'Staging' });

      const state = useApiClientStore.getState();
      expect(state.environments[0].name).toBe('Staging');
    });

    it('should delete an environment', () => {
      const { createEnvironment, deleteEnvironment } = useApiClientStore.getState();
      createEnvironment('Production');
      const envId = useApiClientStore.getState().environments[0].id;
      deleteEnvironment(envId);

      expect(useApiClientStore.getState().environments).toHaveLength(0);
    });

    it('should set active environment', () => {
      const { createEnvironment, setActiveEnvironment } = useApiClientStore.getState();
      createEnvironment('Production');
      const envId = useApiClientStore.getState().environments[0].id;
      setActiveEnvironment(envId);

      expect(useApiClientStore.getState().activeEnvironmentId).toBe(envId);
    });

    it('should clear active environment when deleting active environment', () => {
      const { createEnvironment, setActiveEnvironment, deleteEnvironment } =
        useApiClientStore.getState();
      createEnvironment('Production');
      const envId = useApiClientStore.getState().environments[0].id;
      setActiveEnvironment(envId);
      deleteEnvironment(envId);

      expect(useApiClientStore.getState().activeEnvironmentId).toBeNull();
    });
  });

  describe('Helper Functions', () => {
    it('should get active tab', () => {
      const { addTab, getActiveTab } = useApiClientStore.getState();
      addTab();
      const activeTab = getActiveTab();

      expect(activeTab).toBeDefined();
      expect(activeTab?.title).toBe('Untitled Request');
    });

    it('should get active environment', () => {
      const { createEnvironment, setActiveEnvironment, getActiveEnvironment } =
        useApiClientStore.getState();
      createEnvironment('Production');
      const envId = useApiClientStore.getState().environments[0].id;
      setActiveEnvironment(envId);

      const activeEnv = getActiveEnvironment();
      expect(activeEnv).toBeDefined();
      expect(activeEnv?.name).toBe('Production');
    });

    it('should resolve auth from request', () => {
      const { addTab, resolveAuth } = useApiClientStore.getState();
      const customRequest: Partial<ApiRequest> = {
        name: 'Test',
        auth: { type: 'bearer', bearerToken: 'test-token' },
      };
      addTab(customRequest as ApiRequest);
      const tabId = useApiClientStore.getState().tabs[0].id;

      const auth = resolveAuth(tabId);
      expect(auth.type).toBe('bearer');
      expect(auth.bearerToken).toBe('test-token');
    });
  });

  describe('Sidebar Management', () => {
    it('should toggle sidebar', () => {
      const { setSidebarOpen } = useApiClientStore.getState();
      setSidebarOpen(false);
      expect(useApiClientStore.getState().sidebarOpen).toBe(false);

      setSidebarOpen(true);
      expect(useApiClientStore.getState().sidebarOpen).toBe(true);
    });

    it('should set active sidebar view', () => {
      const { setActiveSidebarView } = useApiClientStore.getState();
      setActiveSidebarView('collections');
      expect(useApiClientStore.getState().activeSidebarView).toBe('collections');
    });
  });
});
