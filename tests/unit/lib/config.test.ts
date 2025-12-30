/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('lib/config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use default values when environment variables are missing', async () => {
    const { config } = await import('@/lib/config');
    expect(config.NODE_ENV).toBe('test'); // Vitest sets NODE_ENV to test
    expect(config.RATE_LIMIT_WINDOW_MS).toBe(60000);
    expect(config.RATE_LIMIT_MAX_REQUESTS).toBe(60);
    expect(config.API_TIMEOUT_MS).toBe(30000);
    expect(config.UNSAFE_DEBUG_LOGGING).toBe(false);
  });

  it('should override defaults with environment variables', async () => {
    process.env.RATE_LIMIT_MAX_REQUESTS = '100';
    process.env.UNSAFE_DEBUG_LOGGING = 'true';

    const { config } = await import('@/lib/config');
    expect(config.RATE_LIMIT_MAX_REQUESTS).toBe(100);
    expect(config.UNSAFE_DEBUG_LOGGING).toBe(true);
  });

  it('should handle invalid numeric values gracefully by using defaults', async () => {
    process.env.RATE_LIMIT_WINDOW_MS = 'not-a-number';

    // safeParse should catch this in config.ts itself
    const { config } = await import('@/lib/config');
    expect(config.RATE_LIMIT_WINDOW_MS).toBe(60000);
  });
});
