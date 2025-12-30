/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Mock data for E2E tests
 */
export const mockData = {
  // JSON test data
  json: {
    valid: {
      simple: '{"name":"test","age":30}',
      nested: '{"user":{"name":"John","address":{"city":"NYC"}}}',
      array: '[1,2,3,4,5]',
      mixed: '{"users":[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]}',
      empty: '{}',
      emptyArray: '[]',
    },
    invalid: {
      missingBrace: '{"name":"test"',
      missingQuote: '{name:"test"}',
      trailingComma: '{"name":"test",}',
      singleQuotes: "{'name':'test'}",
    },
    large: generateLargeJSON(1000),
    formatted: `{
  "name": "test",
  "age": 30,
  "active": true
}`,
    minified: '{"name":"test","age":30,"active":true}',
  },

  // YAML test data
  yaml: {
    valid: `name: test
age: 30
active: true`,
    nested: `user:
  name: John
  address:
    city: NYC`,
  },

  // XML test data
  xml: {
    valid: '<user><name>John</name><age>30</age></user>',
    nested: '<users><user><name>Alice</name></user><user><name>Bob</name></user></users>',
    withAttributes: '<user id="1" active="true"><name>John</name></user>',
  },

  // HTML test data
  html: {
    valid: '<div><p>Hello World</p></div>',
    complex: '<div class="container"><h1>Title</h1><p>Paragraph</p></div>',
    withScripts: '<html><head><script>console.log("test")</script></head></html>',
  },

  // CSS test data
  css: {
    valid: '.test { color: red; font-size: 16px; }',
    minified: '.test{color:red;font-size:16px}',
  },

  // API test data
  api: {
    endpoints: {
      get: 'https://jsonplaceholder.typicode.com/posts/1',
      post: 'https://jsonplaceholder.typicode.com/posts',
      users: 'https://jsonplaceholder.typicode.com/users',
    },
    headers: {
      contentType: { 'Content-Type': 'application/json' },
      auth: { Authorization: 'Bearer test-token-123' },
    },
    bodies: {
      user: {
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      },
      post: {
        title: 'Test Post',
        body: 'This is a test post',
        userId: 1,
      },
    },
  },

  // Base64 test data
  base64: {
    text: 'Hello World',
    encoded: 'SGVsbG8gV29ybGQ=',
  },

  // URL test data
  url: {
    simple: 'https://example.com',
    withParams: 'https://example.com?foo=bar&baz=qux',
    encoded: 'https%3A%2F%2Fexample.com%2Fpath%3Ffoo%3Dbar',
    complex: 'https://user:pass@example.com:8080/path/to/page?query=value&other=123#section',
  },

  // JWT test data
  jwt: {
    valid:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  },

  // UUID test data
  uuid: {
    v4: '550e8400-e29b-41d4-a716-446655440000',
  },

  // Hash test data
  hash: {
    md5: '5d41402abc4b2a76b9719d911017c592', // "hello"
    sha256: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824', // "hello"
  },

  // Date/time test data
  datetime: {
    iso: '2024-01-15T10:30:00Z',
    epoch: 1705318200,
    formatted: 'January 15, 2024',
  },

  // SQL test data
  sql: {
    select: 'SELECT * FROM users WHERE age > 18 ORDER BY name',
    insert: "INSERT INTO users (name, email) VALUES ('John', 'john@example.com')",
    complex: `SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.active = true
GROUP BY u.name
HAVING COUNT(o.id) > 5`,
  },

  // CSV test data
  csv: {
    simple: 'name,age,city\nJohn,30,NYC\nAlice,25,LA',
    withQuotes: 'name,city\n"John Doe","New York, NY"\n"Alice Smith","Los Angeles, CA"',
  },

  // Edge cases
  edgeCases: {
    emptyString: '',
    whitespace: '   ',
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    unicode: '😀🎉🚀 中文 العربية',
    longString: 'a'.repeat(10000),
    nullCharacters: 'test\0null',
  },
};

/**
 * Generate large JSON for performance testing
 */
function generateLargeJSON(itemCount: number): string {
  const items = Array.from({ length: itemCount }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    description: `This is item number ${i + 1}`,
    price: Math.random() * 100,
    inStock: Math.random() > 0.5,
    tags: [`tag${i}`, `tag${i + 1}`, `tag${i + 2}`],
    metadata: {
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      version: 1,
    },
  }));

  return JSON.stringify({ items, total: itemCount });
}

/**
 * Generate random test data
 */
export const generateTestData = {
  randomString: (length = 10): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  },

  randomEmail: (): string => {
    return `test-${Date.now()}@example.com`;
  },

  randomNumber: (min = 0, max = 100): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  randomBoolean: (): boolean => {
    return Math.random() > 0.5;
  },

  randomJSON: (depth = 3): object => {
    if (depth === 0) {
      return { value: generateTestData.randomString() };
    }

    return {
      string: generateTestData.randomString(),
      number: generateTestData.randomNumber(),
      boolean: generateTestData.randomBoolean(),
      nested: generateTestData.randomJSON(depth - 1),
      array: [1, 2, 3],
    };
  },
};
