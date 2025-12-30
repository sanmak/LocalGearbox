/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Core tool type definitions
 * Every tool must conform to this interface
 */

export interface ToolSchema {
  type: 'string' | 'object' | 'array';
  description?: string;
  required?: boolean;
  maxLength?: number;
  pattern?: string;
  items?: ToolSchema;
  properties?: Record<string, ToolSchema>;
}

export interface Tool {
  id: string;
  name: string;
  category:
    | 'formatters'
    | 'validators'
    | 'encoders'
    | 'generators'
    | 'converters'
    | 'api'
    | 'dns'
    | 'testing'
    | 'workbenches'
    | 'parsers';
  description: string;
  inputSchema: ToolSchema;
  outputSchema: ToolSchema;
  process: (input: string) => Promise<string>;
  isDraft?: boolean;
}

export interface ToolCategory {
  id: string;
  name: string;
  icon: string;
}

export const TOOL_CATEGORIES: Record<string, ToolCategory> = {
  api: {
    id: 'api',
    name: 'API Client',
    icon: '🌐',
  },
  dns: {
    id: 'dns',
    name: 'DNS Tools',
    icon: '🌍',
  },
  testing: {
    id: 'testing',
    name: 'Testing',
    icon: '🧪',
  },
  workbenches: {
    id: 'workbenches',
    name: 'Workbenches',
    icon: '🔧',
  },
  parsers: {
    id: 'parsers',
    name: 'Parsers',
    icon: '📝',
  },
  formatters: {
    id: 'formatters',
    name: 'Formatters',
    icon: '✨',
  },
  validators: {
    id: 'validators',
    name: 'Validators',
    icon: '✓',
  },
  encoders: {
    id: 'encoders',
    name: 'Encoders',
    icon: '🔐',
  },
  generators: {
    id: 'generators',
    name: 'Generators',
    icon: '⚡',
  },
  converters: {
    id: 'converters',
    name: 'Converters',
    icon: '🔄',
  },
};

// API Client specific types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export type AuthType = 'none' | 'basic' | 'bearer' | 'api-key';

export type BodyType = 'none' | 'json' | 'form-data' | 'form-urlencoded' | 'raw';

export interface ApiHeader {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface ApiParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface ApiAuth {
  type: AuthType;
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  apiKeyLocation?: 'header' | 'query';
  apiKeyName?: string;
}

export interface ApiRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: ApiHeader[];
  params: ApiParam[];
  auth: ApiAuth;
  body: {
    type: BodyType;
    raw?: string;
    json?: string;
    formData?: Record<string, string>;
    formUrlEncoded?: Record<string, string>;
  };
  createdAt: number;
  updatedAt: number;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  size: number;
  time: number;
  timestamp: number;
}

// Environment Variables (Phase C)
export interface ApiVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface ApiEnvironment {
  id: string;
  name: string;
  variables: ApiVariable[];
  createdAt: number;
  updatedAt: number;
}

export interface ApiCollection {
  id: string;
  name: string;
  description?: string;
  requests: ApiRequest[];
  createdAt: number;
  updatedAt: number;
}

// Storage schema for Phase C
export interface ApiClientStorage {
  environments: ApiEnvironment[];
  globalVariables: ApiVariable[];
  collections: ApiCollection[];
  history: ApiRequest[];
  settings: {
    activeEnvironmentId?: string;
    maxHistorySize: number;
    autoSaveHistory: boolean;
  };
}
