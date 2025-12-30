# Testing Guide for LocalGearbox

This guide provides comprehensive information about the testing strategy, setup, and best practices for LocalGearbox.

## Table of Contents

1. [Overview](#overview)
2. [Test Types](#test-types)
3. [Quick Start](#quick-start)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

---

## Overview

LocalGearbox uses a multi-layered testing strategy to ensure reliability:

- **Unit Tests** (Vitest): Testing individual functions and utilities
- **Component Tests** (Testing Library + Vitest): Testing React components
- **Integration Tests** (Testing Library + Vitest): Testing component interactions
- **E2E Tests** (Playwright): Testing complete user workflows
- **Accessibility Tests** (axe-core): Ensuring WCAG compliance
- **Visual Regression Tests** (Playwright): Preventing visual bugs

## Test Types

### Unit Tests (`/tests/unit`, `/lib/**/*.test.ts`)

Test individual functions, utilities, and business logic in isolation.

**Example:**

```typescript
import { describe, it, expect } from 'vitest';
import { formatJSON } from '@/lib/json/formatter';

describe('formatJSON', () => {
  it('should format valid JSON', () => {
    const input = '{"name":"test"}';
    const output = formatJSON(input);
    expect(output).toContain('\n');
  });
});
```

### Component Tests (`/components/**/*.test.tsx`)

Test React components in isolation.

**Example:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Tests (`/tests/e2e/specs`)

Test complete user workflows in a real browser.

**Example:**

```typescript
import { test, expect } from '@playwright/test';

test('should format JSON', async ({ page }) => {
  await page.goto('/tools/json-formatter');
  await page.fill('textarea', '{"name":"test"}');
  await expect(page.locator('[data-testid="output"]')).toBeVisible();
});
```

---

## Quick Start

### Prerequisites

- Node.js 24+
- npm or yarn
- Playwright browsers installed

### Installation

```bash
# Install all dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### First Test Run

```bash
# Run all unit tests
npm test

# Run E2E smoke tests
npm run test:e2e:smoke

# Run all tests
npm run test:all
```

---

## Running Tests

### Unit & Component Tests (Vitest)

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run only changed tests
npm run test:changed
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# Run specific test suites
npm run test:e2e:smoke        # Quick smoke tests
npm run test:e2e:critical     # Critical path tests
npm run test:e2e:a11y         # Accessibility tests
npm run test:e2e:visual       # Visual regression tests

# Run on specific browsers
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Run mobile tests
npm run test:e2e:mobile

# View test report
npm run test:e2e:report
```

### Running Specific Tests

```bash
# Vitest - run specific file
npm test -- lib/utils.test.ts

# Playwright - run specific file
npx playwright test home.spec.ts

# Playwright - run specific test
npx playwright test -g "should format JSON"

# Run tests matching pattern
npx playwright test json
```

---

## Writing Tests

### Adding Test IDs to Components

To make E2E tests reliable, add `data-testid` attributes:

```tsx
// ✅ Good - with test ID
<button data-testid="submit-button">Submit</button>
<textarea data-testid="tool-input" />
<div data-testid="tool-output">{output}</div>

// ❌ Avoid - relying on classes/structure
<button className="btn-primary">Submit</button>
```

### Best Practices

#### 1. Test Naming

```typescript
// ✅ Good - descriptive test names
test('should display error message when JSON is invalid');
test('should copy formatted output to clipboard');

// ❌ Bad - vague names
test('test1');
test('it works');
```

#### 2. AAA Pattern (Arrange-Act-Assert)

```typescript
test('should format JSON', async ({ page }) => {
  // Arrange - set up test conditions
  const input = '{"name":"test"}';

  // Act - perform actions
  await page.goto('/tools/json-formatter');
  await page.fill('textarea', input);

  // Assert - verify results
  const output = await page.locator('[data-testid="output"]').textContent();
  expect(output).toContain('name');
});
```

#### 3. Selectors Priority

```typescript
// 1. data-testid (most stable)
page.locator('[data-testid="submit-button"]');

// 2. Accessible selectors
page.getByRole('button', { name: 'Submit' });
page.getByLabel('Email address');
page.getByText('Welcome');

// 3. CSS selectors (last resort)
page.locator('.submit-btn');
```

#### 4. Waiting Strategies

```typescript
// ✅ Good - explicit waits
await page.waitForSelector('[data-testid="result"]');
await page.waitForLoadState('networkidle');
await expect(locator).toBeVisible();

// ❌ Bad - arbitrary timeouts
await page.waitForTimeout(3000); // Flaky!
```

### Using Custom Fixtures

We provide custom fixtures for common operations:

```typescript
import { test, expect } from '../../fixtures/toolFixtures';

test('should format JSON', async ({ toolPage }) => {
  await toolPage.navigate('json-formatter');
  await toolPage.enterInput('{"test": true}');
  const output = await toolPage.getOutput();
  expect(output).toContain('test');
});
```

### Writing Accessibility Tests

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have a11y violations', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

  expect(results.violations).toEqual([]);
});
```

### Writing Visual Tests

```typescript
test('should match visual baseline', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await expect(page).toHaveScreenshot('home.png', {
    fullPage: true,
    maxDiffPixels: 100,
  });
});
```

---

## Test Structure

```
/tests
  /e2e
    /specs
      /smoke              # Quick smoke tests (5-10 min)
      /critical-paths     # Critical user flows (15-20 min)
      /tools             # Individual tool tests
        /formatters
        /converters
        /validators
      /accessibility      # A11y tests
      /visual            # Visual regression tests
      /performance       # Performance tests
    /fixtures            # Custom test fixtures
      toolFixtures.ts
    /helpers             # Test helpers
      navigation.ts
      assertions.ts
    /utils               # Test utilities
      mockData.ts
  /integration           # Integration tests
  /unit                  # Unit tests
  setup.ts              # Test setup
  README.md             # This file
```

---

## CI/CD Integration

Tests run automatically on:

- Every push to `main` or `develop`
- Every pull request
- Manual workflow dispatch

### GitHub Actions Workflow

The E2E tests run in parallel across:

- Multiple browsers (Chromium, Firefox, WebKit)
- Multiple shards for faster execution
- Separate jobs for accessibility and visual tests

### Pre-commit Hooks

Unit tests run automatically before commits via Husky:

```bash
# .husky/pre-commit
npm run test:changed
```

### Pull Request Checks

All PRs must pass:

- ✅ Unit tests
- ✅ Smoke tests
- ✅ Linting
- ✅ Type checking
- ✅ Formatting

---

## Troubleshooting

### Common Issues

#### 1. Playwright browsers not installed

```bash
Error: Executable doesn't exist at ...
```

**Solution:**

```bash
npx playwright install
```

#### 2. Tests timing out

```bash
Error: Test timeout of 30000ms exceeded
```

**Solution:**

- Increase timeout in test or config
- Use proper wait strategies instead of arbitrary timeouts
- Check for network issues

#### 3. Flaky tests

**Symptoms:** Tests pass/fail inconsistently

**Solutions:**

- Use explicit waits: `await expect(locator).toBeVisible()`
- Avoid `waitForTimeout()` - use `waitForSelector()` instead
- Check for race conditions
- Use `test.describe.configure({ retries: 2 })`

#### 4. Visual regression failures

```bash
Error: Screenshot doesn't match baseline
```

**Solutions:**

- Review visual diff in test report
- Update baseline if change is intentional: `npm run test:e2e:visual -- --update-snapshots`
- Ensure animations are disabled for visual tests

#### 5. Accessibility violations

```bash
Error: 1 accessibility violation found
```

**Solutions:**

- Check the detailed violation report
- Fix the accessibility issue in the component
- If it's a known issue, document it and add to allowed list

### Debug Tools

#### Playwright UI Mode

Best way to debug E2E tests:

```bash
npm run test:e2e:ui
```

Features:

- Watch mode with live reload
- Time travel debugging
- Network inspection
- Console logs
- Screenshots

#### Playwright Debug Mode

Step through tests:

```bash
npm run test:e2e:debug
```

#### Playwright Inspector

```bash
npx playwright test --debug
```

#### View Test Report

```bash
npm run test:e2e:report
```

#### Trace Viewer

After test failure, view traces:

```bash
npx playwright show-trace trace.zip
```

---

## Performance Benchmarks

Expected test execution times:

| Test Suite        | Duration  | Frequency    |
| ----------------- | --------- | ------------ |
| Unit Tests        | 5-10s     | Every commit |
| Smoke Tests       | 2-5 min   | Every commit |
| E2E Critical      | 10-15 min | Every PR     |
| Full E2E Suite    | 20-30 min | Nightly      |
| Visual Regression | 5-10 min  | Every PR     |
| Accessibility     | 3-5 min   | Every PR     |

---

## Coverage Goals

| Type               | Target          | Current     |
| ------------------ | --------------- | ----------- |
| Unit Tests         | 80%             | ~34%        |
| E2E Critical Paths | 100%            | In Progress |
| Accessibility      | Zero violations | In Progress |
| Visual Baseline    | 100% key pages  | In Progress |

---

## Contributing

When adding new features:

1. ✅ Add unit tests for utilities/functions
2. ✅ Add component tests for React components
3. ✅ Add E2E tests for user-facing features
4. ✅ Update visual baselines if UI changes
5. ✅ Run accessibility tests
6. ✅ Ensure all tests pass locally before pushing

---

## Resources

### Documentation

- [Playwright Docs](https://playwright.dev)
- [Vitest Docs](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [axe-core](https://github.com/dequelabs/axe-core)

### Best Practices

- [Testing Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Web Accessibility](https://www.w3.org/WAI/)

### Internal

- [Testing Strategy](../TESTING_STRATEGY.md) - Comprehensive testing strategy document

---

## Support

If you encounter issues:

1. Check this README
2. Check the [Testing Strategy](../TESTING_STRATEGY.md)
3. Review test examples in `/tests/e2e/specs`
4. Open an issue on GitHub

---

**Happy Testing! 🧪**
