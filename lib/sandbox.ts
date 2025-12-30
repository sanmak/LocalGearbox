/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { TestResult } from '@/lib/stores/api-client-store';

export interface SandboxContext {
  environment: Record<string, string>;
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
  };
}

export interface SandboxResult {
  environmentUpdates: Record<string, string>;
  testResults: TestResult[];
  logs: string[];
  error?: string;
}

/**
 * Run a script in an isolated Web Worker sandbox
 * This provides true isolation - no access to DOM, localStorage, cookies, or parent window
 */
export async function runScript(script: string, context: SandboxContext): Promise<SandboxResult> {
  if (!script || !script.trim()) {
    return { environmentUpdates: {}, testResults: [], logs: [] };
  }

  return new Promise((resolve) => {
    // Create worker from inline code to avoid CORS issues
    const workerCode = `
      self.onmessage = (e) => {
        const { script, context } = e.data;
        const logs = [];
        const testResults = [];
        const environmentUpdates = {};

        const pm = {
          environment: {
            get: (key) => context.environment[key],
            set: (key, value) => {
              environmentUpdates[key] = value;
            },
          },
          test: (name, callback) => {
            try {
              callback();
              testResults.push({ name, status: 'pass' });
            } catch (err) {
              testResults.push({ name, status: 'fail', message: err.message });
            }
          },
          expect: (actual) => ({
            to: {
              be: (expected) => {
                if (actual !== expected)
                  throw new Error(\`Expected \${actual} to be \${expected}\`);
              },
              equal: (expected) => {
                if (actual != expected)
                  throw new Error(\`Expected \${actual} to equal \${expected}\`);
              },
              have: {
                status: (status) => {
                  if (context.response && context.response.status !== status)
                    throw new Error(
                      \`Expected status \${context.response.status} to be \${status}\`
                    );
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
          const safeLog = (...args) =>
            logs.push(args.map((a) => String(a)).join(' '));

          const executionFn = new Function(
            'pm',
            'console',
            \`
            try {
              \${script}
            } catch (e) {
              throw new Error(e.message);
            }
          \`
          );

          executionFn(pm, { log: safeLog, error: safeLog, warn: safeLog });

          self.postMessage({ environmentUpdates, testResults, logs });
        } catch (err) {
          self.postMessage({
            environmentUpdates,
            testResults,
            logs,
            error: err.message,
          });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve({
        environmentUpdates: {},
        testResults: [],
        logs: [],
        error: 'Script execution timeout (10s limit)',
      });
    }, 10000);

    worker.onmessage = (e: MessageEvent<SandboxResult>) => {
      clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve(e.data);
    };

    worker.onerror = (err) => {
      clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve({
        environmentUpdates: {},
        testResults: [],
        logs: [],
        error: `Worker error: ${err.message}`,
      });
    };

    // Send script to worker
    worker.postMessage({ script, context });
  });
}
