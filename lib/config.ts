/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { z } from 'zod';

/**
 * Configuration schema for the application.
 * Adheres to 12-factor app: config in environment.
 */
const configSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('60000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val), { message: 'Must be a valid number' }),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .default('60')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val), { message: 'Must be a valid number' }),

  // API Configuration
  API_TIMEOUT_MS: z
    .string()
    .default('30000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val), { message: 'Must be a valid number' }),

  // Logging
  UNSAFE_DEBUG_LOGGING: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),

  // Analytics (Bundle Analyzer)
  ANALYZE: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
});

// Parse and validate environment variables
const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  // In a real 12-factor app, we might want to crash here in production
  // throw new Error('Invalid environment variables');
}

export const config = parsed.success ? parsed.data : configSchema.parse({}); // Fallback to defaults if validation fails (to avoid crashing in some environments)

export type Config = z.infer<typeof configSchema>;
