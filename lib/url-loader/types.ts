/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * URL Loader Types
 * Types for the universal URL/API data loader
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type AuthType = 'none' | 'basic' | 'bearer' | 'api-key' | 'custom';

export type ContentType =
  | 'application/json'
  | 'application/xml'
  | 'application/x-www-form-urlencoded'
  | 'multipart/form-data'
  | 'text/plain'
  | 'text/html'
  | 'text/xml'
  | 'custom';

export interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

export interface QueryParam {
  key: string;
  value: string;
  enabled: boolean;
}

export interface AuthConfig {
  type: AuthType;
  // Basic Auth
  username?: string;
  password?: string;
  // Bearer Token
  token?: string;
  // API Key
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyLocation?: 'header' | 'query';
  // Custom Header
  customHeaderName?: string;
  customHeaderValue?: string;
}

export interface RequestConfig {
  url: string;
  method: HttpMethod;
  headers: Header[];
  queryParams: QueryParam[];
  body: string;
  contentType: ContentType;
  customContentType?: string;
  auth: AuthConfig;
  timeout?: number;
  followRedirects?: boolean;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  contentType: string;
  duration: number;
  size: number;
}

export interface LoaderState {
  loading: boolean;
  error: string | null;
  response: ResponseData | null;
}

export const DEFAULT_REQUEST_CONFIG: RequestConfig = {
  url: '',
  method: 'GET',
  headers: [],
  queryParams: [],
  body: '',
  contentType: 'application/json',
  auth: { type: 'none' },
  timeout: 30000,
  followRedirects: true,
};

export const HTTP_METHODS: HttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
];

export const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'application/json', label: 'JSON' },
  { value: 'application/xml', label: 'XML' },
  { value: 'application/x-www-form-urlencoded', label: 'Form URL Encoded' },
  { value: 'multipart/form-data', label: 'Multipart Form' },
  { value: 'text/plain', label: 'Plain Text' },
  { value: 'text/html', label: 'HTML' },
  { value: 'text/xml', label: 'XML (text)' },
  { value: 'custom', label: 'Custom' },
];

export const AUTH_TYPES: {
  value: AuthType;
  label: string;
  description: string;
}[] = [
  { value: 'none', label: 'No Auth', description: 'No authentication' },
  { value: 'basic', label: 'Basic Auth', description: 'Username and password' },
  { value: 'bearer', label: 'Bearer Token', description: 'JWT or OAuth token' },
  {
    value: 'api-key',
    label: 'API Key',
    description: 'API key in header or query',
  },
  {
    value: 'custom',
    label: 'Custom Header',
    description: 'Custom auth header',
  },
];
