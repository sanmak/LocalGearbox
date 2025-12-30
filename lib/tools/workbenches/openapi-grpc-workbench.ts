/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * OpenAPI/gRPC Contract Workbench
 * Tools for working with API contracts: linting, diffing, sample generation
 */

import { validateInput, JSON_SIZE_LIMIT } from '../shared';

/**
 * Safe JSON parse that returns null on failure
 */
function safeJsonParse(input: string): any | null {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

/**
 * Basic OpenAPI specification linter
 * Validates structure and common issues
 */
export async function lintOpenAPISpec(input: string): Promise<string> {
  validateInput(input, JSON_SIZE_LIMIT);

  try {
    if (!input.trim()) {
      return JSON.stringify(
        {
          valid: false,
          errors: ['Input is empty'],
        },
        null,
        2,
      );
    }

    // Try to parse as JSON first
    let spec: any;
    try {
      spec = JSON.parse(input);
    } catch (parseError) {
      return JSON.stringify(
        {
          valid: false,
          errors: [
            `Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          ],
        },
        null,
        2,
      );
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check OpenAPI version
    if (!spec.openapi) {
      errors.push("Missing 'openapi' field - not a valid OpenAPI spec");
    } else if (!spec.openapi.startsWith('3.')) {
      warnings.push(`OpenAPI version ${spec.openapi} detected - this tool is optimized for 3.x`);
    }

    // Check info object
    if (!spec.info) {
      errors.push("Missing 'info' object");
    } else {
      if (!spec.info.title) {
        errors.push("Missing 'info.title'");
      }
      if (!spec.info.version) {
        errors.push("Missing 'info.version'");
      }
    }

    // Check paths
    if (!spec.paths || typeof spec.paths !== 'object') {
      errors.push("Missing or invalid 'paths' object");
    } else {
      const pathCount = Object.keys(spec.paths).length;
      if (pathCount === 0) {
        warnings.push('No paths defined in the spec');
      }

      // Check each path
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        if (!pathItem || typeof pathItem !== 'object') {
          errors.push(`Path '${path}' is not an object`);
          continue;
        }

        // Check HTTP methods
        const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
        const definedMethods = methods.filter((method) => (pathItem as any)[method]);

        if (definedMethods.length === 0) {
          warnings.push(`Path '${path}' has no operations defined`);
        }

        // Check each operation
        for (const method of definedMethods) {
          const operation = (pathItem as any)[method];
          if (!operation.operationId) {
            warnings.push(`Operation ${method.toUpperCase()} ${path} missing operationId`);
          }
          if (!operation.responses) {
            errors.push(`Operation ${method.toUpperCase()} ${path} missing responses`);
          }
        }
      }
    }

    // Check components
    if (spec.components) {
      if (spec.components.schemas) {
        const schemaCount = Object.keys(spec.components.schemas).length;
        if (schemaCount > 0) {
          // Basic schema validation could be added here
        }
      }
    }

    const valid = errors.length === 0;

    return JSON.stringify(
      {
        valid,
        errors,
        warnings,
        summary: {
          paths: spec.paths ? Object.keys(spec.paths).length : 0,
          operations: spec.paths
            ? Object.values(spec.paths).reduce((count: number, pathItem: any) => {
                const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
                return count + methods.filter((method) => pathItem[method]).length;
              }, 0)
            : 0,
        },
      },
      null,
      2,
    );
  } catch (error) {
    return JSON.stringify(
      {
        valid: false,
        errors: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      },
      null,
      2,
    );
  }
}

/**
 * Placeholder for gRPC proto linter
 * Basic syntax validation for .proto files
 */
export async function lintProtoSpec(input: string): Promise<string> {
  validateInput(input, JSON_SIZE_LIMIT);

  try {
    if (!input.trim()) {
      return JSON.stringify(
        {
          valid: false,
          errors: ['Input is empty'],
        },
        null,
        2,
      );
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic checks for proto syntax
    const lines = input.split('\n');
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      // Count braces
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;

      // Check for syntax keywords
      if (line.startsWith('syntax ')) {
        if (!line.includes('"proto3"')) {
          warnings.push(`Line ${lineNum}: Non-proto3 syntax detected`);
        }
      }

      if (line.includes('required ') && !line.includes('//')) {
        warnings.push(`Line ${lineNum}: 'required' fields are deprecated in proto3`);
      }
    }

    if (braceCount !== 0) {
      errors.push('Unmatched braces in proto file');
    }

    const valid = errors.length === 0;

    return JSON.stringify(
      {
        valid,
        errors,
        warnings,
        summary: {
          lines: lines.length,
          messages: (input.match(/message\s+\w+/g) || []).length,
          services: (input.match(/service\s+\w+/g) || []).length,
        },
      },
      null,
      2,
    );
  } catch (error) {
    return JSON.stringify(
      {
        valid: false,
        errors: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      },
      null,
      2,
    );
  }
}

/**
 * Main workbench processor
 * Routes to appropriate linter based on input type
 */
export async function processContractWorkbench(input: string): Promise<string> {
  validateInput(input, JSON_SIZE_LIMIT);

  try {
    const parsed = safeJsonParse(input);
    if (parsed && typeof parsed === 'object' && 'type' in parsed) {
      // Structured input with type and spec
      const { type, spec } = parsed as { type: string; spec: string };
      if (type === 'openapi') {
        return await lintOpenAPISpec(spec);
      } else if (type === 'grpc') {
        return await lintProtoSpec(spec);
      } else {
        return JSON.stringify(
          {
            valid: false,
            errors: ["Unknown contract type. Use 'openapi' or 'grpc'"],
          },
          null,
          2,
        );
      }
    } else {
      // Treat input as spec directly - auto-detect type from content
      if (input.includes('openapi:') || input.includes('"openapi"')) {
        return await lintOpenAPISpec(input);
      } else if (
        input.includes('syntax ') ||
        input.includes('message ') ||
        input.includes('service ')
      ) {
        return await lintProtoSpec(input);
      } else {
        return JSON.stringify(
          {
            valid: false,
            errors: [
              "Unable to detect contract type. Please specify 'type' field or ensure content contains OpenAPI or proto syntax",
            ],
          },
          null,
          2,
        );
      }
    }
  } catch (error) {
    return JSON.stringify(
      {
        valid: false,
        errors: [`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      },
      null,
      2,
    );
  }
}
