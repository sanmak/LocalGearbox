/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON Toolbar Component
 * Reusable toolbar with common action buttons for JSON tools
 */

import {
  CopyIcon,
  CheckIcon,
  ClearIcon,
  PlayIcon,
  UploadIcon,
  DownloadIcon,
  SampleIcon,
  MinifyIcon,
  ExpandIcon,
  CollapseIcon,
  HelpIcon,
} from './icons';
import { Fragment } from 'react';

export interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'danger';
  showLabel?: boolean;
  tooltip?: string;
}

interface JsonToolbarProps {
  actions: ToolbarAction[];
  className?: string;
  compact?: boolean;
  showDividers?: boolean;
}

export const JsonToolbar: React.FC<JsonToolbarProps> = ({
  actions,
  className = '',
  compact = false,
  showDividers = false,
}) => {
  const getButtonClasses = (action: ToolbarAction) => {
    const baseClasses = compact
      ? 'p-1.5 rounded transition-colors'
      : 'px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-1.5';

    const variantClasses = {
      default: 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary',
      primary: 'text-accent hover:text-accent-hover hover:bg-accent/10',
      success: 'text-green-500 hover:text-green-400 hover:bg-green-500/10',
      danger: 'text-red-500 hover:text-red-400 hover:bg-red-500/10',
    };

    const disabledClasses = action.disabled ? 'opacity-50 cursor-not-allowed' : '';

    return `${baseClasses} ${variantClasses[action.variant || 'default']} ${disabledClasses}`;
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {actions.map((action, index) => (
        <Fragment key={action.id}>
          {showDividers && index > 0 && <div className="h-4 w-px bg-border mx-1" />}
          <button
            onClick={action.onClick}
            disabled={action.disabled}
            className={getButtonClasses(action)}
            title={action.tooltip || action.label}
          >
            {action.icon}
            {!compact && action.showLabel !== false && (
              <span className="hidden sm:inline">{action.label}</span>
            )}
          </button>
        </Fragment>
      ))}
    </div>
  );
};

// Preset toolbar configurations for common use cases
export const createCopyAction = (
  onCopy: () => void,
  isCopied: boolean,
  disabled?: boolean,
): ToolbarAction => ({
  id: 'copy',
  label: isCopied ? 'Copied!' : 'Copy',
  icon: isCopied ? <CheckIcon /> : <CopyIcon />,
  onClick: onCopy,
  disabled,
  variant: isCopied ? 'success' : 'default',
});

export const createClearAction = (onClear: () => void, disabled?: boolean): ToolbarAction => ({
  id: 'clear',
  label: 'Clear',
  icon: <ClearIcon />,
  onClick: onClear,
  disabled,
  variant: 'danger',
  tooltip: 'Clear All (⌘+K)',
});

export const createProcessAction = (
  onProcess: () => void,
  label = 'Process',
  disabled?: boolean,
): ToolbarAction => ({
  id: 'process',
  label,
  icon: <PlayIcon />,
  onClick: onProcess,
  disabled,
  variant: 'primary',
  tooltip: `${label} (⌘+Enter)`,
});

export const createSampleAction = (onLoadSample: () => void): ToolbarAction => ({
  id: 'sample',
  label: 'Sample',
  icon: <SampleIcon />,
  onClick: onLoadSample,
  variant: 'default',
  tooltip: 'Load Sample Data',
});

export const createUploadAction = (onUpload: () => void): ToolbarAction => ({
  id: 'upload',
  label: 'Upload',
  icon: <UploadIcon />,
  onClick: onUpload,
  variant: 'default',
  tooltip: 'Upload File',
});

export const createDownloadAction = (
  onDownload: () => void,
  disabled?: boolean,
): ToolbarAction => ({
  id: 'download',
  label: 'Download',
  icon: <DownloadIcon />,
  onClick: onDownload,
  disabled,
  variant: 'default',
  tooltip: 'Download Output',
});

export const createMinifyAction = (onMinify: () => void, disabled?: boolean): ToolbarAction => ({
  id: 'minify',
  label: 'Minify',
  icon: <MinifyIcon />,
  onClick: onMinify,
  disabled,
  variant: 'default',
  tooltip: 'Minify JSON',
});

export const createExpandAllAction = (onExpandAll: () => void): ToolbarAction => ({
  id: 'expand-all',
  label: 'Expand All',
  icon: <ExpandIcon />,
  onClick: onExpandAll,
  variant: 'default',
  tooltip: 'Expand All Nodes',
});

export const createCollapseAllAction = (onCollapseAll: () => void): ToolbarAction => ({
  id: 'collapse-all',
  label: 'Collapse',
  icon: <CollapseIcon />,
  onClick: onCollapseAll,
  variant: 'default',
  tooltip: 'Collapse All Nodes',
});

export const createHelpAction = (onShowHelp: () => void): ToolbarAction => ({
  id: 'help',
  label: 'Help',
  icon: <HelpIcon />,
  onClick: onShowHelp,
  variant: 'default',
  tooltip: 'Keyboard Shortcuts (⌘+/)',
});

// Pre-built toolbar presets
export interface ToolbarPresetOptions {
  onProcess?: () => void;
  onCopy?: () => void;
  onClear?: () => void;
  onLoadSample?: () => void;
  onUpload?: () => void;
  onDownload?: () => void;
  onShowHelp?: () => void;
  isCopied?: boolean;
  hasInput?: boolean;
  hasOutput?: boolean;
  processLabel?: string;
}

export const createInputToolbar = (options: ToolbarPresetOptions): ToolbarAction[] => {
  const actions: ToolbarAction[] = [];

  if (options.onProcess) {
    actions.push(createProcessAction(options.onProcess, options.processLabel, !options.hasInput));
  }
  if (options.onLoadSample) {
    actions.push(createSampleAction(options.onLoadSample));
  }
  if (options.onUpload) {
    actions.push(createUploadAction(options.onUpload));
  }
  if (options.onClear) {
    actions.push(createClearAction(options.onClear, !options.hasInput));
  }
  if (options.onShowHelp) {
    actions.push(createHelpAction(options.onShowHelp));
  }

  return actions;
};

export const createOutputToolbar = (options: ToolbarPresetOptions): ToolbarAction[] => {
  const actions: ToolbarAction[] = [];

  if (options.onCopy) {
    actions.push(createCopyAction(options.onCopy, options.isCopied || false, !options.hasOutput));
  }
  if (options.onDownload) {
    actions.push(createDownloadAction(options.onDownload, !options.hasOutput));
  }

  return actions;
};

export default JsonToolbar;
