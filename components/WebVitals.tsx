/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useEffect } from 'react';

/**
 * Web Vitals tracking component
 *
 * Tracks Core Web Vitals locally without sending data to external services.
 * Metrics are logged to console in development mode only.
 *
 * Core Web Vitals tracked:
 * - LCP (Largest Contentful Paint): measures loading performance
 * - FID (First Input Delay): measures interactivity
 * - CLS (Cumulative Layout Shift): measures visual stability
 * - FCP (First Contentful Paint): measures perceived load speed
 * - TTFB (Time to First Byte): measures server responsiveness
 * - INP (Interaction to Next Paint): replaces FID as of 2024
 */
export function WebVitals() {
  useEffect(() => {
    // Only track in development or if explicitly enabled
    const isDev = process.env.NODE_ENV === 'development';

    if (!isDev && typeof window !== 'undefined') {
      const enableTracking = localStorage.getItem('webVitalsTracking') === 'true';
      if (!enableTracking) return;
    }

    // Dynamically import web-vitals to avoid including it in the main bundle
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      // Track metrics with custom reporting
      const reportMetric = (metric: any) => {
        // Log to console in development
        if (isDev || typeof window !== 'undefined') {
          const { name, value, rating, delta } = metric;

          console.log(`[Web Vitals] ${name}:`, {
            value: Math.round(value),
            rating,
            delta: Math.round(delta),
            unit: name === 'CLS' ? 'score' : 'ms',
          });

          // Check against 50ms threshold for interaction metrics
          if (name === 'INP' && value > 50) {
            console.warn(`⚠️ [Web Vitals] ${name} (${Math.round(value)}ms) exceeds 50ms threshold`);
          }

          // Store metrics in sessionStorage for analysis
          const vitalsKey = 'webVitals';
          const existingVitals = JSON.parse(sessionStorage.getItem(vitalsKey) || '{}');

          existingVitals[name] = {
            value: Math.round(value),
            rating,
            timestamp: Date.now(),
          };

          sessionStorage.setItem(vitalsKey, JSON.stringify(existingVitals));
        }
      };

      // Register all Core Web Vitals
      onCLS(reportMetric);
      onFCP(reportMetric);
      onLCP(reportMetric);
      onTTFB(reportMetric);
      onINP(reportMetric);
    });
  }, []);

  return null;
}

/**
 * Utility to retrieve stored Web Vitals data
 * Usage: WebVitals.getData()
 */
export const getWebVitalsData = (): Record<string, any> => {
  if (typeof window === 'undefined') return {};

  const vitalsKey = 'webVitals';
  return JSON.parse(sessionStorage.getItem(vitalsKey) || '{}');
};

/**
 * Utility to clear Web Vitals data
 */
export const clearWebVitalsData = (): void => {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem('webVitals');
};
