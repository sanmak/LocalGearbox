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
  // Validate message structure for security
  if (!e.data || typeof e.data !== 'object') {
    console.error('Invalid message received by worker: message data is not an object');
    return;
  }

  if (!e.data.script || typeof e.data.script !== 'string') {
    console.error('Invalid message received by worker: missing or invalid script property');
    return;
  }

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

    /**
     * Instead of executing arbitrary JavaScript via `new Function`, we now treat
     * the incoming `script` as a JSON-encoded instruction set that describes
     * tests to run, environment updates, and log messages.
     *
     * Expected shape (example):
     * {
     *   "envUpdates": { "TOKEN": "abc123" },
     *   "logs": ["starting tests"],
     *   "tests": [
     *     { "name": "status is 200", "type": "responseStatus", "expected": 200 },
     *     { "name": "env foo equals bar", "type": "envEqual", "key": "foo", "expected": "bar" }
     *   ]
     * }
     */
    type ScriptInstruction =
      | { type: 'responseStatus'; name: string; expected: number }
      | { type: 'envEqual'; name: string; key: string; expected: any }
      | { type: 'envBe'; name: string; key: string; expected: any };

    interface ScriptPayload {
      envUpdates?: Record<string, string>;
      logs?: string[];
      tests?: ScriptInstruction[];
    }

    let payload: ScriptPayload;

    try {
      payload = JSON.parse(script) as ScriptPayload;
    } catch (parseError: any) {
      throw new Error(
        `Failed to parse script instructions: ${parseError.message || String(parseError)}`,
      );
    }

    if (payload.envUpdates) {
      for (const [key, value] of Object.entries(payload.envUpdates)) {
        // Prevent prototype pollution by rejecting dangerous property names
        if (
          key === '__proto__' ||
          key === 'constructor' ||
          key === 'prototype' ||
          !Object.prototype.hasOwnProperty.call(payload.envUpdates, key)
        ) {
          safeLog(`Warning: Skipping dangerous property name: ${key}`);
          continue;
        }
        // Use Object.defineProperty for safer assignment
        Object.defineProperty(environmentUpdates, key, {
          value: String(value),
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    }

    if (payload.logs) {
      for (const entry of payload.logs) {
        safeLog(entry);
      }
    }

    if (payload.tests) {
      for (const instruction of payload.tests) {
        const { name } = instruction as { name: string };
        pm.test(name, () => {
          switch (instruction.type) {
            case 'responseStatus':
              if (typeof instruction.expected !== 'number') {
                throw new Error('expected must be a number for responseStatus tests');
              }
              pm.expect(null).to.have.status(instruction.expected);
              break;
            case 'envEqual': {
              const actual = pm.environment.get(instruction.key);
              pm.expect(actual).to.equal(instruction.expected);
              break;
            }
            case 'envBe': {
              const actual = pm.environment.get(instruction.key);
              pm.expect(actual).to.be(instruction.expected);
              break;
            }
            default:
              throw new Error(`Unsupported test instruction type: ${(instruction as any).type}`);
          }
        });
      }
    }

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
