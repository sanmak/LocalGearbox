/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * TOOL PROCESSOR TEMPLATE
 *
 * Use this template when creating new tool processors.
 * Follow these guidelines for consistency, security, and maintainability.
 *
 * SECURITY CHECKLIST:
 * - ✅ Input validation (empty checks, size limits)
 * - ✅ No eval(), Function(), or dynamic code execution
 * - ✅ No external API calls (use API routes instead)
 * - ✅ Proper error handling with clear messages
 * - ✅ HTML/Script sanitization if processing user HTML
 *
 * PERFORMANCE CHECKLIST:
 * - ✅ Pure, side-effect-free functions
 * - ✅ Async functions for consistency
 * - ✅ Size limits to prevent resource exhaustion
 * - ✅ Efficient algorithms (avoid nested loops where possible)
 *
 * CATEGORY GUIDELINES:
 * - formatters/: JSON, XML, HTML, CSS formatting tools
 * - validators/: Input validation and syntax checking
 * - encoders/: URL, Base64, HTML entity encoding/decoding
 * - converters/: Format conversion (JSON ↔ CSV, JSON ↔ XML, etc.)
 * - generators/: UUID, hash, timestamp generation
 * - crypto/: Hash functions, JWT decoding (no signature verification)
 * - text/: String manipulation (reverse, case conversion, etc.)
 * - minifiers/: Code minification (JS, CSS, HTML, etc.)
 * - network/: API client, DNS tools (implement in API routes)
 */

import { validateInput, validateNotEmpty, JSON_SIZE_LIMIT } from '../shared';

/**
 * Template processor function
 *
 * @param input - User input string
 * @returns Processed output string
 * @throws Error with clear message if processing fails
 *
 * NAMING CONVENTION:
 * - Use descriptive camelCase names
 * - Start with action verb: format, validate, encode, decode, generate, convert
 * - Examples: formatJSON, validateXML, encodeBase64, generateUUID
 */
export const templateProcessor = async (input: string): Promise<string> => {
  // Step 1: Validate input (required for all processors)
  validateInput(input, JSON_SIZE_LIMIT); // Use appropriate size limit

  // Alternative validations:
  // validateNotEmpty(input); // For simple non-empty check
  // validateSizeLimit(input, TEXT_SIZE_LIMIT); // For custom size limit

  // Step 2: Additional validation (if needed)
  // Example: Check for specific format, patterns, or constraints
  // if (!isValidFormat(input)) {
  //   throw new Error("Invalid input format");
  // }

  // Step 3: Process the input
  try {
    // Your processing logic here
    // Keep it pure - no side effects, no external calls

    const processed = input; // Replace with actual logic

    return processed;
  } catch (error) {
    // Step 4: Error handling
    if (error instanceof Error) {
      // Re-throw with clear message
      throw new Error(`Failed to process input: ${error.message}`);
    }
    // Generic error fallback
    throw new Error('Failed to process input');
  }
};

/**
 * Example: JSON processor with all best practices
 */
export const exampleFormatJSON = async (input: string): Promise<string> => {
  // Validation
  validateInput(input, JSON_SIZE_LIMIT);

  try {
    // Parse and format
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Example: Encoding processor
 */
export const exampleEncodeBase64 = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  try {
    return Buffer.from(input, 'utf-8').toString('base64');
  } catch (error) {
    throw new Error('Failed to encode to Base64');
  }
};

/**
 * Example: Generator processor (no input validation needed)
 */
export const exampleGenerateUUID = async (): Promise<string> => {
  // No input needed for generators
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * TESTING YOUR PROCESSOR:
 *
 * 1. Test with valid input
 * 2. Test with empty input (should throw error)
 * 3. Test with invalid input (should throw clear error)
 * 4. Test with large input (should respect size limits)
 * 5. Test with edge cases (special characters, unicode, etc.)
 *
 * Example test cases:
 * - Valid: '{"name": "test"}' → formatted JSON
 * - Empty: '' → Error: "Input cannot be empty"
 * - Invalid: '{invalid}' → Error: "Invalid JSON: ..."
 * - Large: 15MB string → Error: "Input exceeds size limit of 10MB"
 */

/**
 * ADDING TO REGISTRY:
 *
 * After creating your processor:
 *
 * 1. Export from category index.ts:
 *    // In lib/tools/formatters/index.ts
 *    export * from './your-tool';
 *
 * 2. Add to lib/tool-registry.ts:
 *    import { yourProcessor } from "./tools";
 *
 *    "your-tool-id": {
 *      id: "your-tool-id",
 *      name: "Your Tool Name",
 *      category: "formatters", // or appropriate category
 *      description: "Clear description of what it does",
 *      inputSchema: { type: "string", required: true },
 *      outputSchema: { type: "string" },
 *      process: yourProcessor,
 *    }
 *
 * 3. Create tool page in app/tools/:
 *    // app/tools/your-tool-id.tsx
 *    import { ToolLayout } from "@/components/ToolLayout";
 *    import { TOOLS } from "@/lib/tool-registry";
 *
 *    export default function YourToolPage() {
 *      return <ToolLayout tool={TOOLS["your-tool-id"]} />;
 *    }
 *
 * 4. Verify:
 *    - npm run type-check (no errors)
 *    - npm run build (successful)
 *    - Test in browser
 */
