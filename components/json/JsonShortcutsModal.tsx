/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON Keyboard Shortcuts Modal
 * Shows all available keyboard shortcuts
 */

import { CloseIcon } from './icons';

interface Shortcut {
  key: string;
  description: string;
}

interface ShortcutGroup {
  title: string;
  icon: React.ReactNode;
  shortcuts: Shortcut[];
}

interface JsonShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: ShortcutGroup[];
}

// Default shortcuts for JSON tools
const DEFAULT_SHORTCUTS: ShortcutGroup[] = [
  {
    title: 'Actions',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    shortcuts: [
      { key: '⌘+Enter', description: 'Process/Format' },
      { key: '⌘+K', description: 'Clear All' },
      { key: '⌘+Shift+K', description: 'Copy Output' },
    ],
  },
  {
    title: 'General',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
        />
      </svg>
    ),
    shortcuts: [
      { key: '⌘+/', description: 'Show Shortcuts' },
      { key: 'Escape', description: 'Close Modal/Panel' },
    ],
  },
];

export function JsonShortcutsModal({
  isOpen,
  onClose,
  shortcuts = DEFAULT_SHORTCUTS,
}: JsonShortcutsModalProps): React.JSX.Element | null {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <svg
                className="w-5 h-5 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Keyboard Shortcuts
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">
              Press{' '}
              <kbd className="px-1.5 py-0.5 bg-surface-secondary border border-border rounded text-[10px] font-mono">
                ⌘+/
              </kbd>{' '}
              anytime to toggle this panel
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shortcuts.map((group, index) => (
              <div key={index}>
                <h3 className="text-sm font-semibold text-accent mb-3 flex items-center gap-2">
                  {group.icon}
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-surface-secondary"
                    >
                      <span className="text-sm text-text-primary">{shortcut.description}</span>
                      <kbd className="px-2 py-1 bg-surface-secondary border border-border rounded text-xs font-mono text-text-secondary">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pro Tip */}
          <div className="mt-6 p-3 bg-accent/10 border border-accent/20 rounded-lg">
            <p className="text-xs text-text-secondary">
              <strong className="text-accent">Pro tip:</strong> Most shortcuts work from anywhere on
              the page. Use{' '}
              <kbd className="px-1 py-0.5 bg-surface-secondary border border-border rounded text-[10px] font-mono">
                ⌘
              </kbd>{' '}
              on Mac or{' '}
              <kbd className="px-1 py-0.5 bg-surface-secondary border border-border rounded text-[10px] font-mono">
                Ctrl
              </kbd>{' '}
              on Windows/Linux.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end px-4 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

export default JsonShortcutsModal;
