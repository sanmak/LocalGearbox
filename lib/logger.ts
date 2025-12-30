/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

// Simple structured logger for server-side usage
// Adheres to 12-factor app: logs to stdout as JSON

import { config } from './config';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: string;
}

const formatLog = (
  level: LogLevel,
  message: string,
  context?: Record<string, any>,
  error?: unknown,
): string => {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  if (error) {
    if (error instanceof Error) {
      entry.error = error.message;
      // Include stack trace in dev/debug if needed, or keep compact for prod
      if (config.NODE_ENV !== 'production') {
        entry.context = { ...entry.context, stack: error.stack };
      }
    } else {
      entry.error = String(error);
    }
  }

  return JSON.stringify(entry);
};

export const logger = {
  info: (message: string, context?: Record<string, any>) => {
    console.log(formatLog('info', message, context));
  },
  warn: (message: string, context?: Record<string, any>, error?: unknown) => {
    console.warn(formatLog('warn', message, context, error));
  },
  error: (message: string, context?: Record<string, any>, error?: unknown) => {
    console.error(formatLog('error', message, context, error));
  },
  debug: (message: string, context?: Record<string, any>) => {
    if (config.NODE_ENV !== 'production') {
      console.debug(formatLog('debug', message, context));
    }
  },
  shouldLogPII: (): boolean => {
    return config.UNSAFE_DEBUG_LOGGING;
  },
  redact: (value: string | undefined | null): string => {
    if (!value) return '';
    if (config.UNSAFE_DEBUG_LOGGING) {
      return value;
    }
    return '[REDACTED]';
  },
};
