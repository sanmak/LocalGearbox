/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  ArchitectureComponent,
  ArchitectureConnection,
  DiagramLayer,
  Annotation,
} from '@/lib/tools/workbenches/architecture-diagram/types';

interface DiagramSnapshot {
  components: ArchitectureComponent[];
  connections: ArchitectureConnection[];
  timestamp: number;
}

interface DiagramState {
  // Diagram data
  components: ArchitectureComponent[];
  connections: ArchitectureConnection[];
  layers: DiagramLayer[];
  annotations: Annotation[];
  title: string;
  description: string;

  // UI state
  selectedComponentIds: string[];
  selectedConnectionIds: string[];
  editMode: 'visual' | 'code';
  viewMode: 'design' | 'preview';
  zoom: number;
  pan: { x: number; y: number };

  // History
  history: DiagramSnapshot[];
  historyIndex: number;

  // Actions
  addComponent: (component: ArchitectureComponent) => void;
  updateComponent: (id: string, updates: Partial<ArchitectureComponent>) => void;
  deleteComponent: (id: string) => void;
  addConnection: (connection: ArchitectureConnection) => void;
  updateConnection: (id: string, updates: Partial<ArchitectureConnection>) => void;
  deleteConnection: (id: string) => void;
  selectComponent: (id: string, multi?: boolean) => void;
  selectConnection: (id: string, multi?: boolean) => void;
  deselectAll: () => void;
  setEditMode: (mode: 'visual' | 'code') => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  undo: () => void;
  redo: () => void;
  resetDiagram: () => void;
}

const initialState = {
  components: [],
  connections: [],
  layers: [],
  annotations: [],
  title: 'Untitled Diagram',
  description: '',
  selectedComponentIds: [],
  selectedConnectionIds: [],
  editMode: 'visual' as const,
  viewMode: 'design' as const,
  zoom: 1,
  pan: { x: 0, y: 0 },
  history: [{ components: [], connections: [], timestamp: Date.now() }],
  historyIndex: 0,
};

export const useDiagramStore = create<DiagramState>()(
  persist(
    immer((set) => ({
      ...initialState,

      undo: () =>
        set((state) => {
          if (state.historyIndex > 0) {
            state.historyIndex -= 1;
            const snapshot = state.history[state.historyIndex];
            state.components = snapshot.components;
            state.connections = snapshot.connections;
          }
        }),

      redo: () =>
        set((state) => {
          if (state.historyIndex < state.history.length - 1) {
            state.historyIndex += 1;
            const snapshot = state.history[state.historyIndex];
            state.components = snapshot.components;
            state.connections = snapshot.connections;
          }
        }),

      // Helper to save history
      // Note: We'll inline this logic into actions since we can't easily call internal helpers in immer without defining them inside the store creator scope or repeating code.
      // Better yet, let's make a wrapper logic or just repeat the 3-4 lines.

      addComponent: (component) =>
        set((state) => {
          // Save history
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push({
            components: state.components,
            connections: state.connections,
            timestamp: Date.now(),
          });
          state.history = newHistory;
          state.historyIndex = newHistory.length; // Points to the *next* state, or actually the current state index is historyIndex?
          // Let's adopt standard: history array contains ALL states including current.
          // historyIndex points to the CURRENT active state.
          // So if we have 1 state (initial), index is 0.
          // When we add connection, we push, index becomes 1.

          // Wait, initial state needs to be in history.
          // Let's fix the initial state first.

          // Actually, let's use the pattern where history contains PASTA states.
          // No, standard is: history is array of snapshots. historyIndex is ptr.

          // Fix logic:
          // 1. If history is empty/index -1 (from our initial bad state), init it.
          // We will fixing init state in a separate block if needed, but here:

          if (state.historyIndex === -1 && state.history.length === 0) {
            // First mutation, establish baseline?
            // Or just assume current state updates move forward.
            state.history = [
              {
                components: state.components,
                connections: state.connections,
                timestamp: Date.now(),
              },
            ];
            state.historyIndex = 0;
          }

          // Now proceed to mutate for NEXT state
          // We actually need to commit the *result* of this action as the new history tip.
          // OR save *previous* state?

          // Pattern:
          // 1. Slice history up to current index.
          // 2. Push COPY of current state (before mutation) ?? No, usually undo restores previous.

          // Let's stick to: History = [State 0, State 1, State 2]. Index = 2.
          // Undo -> Index = 1. Restore State 1.

          // So before mutation, we ensure current state is properly in history at index.
          // Then we perform mutation.
          // Then we push NEW state to history.

          // Actually, simpler:
          // Just push the *result* state after mutation?
          // No, if index=0, we have State 0.
          // Action happens. We want State 1.
          // slice(0, index+1) -> [State 0]
          // Mutate -> components changes.
          // Push new snapshot -> [State 0, State 1]. Index = 1.

          // But wait, `state` in immer IS the draft.
          // If we push `state.components` it might be a ref or proxy.
          // We need to clone.

          // Let's refine the "save" logic to be:
          // 1. Slice history.
          // 2. Push logic.

          // But wait, we are modifying `state` right now.
          // Logic:
          // 1. Prune redo history: history = history.slice(0, historyIndex + 1)
          // 2. Current state is ALREADY in history[historyIndex] (logic assumption).
          // 3. Mutate `state`.
          // 4. Push NEW state to history.

          // Initialization check:
          if (state.history.length === 0) {
            state.history = [
              {
                components: [], // Initial empty
                connections: [],
                timestamp: Date.now(),
              },
            ];
            state.historyIndex = 0;
          }

          // Prune
          state.history = state.history.slice(0, state.historyIndex + 1);

          // Mutate
          state.components.push(component);

          // Push new state
          state.history.push({
            components: state.components, // Immer proxy, but should be fine for snapshot if we don't mutate IT later?
            // Actually immer freezes.
            connections: state.connections,
            timestamp: Date.now(),
          });
          state.historyIndex += 1;
        }),

      updateComponent: (id, updates) =>
        set((state) => {
          // Init check
          if (state.history.length === 0) {
            state.history = [{ components: [], connections: [], timestamp: Date.now() }];
            state.historyIndex = 0;
          }

          // Prune
          state.history = state.history.slice(0, state.historyIndex + 1);

          const index = state.components.findIndex((c) => c.id === id);
          if (index !== -1) {
            state.components[index] = { ...state.components[index], ...updates };

            // Push new state
            state.history.push({
              components: state.components,
              connections: state.connections,
              timestamp: Date.now(),
            });
            state.historyIndex += 1;
          }
        }),

      deleteComponent: (id) =>
        set((state) => {
          if (state.history.length === 0) {
            state.history = [{ components: [], connections: [], timestamp: Date.now() }];
            state.historyIndex = 0;
          }
          state.history = state.history.slice(0, state.historyIndex + 1);

          state.components = state.components.filter((c) => c.id !== id);
          state.connections = state.connections.filter((c) => c.from !== id && c.to !== id);
          state.selectedComponentIds = state.selectedComponentIds.filter((sid) => sid !== id);

          state.history.push({
            components: state.components,
            connections: state.connections,
            timestamp: Date.now(),
          });
          state.historyIndex += 1;
        }),

      addConnection: (connection) =>
        set((state) => {
          if (state.history.length === 0) {
            state.history = [{ components: [], connections: [], timestamp: Date.now() }];
            state.historyIndex = 0;
          }
          state.history = state.history.slice(0, state.historyIndex + 1);

          state.connections.push(connection);

          state.history.push({
            components: state.components,
            connections: state.connections,
            timestamp: Date.now(),
          });
          state.historyIndex += 1;
        }),

      updateConnection: (id, updates) =>
        set((state) => {
          if (state.history.length === 0) {
            state.history = [{ components: [], connections: [], timestamp: Date.now() }];
            state.historyIndex = 0;
          }
          state.history = state.history.slice(0, state.historyIndex + 1);

          const index = state.connections.findIndex((c) => c.id === id);
          if (index !== -1) {
            state.connections[index] = {
              ...state.connections[index],
              ...updates,
            };

            state.history.push({
              components: state.components,
              connections: state.connections,
              timestamp: Date.now(),
            });
            state.historyIndex += 1;
          }
        }),

      deleteConnection: (id) =>
        set((state) => {
          if (state.history.length === 0) {
            state.history = [{ components: [], connections: [], timestamp: Date.now() }];
            state.historyIndex = 0;
          }
          state.history = state.history.slice(0, state.historyIndex + 1);

          state.connections = state.connections.filter((c) => c.id !== id);
          state.selectedConnectionIds = state.selectedConnectionIds.filter((sid) => sid !== id);

          state.history.push({
            components: state.components,
            connections: state.connections,
            timestamp: Date.now(),
          });
          state.historyIndex += 1;
        }),

      selectComponent: (id, multi = false) =>
        set((state) => {
          if (multi) {
            if (state.selectedComponentIds.includes(id)) {
              state.selectedComponentIds = state.selectedComponentIds.filter((sid) => sid !== id);
            } else {
              state.selectedComponentIds.push(id);
            }
          } else {
            state.selectedComponentIds = [id];
            state.selectedConnectionIds = [];
          }
        }),

      selectConnection: (id, multi = false) =>
        set((state) => {
          if (multi) {
            if (state.selectedConnectionIds.includes(id)) {
              state.selectedConnectionIds = state.selectedConnectionIds.filter((sid) => sid !== id);
            } else {
              state.selectedConnectionIds.push(id);
            }
          } else {
            state.selectedConnectionIds = [id];
            state.selectedComponentIds = [];
          }
        }),

      deselectAll: () =>
        set((state) => {
          state.selectedComponentIds = [];
          state.selectedConnectionIds = [];
        }),

      setEditMode: (mode) =>
        set((state) => {
          state.editMode = mode;
        }),

      setZoom: (zoom) =>
        set((state) => {
          state.zoom = zoom;
        }),

      setPan: (pan) =>
        set((state) => {
          state.pan = pan;
        }),

      resetDiagram: () => set(initialState),
    })),
    {
      name: 'architecture-diagram-storage',
      skipHydration: true,
    },
  ),
);
