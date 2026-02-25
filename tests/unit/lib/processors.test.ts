/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { calculateRateLimitBackoff, type RateLimitBackoffInput } from '@/lib/processors';

const baseInput: RateLimitBackoffInput = {
  requestsPerWindow: 100,
  windowSeconds: 60,
  retryType: 'exponential',
  baseDelayMs: 1000,
  maxRetries: 5,
};

describe('calculateRateLimitBackoff', () => {
  it('should calculate exponential backoff schedule', async () => {
    const result = await calculateRateLimitBackoff(baseInput);
    expect(result.retrySchedule).toHaveLength(5);
    // Exponential: 1000, 2000, 4000, 8000, 16000
    expect(result.retrySchedule[0]).toBe(1000);
    expect(result.retrySchedule[1]).toBe(2000);
    expect(result.retrySchedule[2]).toBe(4000);
    expect(result.retrySchedule[3]).toBe(8000);
    expect(result.retrySchedule[4]).toBe(16000);
  });

  it('should calculate total wait time', async () => {
    const result = await calculateRateLimitBackoff(baseInput);
    expect(result.totalWaitMs).toBe(31000); // 1000+2000+4000+8000+16000
  });

  it('should generate human-readable schedule', async () => {
    const result = await calculateRateLimitBackoff(baseInput);
    expect(result.retryScheduleHuman).toHaveLength(5);
    expect(result.retryScheduleHuman[0]).toContain('s');
  });

  it('should generate retry events', async () => {
    const result = await calculateRateLimitBackoff(baseInput);
    expect(result.retryEvents).toHaveLength(5);
    expect(result.retryEvents[0].attempt).toBe(1);
    expect(result.retryEvents[0].status).toBe('scheduled');
  });

  it('should calculate equal backoff', async () => {
    const input: RateLimitBackoffInput = {
      ...baseInput,
      retryType: 'equal',
    };
    const result = await calculateRateLimitBackoff(input);
    // All delays should be equal to baseDelayMs
    expect(result.retrySchedule.every((d) => d === 1000)).toBe(true);
  });

  it('should respect maxDelayMs cap', async () => {
    const input: RateLimitBackoffInput = {
      ...baseInput,
      maxDelayMs: 5000,
    };
    const result = await calculateRateLimitBackoff(input);
    // No delay should exceed maxDelayMs
    expect(result.retrySchedule.every((d) => d <= 5000)).toBe(true);
  });

  it('should include budget per window', async () => {
    const result = await calculateRateLimitBackoff(baseInput);
    expect(result.budgetPerWindow).toBe(100);
  });

  it('should include summary information', async () => {
    const result = await calculateRateLimitBackoff(baseInput);
    expect(result.summary.totalRequests).toBe(6); // 1 + 5 retries
    expect(result.summary.totalRetries).toBe(5);
    expect(result.summary.strategy).toBe('exponential');
  });

  it('should include chart data', async () => {
    const result = await calculateRateLimitBackoff(baseInput);
    expect(result.chartData.x).toHaveLength(5);
    expect(result.chartData.y).toHaveLength(5);
    expect(result.chartData.x[0]).toBe(1);
  });

  it('should include notes', async () => {
    const result = await calculateRateLimitBackoff(baseInput);
    expect(result.notes.length).toBeGreaterThan(0);
    expect(result.notes.some((n) => n.includes('exponential'))).toBe(true);
  });

  it('should handle total wait human formatting in ms', async () => {
    const input: RateLimitBackoffInput = {
      ...baseInput,
      baseDelayMs: 100,
      maxRetries: 1,
    };
    const result = await calculateRateLimitBackoff(input);
    expect(result.totalWaitHuman).toContain('ms');
  });

  it('should handle total wait human formatting in seconds', async () => {
    const result = await calculateRateLimitBackoff(baseInput);
    expect(result.totalWaitHuman).toContain('s');
  });

  // Validation tests
  it('should throw on missing input', async () => {
    await expect(
      calculateRateLimitBackoff(null as unknown as RateLimitBackoffInput),
    ).rejects.toThrow('Input required');
  });

  it('should throw on requestsPerWindow < 1', async () => {
    await expect(calculateRateLimitBackoff({ ...baseInput, requestsPerWindow: 0 })).rejects.toThrow(
      'requestsPerWindow must be >= 1',
    );
  });

  it('should throw on windowSeconds < 1', async () => {
    await expect(calculateRateLimitBackoff({ ...baseInput, windowSeconds: 0 })).rejects.toThrow(
      'windowSeconds must be >= 1',
    );
  });

  it('should throw on baseDelayMs < 1', async () => {
    await expect(calculateRateLimitBackoff({ ...baseInput, baseDelayMs: 0 })).rejects.toThrow(
      'baseDelayMs must be >= 1',
    );
  });

  it('should throw on maxRetries < 1', async () => {
    await expect(calculateRateLimitBackoff({ ...baseInput, maxRetries: 0 })).rejects.toThrow(
      'maxRetries must be 1-20',
    );
  });

  it('should throw on maxRetries > 20', async () => {
    await expect(calculateRateLimitBackoff({ ...baseInput, maxRetries: 21 })).rejects.toThrow(
      'maxRetries must be 1-20',
    );
  });

  it('should throw on invalid retryType', async () => {
    await expect(
      calculateRateLimitBackoff({
        ...baseInput,
        retryType: 'invalid' as RateLimitBackoffInput['retryType'],
      }),
    ).rejects.toThrow('retryType must be one of');
  });

  it('should throw on burstFactor out of range', async () => {
    await expect(calculateRateLimitBackoff({ ...baseInput, burstFactor: 11 })).rejects.toThrow(
      'burstFactor must be 1-10',
    );
  });

  it('should throw on invalid distribution', async () => {
    await expect(
      calculateRateLimitBackoff({
        ...baseInput,
        distribution: 'invalid' as RateLimitBackoffInput['distribution'],
      }),
    ).rejects.toThrow("distribution must be 'uniform' or 'bursty'");
  });

  it('should throw on invalid maxDelayMs', async () => {
    await expect(calculateRateLimitBackoff({ ...baseInput, maxDelayMs: 0 })).rejects.toThrow(
      'maxDelayMs must be >= 1',
    );
  });

  it('should handle exponential-jitter strategy', async () => {
    const input: RateLimitBackoffInput = {
      ...baseInput,
      retryType: 'exponential-jitter',
    };
    const result = await calculateRateLimitBackoff(input);
    expect(result.retrySchedule).toHaveLength(5);
    // With jitter, delays should be non-negative
    expect(result.retrySchedule.every((d) => d >= 0)).toBe(true);
  });

  it('should handle full-jitter strategy', async () => {
    const input: RateLimitBackoffInput = {
      ...baseInput,
      retryType: 'full-jitter',
    };
    const result = await calculateRateLimitBackoff(input);
    expect(result.retrySchedule).toHaveLength(5);
    expect(result.retrySchedule.every((d) => d >= 0)).toBe(true);
  });

  it('should handle decorrelated strategy', async () => {
    const input: RateLimitBackoffInput = {
      ...baseInput,
      retryType: 'decorrelated',
    };
    const result = await calculateRateLimitBackoff(input);
    expect(result.retrySchedule).toHaveLength(5);
    expect(result.retrySchedule.every((d) => d >= 0)).toBe(true);
  });

  it('should handle bursty distribution', async () => {
    const input: RateLimitBackoffInput = {
      ...baseInput,
      distribution: 'bursty',
      burstFactor: 5,
    };
    const result = await calculateRateLimitBackoff(input);
    expect(result.summary.distribution).toBe('bursty');
    expect(result.summary.burstFactor).toBe(5);
  });

  it('should handle single retry', async () => {
    const input: RateLimitBackoffInput = {
      ...baseInput,
      maxRetries: 1,
    };
    const result = await calculateRateLimitBackoff(input);
    expect(result.retrySchedule).toHaveLength(1);
    expect(result.retrySchedule[0]).toBe(1000);
  });

  it('should handle maxRetries of 20', async () => {
    const input: RateLimitBackoffInput = {
      ...baseInput,
      maxRetries: 20,
      maxDelayMs: 60000,
    };
    const result = await calculateRateLimitBackoff(input);
    expect(result.retrySchedule).toHaveLength(20);
  });
});
