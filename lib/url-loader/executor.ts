/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Request Executor
 * Executes HTTP requests based on RequestConfig
 */

import { RequestConfig, ResponseData } from './types';

/**
 * Execute an HTTP request based on the provided configuration
 */
export async function executeRequest(config: RequestConfig): Promise<ResponseData> {
  const startTime = performance.now();

  // Build URL with query params
  let url = config.url;
  const enabledParams = config.queryParams.filter((p) => p.enabled && p.key);

  // Add API key to query if configured
  if (
    config.auth.type === 'api-key' &&
    config.auth.apiKeyLocation === 'query' &&
    config.auth.apiKeyName &&
    config.auth.apiKeyValue
  ) {
    enabledParams.push({
      key: config.auth.apiKeyName,
      value: config.auth.apiKeyValue,
      enabled: true,
    });
  }

  if (enabledParams.length > 0) {
    const params = new URLSearchParams();
    enabledParams.forEach((p) => params.append(p.key, p.value));
    url += (url.includes('?') ? '&' : '?') + params.toString();
  }

  // Build headers
  const headers: Record<string, string> = {};

  // Add enabled custom headers
  config.headers
    .filter((h) => h.enabled && h.key)
    .forEach((h) => {
      headers[h.key] = h.value;
    });

  // Add Content-Type if body exists
  if (config.body && config.method !== 'GET' && config.method !== 'HEAD') {
    const contentType =
      config.contentType === 'custom' ? config.customContentType : config.contentType;
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
  }

  // Add auth headers
  switch (config.auth.type) {
    case 'basic':
      if (config.auth.username) {
        const credentials = btoa(`${config.auth.username}:${config.auth.password || ''}`);
        headers['Authorization'] = `Basic ${credentials}`;
      }
      break;
    case 'bearer':
      if (config.auth.token) {
        headers['Authorization'] = `Bearer ${config.auth.token}`;
      }
      break;
    case 'api-key':
      if (
        config.auth.apiKeyLocation === 'header' &&
        config.auth.apiKeyName &&
        config.auth.apiKeyValue
      ) {
        headers[config.auth.apiKeyName] = config.auth.apiKeyValue;
      }
      break;
    case 'custom':
      if (config.auth.customHeaderName && config.auth.customHeaderValue) {
        headers[config.auth.customHeaderName] = config.auth.customHeaderValue;
      }
      break;
  }

  // Build request options
  const requestOptions: RequestInit = {
    method: config.method,
    headers,
    redirect: config.followRedirects ? 'follow' : 'manual',
  };

  // Add body for non-GET/HEAD requests
  if (config.body && config.method !== 'GET' && config.method !== 'HEAD') {
    requestOptions.body = config.body;
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);
  requestOptions.signal = controller.signal;

  try {
    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    // Get response body
    const bodyText = await response.text();

    // Extract response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: bodyText,
      contentType: response.headers.get('content-type') || '',
      duration,
      size: new Blob([bodyText]).size,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${(config.timeout || 30000) / 1000} seconds`);
      }
      throw error;
    }
    throw new Error('An unknown error occurred');
  }
}

/**
 * Format response size in human-readable format
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Get status color class based on status code
 */
export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-500';
  if (status >= 300 && status < 400) return 'text-yellow-500';
  if (status >= 400 && status < 500) return 'text-orange-500';
  if (status >= 500) return 'text-red-500';
  return 'text-text-secondary';
}

/**
 * Try to format response body based on content type
 */
export function formatResponseBody(body: string, contentType: string): string {
  if (contentType.includes('application/json')) {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }
  return body;
}
