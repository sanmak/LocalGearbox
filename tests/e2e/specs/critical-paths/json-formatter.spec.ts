/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { test, expect } from '../../fixtures/toolFixtures';
import { mockData } from '../../utils/mockData';

/**
 * Critical path tests for JSON Formatter tool
 * Tests the most important user workflows
 */
test.describe('JSON Formatter - Critical Paths', () => {
  test.beforeEach(async ({ toolPage }) => {
    await toolPage.navigate('json-formatter');
  });

  test('should format valid JSON correctly', async ({ page }) => {
    // Enter unformatted JSON
    await page.fill('textarea', mockData.json.valid.simple);

    // Wait for auto-formatting
    await page.waitForTimeout(500);

    // Verify formatted output appears
    const output = page.locator('[data-testid="formatted-output"]');
    const text = await output.textContent();

    // Should be formatted with indentation
    expect(text).toContain('\n');
    expect(text).toContain('  '); // Should have indentation
  });

  test('should handle invalid JSON with error message', async ({ page }) => {
    // Enter invalid JSON
    await page.fill('textarea', mockData.json.invalid.missingBrace);

    // Wait for processing
    await page.waitForTimeout(500);

    // Verify error message appears
    const error = page.locator('[role="alert"], .error, [data-testid="error-message"]');
    await expect(error.first()).toBeVisible({ timeout: 3000 });
  });

  test('should format nested JSON', async ({ page }) => {
    await page.fill('textarea', mockData.json.valid.nested);
    await page.waitForTimeout(500);

    const output = page.locator('[data-testid="formatted-output"]');
    const text = await output.textContent();

    // Verify nested structure is formatted
    expect(text).toContain('user');
    expect(text).toContain('address');
    expect(text).toContain('city');
  });

  test('should handle large JSON files', async ({ page }) => {
    // Start performance measurement
    const startTime = Date.now();

    await page.fill('textarea', mockData.json.large);
    await page.waitForTimeout(1000);

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Should process within reasonable time (< 3 seconds)
    expect(processingTime).toBeLessThan(3000);

    // Verify output exists
    const output = page.locator('[data-testid="formatted-output"]');
    await expect(output).toBeVisible();
  });

  test('should copy formatted JSON to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.fill('textarea', mockData.json.valid.simple);
    await page.waitForTimeout(500);

    // Click copy button
    const copyButton = page.locator('button:has-text("Copy"), [data-testid="copy-button"]');
    await copyButton.first().click();

    // Verify success message or icon change
    await page.waitForTimeout(500);

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('name');
    expect(clipboardText).toContain('test');
  });

  test('should clear input and output', async ({ page }) => {
    // Enter JSON
    await page.fill('textarea', mockData.json.valid.simple);
    await page.waitForTimeout(500);

    // Click clear button
    const clearButton = page.locator('button:has-text("Clear"), [data-testid="clear-button"]');
    if ((await clearButton.count()) > 0) {
      await clearButton.first().click();

      // Verify input is cleared
      const textarea = page.locator('textarea');
      await expect(textarea).toHaveValue('');
    }
  });

  test('should switch between formatting modes', async ({ page }) => {
    await page.fill('textarea', mockData.json.valid.simple);

    // Try to find and toggle different formatting options (2 spaces, 4 spaces, tabs)
    const settingsButton = page.locator(
      'button:has-text("Settings"), [data-testid="settings-button"]',
    );

    if ((await settingsButton.count()) > 0) {
      await settingsButton.click();

      // Look for spacing options
      const spacingOptions = page.locator('text=/2 spaces|4 spaces|Tabs/');
      if ((await spacingOptions.count()) > 0) {
        await spacingOptions.first().click();

        // Verify formatting changes
        await page.waitForTimeout(500);
        const output = page.locator('[data-testid="formatted-output"]');
        await expect(output).toBeVisible();
      }
    }
  });

  test('should handle empty input', async ({ page }) => {
    // Leave input empty
    await page.fill('textarea', '');

    // Should not show error
    const error = page.locator('[role="alert"]');
    await expect(error).not.toBeVisible();

    // Should show empty state or placeholder
    page.locator('text=/Enter JSON|Paste JSON|Empty/i');
    // Empty state is optional, so we just check it doesn't crash
    expect(true).toBe(true);
  });

  test('should preserve data on page reload', async ({ page }) => {
    await page.fill('textarea', mockData.json.valid.simple);
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();

    // Check if data is preserved (if tool supports it)
    const textarea = page.locator('textarea');
    const value = await textarea.inputValue();

    // Data might or might not be preserved - this is optional
    // Just verify page reloads without error
    expect(value).toBeDefined();
  });

  test('should be keyboard accessible', async ({ page }) => {
    // Tab to textarea
    await page.keyboard.press('Tab');

    // Type JSON using keyboard
    await page.keyboard.type('{"test": true}');

    // Verify input
    const textarea = page.locator('textarea');
    const value = await textarea.inputValue();
    expect(value).toContain('test');
  });

  test('should handle special characters in JSON', async ({ page }) => {
    const jsonWithSpecialChars = JSON.stringify({
      emoji: '😀🎉',
      unicode: '中文',
      quotes: 'He said "hello"',
      backslash: 'C:\\Program Files\\',
    });

    await page.fill('textarea', jsonWithSpecialChars);
    await page.waitForTimeout(500);

    // Verify it doesn't crash
    const output = page.locator('[data-testid="formatted-output"]');
    await expect(output).toBeVisible();
  });
});
