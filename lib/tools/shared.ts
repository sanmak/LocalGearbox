/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Shared constants and utilities for tool processors
 * Centralized configuration for size limits, validation, and common utilities
 */

// Size limits
export const JSON_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
export const XML_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
export const HTML_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
export const TEXT_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
export const URL_SIZE_LIMIT = 1 * 1024 * 1024; // 1MB

/**
 * Validates input is not empty
 */
export const validateNotEmpty = (input: string, fieldName = 'Input'): void => {
  if (!input || !input.trim()) {
    throw new Error(`${fieldName} cannot be empty`);
  }
};

/**
 * Validates input size limit
 */
export const validateSizeLimit = (input: string, limit: number, unit = 'MB'): void => {
  if (input.length > limit) {
    const limitMB = limit / 1024 / 1024;
    throw new Error(`Input exceeds size limit of ${limitMB}${unit}`);
  }
};

/**
 * Base validation for most text-based processors
 */
export const validateInput = (input: string, sizeLimit: number = JSON_SIZE_LIMIT): void => {
  validateNotEmpty(input);
  validateSizeLimit(input, sizeLimit);
};

/**
 * Checks if input is valid XML using DOMParser
 * Security Note: Uses 'application/xml' MIME type which does not execute scripts.
 * The parsed document is only used to check for parser errors and is never inserted into the DOM.
 */
export const isValidXML = (input: string): boolean => {
  try {
    const parser = new DOMParser();
    // Safe: application/xml MIME type does not execute scripts
    // The document is only used for validation and never inserted into the DOM
    const doc = parser.parseFromString(input, 'application/xml');
    const hasErrors = doc.getElementsByTagName('parsererror').length > 0;
    return !hasErrors;
  } catch {
    return false;
  }
};

/**
 * Validates HTML for security issues (scripts, event handlers)
 */
export const validateHTMLSecurity = (html: string): void => {
  // Check for <script> tags (including variations with whitespace in closing tags)
  const scriptPattern = /<script[^>]*>.*?<\/script\s*>/gis;
  if (scriptPattern.test(html)) {
    throw new Error('HTML contains <script> tags which are not allowed for security reasons');
  }

  // Check for event handlers (onclick, onload, etc.)
  const eventPattern = /\son\w+\s*=/gi;
  if (eventPattern.test(html)) {
    throw new Error(
      'HTML contains event handlers (onclick, onload, etc.) which are not allowed for security reasons',
    );
  }
};

/**
 * Sample data for testing and examples
 */
export const SAMPLE_JSON = `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "country": "USA"
  },
  "hobbies": ["reading", "coding", "gaming"]
}`;

export const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title>The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price>10.99</price>
  </book>
  <book category="non-fiction">
    <title>Sapiens</title>
    <author>Yuval Noah Harari</author>
    <year>2011</year>
    <price>15.99</price>
  </book>
</bookstore>`;

export const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sample Page</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }
    h1 {
      color: #333;
    }
  </style>
</head>
<body>
  <h1>Welcome</h1>
  <p>This is a sample HTML page.</p>
</body>
</html>`;

export const SAMPLE_TEXT =
  'Hello, World! This is a sample text for testing various text processing tools.';

export const SAMPLE_URL = 'https://example.com/path?query=value&another=123#fragment';

export const SAMPLE_BASE64 = 'SGVsbG8sIFdvcmxkISBUaGlzIGlzIGEgc2FtcGxl';

export const SAMPLE_HTML_ENTITIES = `<p>Hello & welcome to our "website"!</p>`;

export const SAMPLE_JSON_STRING = `{"message": "Hello \\"World\\"!", "value": 42}`;

export const SAMPLE_CSV_DATA = `Name, Age, City
John Doe, 30, New York
Jane Smith, 25, Los Angeles
Bob Johnson, 35, Chicago`;

export const SAMPLE_API_REQUEST = `{
  "method": "GET",
  "url": "https://api.github.com/users/github",
  "headers": {
    "Accept": "application/json"
  }
}`;
