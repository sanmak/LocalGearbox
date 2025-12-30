/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/*
 * Simple in-memory token-bucket rate limiter (per-process).
 * Suitable for low-traffic/self-hosted deployments. For production at scale,
 * replace with a distributed store (Redis, Memcached, etc.).
 */

import { NextRequest } from 'next/server';
import { config } from '../config';

const buckets = new Map<string, { tokens: number; last: number }>();

const getClientIp = (req: NextRequest): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
};

export const rateLimit = async (
  req: NextRequest,
  key: string,
  limit?: number,
  windowMs?: number,
): Promise<void> => {
  // Use environment variables for defaults if available
  const finalLimit = limit || config.RATE_LIMIT_MAX_REQUESTS;
  const finalWindow = windowMs || config.RATE_LIMIT_WINDOW_MS;

  const ip = getClientIp(req);
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(bucketKey) || { tokens: finalLimit, last: now };

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.last;
  const refill = (elapsed / finalWindow) * finalLimit;
  bucket.tokens = Math.min(finalLimit, bucket.tokens + refill);
  bucket.last = now;

  if (bucket.tokens < 1) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  bucket.tokens -= 1;
  buckets.set(bucketKey, bucket);
};
