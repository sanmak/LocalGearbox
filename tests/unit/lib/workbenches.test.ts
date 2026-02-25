/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import {
  lintOpenAPISpec,
  lintProtoSpec,
  processContractWorkbench,
} from '@/lib/tools/workbenches/openapi-grpc-workbench';

describe('lintOpenAPISpec', () => {
  const validSpec = JSON.stringify({
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {
      '/users': {
        get: {
          operationId: 'getUsers',
          responses: { '200': { description: 'OK' } },
        },
      },
    },
  });

  it('should validate a correct OpenAPI spec', async () => {
    const result = JSON.parse(await lintOpenAPISpec(validSpec));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should report missing openapi field', async () => {
    const spec = JSON.stringify({ info: { title: 'Test', version: '1.0.0' }, paths: {} });
    const result = JSON.parse(await lintOpenAPISpec(spec));
    expect(result.errors).toContain("Missing 'openapi' field - not a valid OpenAPI spec");
  });

  it('should report missing info object', async () => {
    const spec = JSON.stringify({ openapi: '3.0.0', paths: {} });
    const result = JSON.parse(await lintOpenAPISpec(spec));
    expect(result.errors).toContain("Missing 'info' object");
  });

  it('should report missing info.title', async () => {
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { version: '1.0.0' },
      paths: {},
    });
    const result = JSON.parse(await lintOpenAPISpec(spec));
    expect(result.errors).toContain("Missing 'info.title'");
  });

  it('should report missing info.version', async () => {
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test' },
      paths: {},
    });
    const result = JSON.parse(await lintOpenAPISpec(spec));
    expect(result.errors).toContain("Missing 'info.version'");
  });

  it('should report missing paths', async () => {
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
    });
    const result = JSON.parse(await lintOpenAPISpec(spec));
    expect(result.errors).toContain("Missing or invalid 'paths' object");
  });

  it('should warn about empty paths', async () => {
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
    });
    const result = JSON.parse(await lintOpenAPISpec(spec));
    expect(result.warnings).toContain('No paths defined in the spec');
  });

  it('should warn about missing operationId', async () => {
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/users': {
          get: { responses: { '200': { description: 'OK' } } },
        },
      },
    });
    const result = JSON.parse(await lintOpenAPISpec(spec));
    expect(result.warnings.some((w: string) => w.includes('missing operationId'))).toBe(true);
  });

  it('should report missing responses', async () => {
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/users': {
          get: { operationId: 'getUsers' },
        },
      },
    });
    const result = JSON.parse(await lintOpenAPISpec(spec));
    expect(result.errors.some((e: string) => e.includes('missing responses'))).toBe(true);
  });

  it('should return invalid JSON error for non-JSON', async () => {
    const result = JSON.parse(await lintOpenAPISpec('not json'));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Invalid JSON');
  });

  it('should throw on empty input', async () => {
    await expect(lintOpenAPISpec('')).rejects.toThrow();
  });

  it('should include summary with path and operation counts', async () => {
    const result = JSON.parse(await lintOpenAPISpec(validSpec));
    expect(result.summary.paths).toBe(1);
    expect(result.summary.operations).toBe(1);
  });

  it('should warn about non-3.x openapi versions', async () => {
    const spec = JSON.stringify({
      openapi: '2.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
    });
    const result = JSON.parse(await lintOpenAPISpec(spec));
    expect(result.warnings.some((w: string) => w.includes('optimized for 3.x'))).toBe(true);
  });

  it('should warn about path with no operations', async () => {
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: { '/empty': {} },
    });
    const result = JSON.parse(await lintOpenAPISpec(spec));
    expect(result.warnings.some((w: string) => w.includes('no operations'))).toBe(true);
  });

  it('should handle multiple HTTP methods on a path', async () => {
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/users': {
          get: { operationId: 'getUsers', responses: { '200': { description: 'OK' } } },
          post: { operationId: 'createUser', responses: { '201': { description: 'Created' } } },
        },
      },
    });
    const result = JSON.parse(await lintOpenAPISpec(spec));
    expect(result.valid).toBe(true);
    expect(result.summary.operations).toBe(2);
  });

  it('should handle spec with components.schemas', async () => {
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        schemas: { User: { type: 'object' } },
      },
    });
    const result = JSON.parse(await lintOpenAPISpec(spec));
    // Should not throw; schemas section should be handled
    expect(result).toBeDefined();
  });
});

describe('lintProtoSpec', () => {
  const validProto = `syntax = "proto3";

message User {
  string name = 1;
  int32 age = 2;
}

service UserService {
  rpc GetUser(User) returns (User);
}`;

  it('should validate valid proto3 syntax', async () => {
    const result = JSON.parse(await lintProtoSpec(validProto));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should count messages and services', async () => {
    const result = JSON.parse(await lintProtoSpec(validProto));
    expect(result.summary.messages).toBe(1);
    expect(result.summary.services).toBe(1);
  });

  it('should detect unmatched braces', async () => {
    const proto = 'message User {\n  string name = 1;\n';
    const result = JSON.parse(await lintProtoSpec(proto));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Unmatched braces in proto file');
  });

  it('should warn about required fields in proto3', async () => {
    const proto = 'syntax = "proto3";\nmessage User {\n  required string name = 1;\n}\n';
    const result = JSON.parse(await lintProtoSpec(proto));
    expect(result.warnings.some((w: string) => w.includes('required'))).toBe(true);
  });

  it('should warn about non-proto3 syntax', async () => {
    const proto = 'syntax = "proto2";\nmessage User {\n  string name = 1;\n}\n';
    const result = JSON.parse(await lintProtoSpec(proto));
    expect(result.warnings.some((w: string) => w.includes('Non-proto3'))).toBe(true);
  });

  it('should throw on empty input', async () => {
    await expect(lintProtoSpec('')).rejects.toThrow();
  });

  it('should count line numbers', async () => {
    const result = JSON.parse(await lintProtoSpec(validProto));
    expect(result.summary.lines).toBeGreaterThan(0);
  });
});

describe('processContractWorkbench', () => {
  it('should route to openapi linter with structured input', async () => {
    const input = JSON.stringify({
      type: 'openapi',
      spec: JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      }),
    });
    const result = JSON.parse(await processContractWorkbench(input));
    expect(result).toBeDefined();
  });

  it('should route to grpc linter with structured input', async () => {
    const input = JSON.stringify({
      type: 'grpc',
      spec: 'syntax = "proto3";\nmessage User {\n  string name = 1;\n}\n',
    });
    const result = JSON.parse(await processContractWorkbench(input));
    expect(result.valid).toBe(true);
  });

  it('should reject unknown type', async () => {
    const input = JSON.stringify({ type: 'unknown', spec: 'something' });
    const result = JSON.parse(await processContractWorkbench(input));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Unknown contract type');
  });

  it('should auto-detect openapi from content', async () => {
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
    });
    const result = JSON.parse(await processContractWorkbench(spec));
    expect(result).toBeDefined();
  });

  it('should auto-detect proto from content', async () => {
    const proto = 'syntax = "proto3";\nmessage User {\n  string name = 1;\n}\n';
    const result = JSON.parse(await processContractWorkbench(proto));
    expect(result.valid).toBe(true);
  });

  it('should return error for undetectable content', async () => {
    const result = JSON.parse(await processContractWorkbench('random text here'));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Unable to detect contract type');
  });

  it('should throw on empty input', async () => {
    await expect(processContractWorkbench('')).rejects.toThrow();
  });
});
