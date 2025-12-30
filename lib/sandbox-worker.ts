/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

// Web Worker for isolated script execution
// This worker has NO access to DOM, localStorage, cookies, or window object

import { TestResult } from '@/lib/stores/api-client-store';

interface WorkerMessage {
  script: string;
  context: {
    environment: Record<string, string>;
    response?: {
      status: number;
      statusText: string;
      headers: Record<string, string>;
      body: any;
    };
  };
}

interface WorkerResult {
  environmentUpdates: Record<string, string>;
  testResults: TestResult[];
  logs: string[];
  error?: string;
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { script, context } = e.data;
  const logs: string[] = [];
  const testResults: TestResult[] = [];
  const environmentUpdates: Record<string, string> = {};

  if (!script || !script.trim()) {
    self.postMessage({ environmentUpdates, testResults, logs } as WorkerResult);
    return;
  }

  // Create PM API Shim (same as before, but isolated in worker)
  const pm = {
    environment: {
      get: (key: string) => context.environment[key],
      set: (key: string, value: string) => {
        environmentUpdates[key] = value;
      },
    },
    test: (name: string, callback: () => void) => {
      try {
        callback();
        testResults.push({ name, status: 'pass' });
      } catch (err: any) {
        testResults.push({ name, status: 'fail', message: err.message });
      }
    },
    expect: (actual: any) => ({
      to: {
        be: (expected: any) => {
          if (actual !== expected) throw new Error(`Expected ${actual} to be ${expected}`);
        },
        equal: (expected: any) => {
          if (actual != expected) throw new Error(`Expected ${actual} to equal ${expected}`);
        },
        have: {
          status: (status: number) => {
            if (context.response && context.response.status !== status)
              throw new Error(`Expected status ${context.response.status} to be ${status}`);
          },
        },
      },
    }),
    response: context.response
      ? {
          code: context.response.status,
          status: context.response.statusText,
          headers: context.response.headers,
          json: () => context.response?.body,
          text: () => JSON.stringify(context.response?.body || ''),
        }
      : undefined,
  };

  try {
    const safeLog = (...args: any[]) => logs.push(args.map((a) => String(a)).join(' '));

    // Still uses Function constructor, but now isolated in Web Worker
    // Worker has no access to DOM, localStorage, cookies, or parent window
    const executionFn = new Function(
      'pm',
      'console',
      `
      try {
        ${script}
      } catch (e) {
        throw new Error(e.message);
      }
    `,
    );

    executionFn(pm, { log: safeLog, error: safeLog, warn: safeLog });

    self.postMessage({ environmentUpdates, testResults, logs } as WorkerResult);
  } catch (err: any) {
    self.postMessage({
      environmentUpdates,
      testResults,
      logs,
      error: err.message,
    } as WorkerResult);
  }
};
