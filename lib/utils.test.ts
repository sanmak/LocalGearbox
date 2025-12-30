/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
  });

  it('should handle conditional class names', () => {
    expect(cn('btn', true && 'btn-active', false && 'btn-disabled')).toBe('btn btn-active');
  });

  it('should handle undefined and null values', () => {
    expect(cn('btn', undefined, null)).toBe('btn');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2 py-2', 'px-4')).toBe('py-2 px-4');
  });
});
