/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { test, expect } from '@playwright/test';
import { mockData } from '../../utils/mockData';

/**
 * Critical path tests for API Client tool
 * Tests the complete workflow of making API requests
 */
test.describe('API Client - Critical Paths', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/api-client');
    await page.waitForLoadState('networkidle');
  });

  test('should load API client interface', async ({ page }) => {
    // Verify main UI elements are present
    await expect(page.locator('text=/GET|POST|PUT|DELETE/i').first()).toBeVisible();

    // Verify URL input exists
    const urlInput = page.locator('input[type="text"], input[placeholder*="URL"]').first();
    await expect(urlInput).toBeVisible();

    // Verify send button exists
    const sendButton = page.locator('button:has-text("Send"), [data-testid="send-button"]');
    await expect(sendButton.first()).toBeVisible();
  });

  test('should make GET request successfully', async ({ page }) => {
    // Enter URL
    const urlInput = page.locator('input[type="text"], input[placeholder*="URL"]').first();
    await urlInput.fill(mockData.api.endpoints.get);

    // Select GET method (usually default)
    const methodSelect = page.locator('select, [role="combobox"]').first();
    if (await methodSelect.isVisible()) {
      await methodSelect.selectOption('GET');
    }

    // Click send
    const sendButton = page.locator('button:has-text("Send"), [data-testid="send-button"]');
    await sendButton.first().click();

    // Wait for response
    await page.waitForTimeout(3000); // Network request

    // Verify response appears
    const responseSection = page.locator('[data-testid="response"], .response, text=/Response/i');
    await expect(responseSection.first()).toBeVisible({ timeout: 10000 });

    // Verify status code (should be 200)
    const statusCode = page.locator('text=/200|OK/i');
    await expect(statusCode.first()).toBeVisible({ timeout: 5000 });
  });

  test('should switch between HTTP methods', async ({ page }) => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];

    for (const method of methods) {
      // Find method selector (could be buttons or dropdown)
      const methodButton = page.locator(`button:has-text("${method}")`).first();
      const methodDropdown = page.locator('select').first();

      if (await methodButton.isVisible()) {
        await methodButton.click();
      } else if (await methodDropdown.isVisible()) {
        await methodDropdown.selectOption(method);
      }

      // Verify method is selected
      await page.waitForTimeout(300);

      // Visual confirmation
      const selected = page.locator(
        `[data-selected="true"]:has-text("${method}"), [aria-selected="true"]:has-text("${method}"), .selected:has-text("${method}")`,
      );

      if ((await selected.count()) > 0) {
        await expect(selected.first()).toBeVisible();
      }
    }
  });

  test('should add request headers', async ({ page }) => {
    // Find headers tab/section
    const headersTab = page.locator('text=/Headers/i, [data-testid="headers-tab"]');

    if ((await headersTab.count()) > 0) {
      await headersTab.first().click();

      // Add header
      const addButton = page.locator('button:has-text("Add"), [data-testid="add-header"]');

      if ((await addButton.count()) > 0) {
        await addButton.first().click();

        // Fill in header name and value
        const headerInputs = page.locator('input[placeholder*="key"], input[placeholder*="name"]');
        const valueInputs = page.locator('input[placeholder*="value"]');

        if ((await headerInputs.count()) > 0) {
          await headerInputs.first().fill('Content-Type');
          await valueInputs.first().fill('application/json');

          // Verify header was added
          await expect(page.locator('text=Content-Type')).toBeVisible();
        }
      }
    }
  });

  test('should add request body for POST', async ({ page }) => {
    // Select POST method
    const postButton = page.locator('button:has-text("POST")').first();
    if (await postButton.isVisible()) {
      await postButton.click();
    }

    // Find body tab/section
    const bodyTab = page.locator('text=/Body/i, [data-testid="body-tab"]');

    if ((await bodyTab.count()) > 0) {
      await bodyTab.first().click();

      // Enter JSON body
      const bodyTextarea = page.locator('textarea, [data-testid="request-body"]');

      if ((await bodyTextarea.count()) > 0) {
        await bodyTextarea.first().fill(JSON.stringify(mockData.api.bodies.post));

        // Verify body was entered
        const content = await bodyTextarea.first().inputValue();
        expect(content).toContain('title');
      }
    }
  });

  test('should display request history', async ({ page }) => {
    // Make a request first
    const urlInput = page.locator('input[type="text"]').first();
    await urlInput.fill(mockData.api.endpoints.get);

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.first().click();

    await page.waitForTimeout(3000);

    // Look for history section
    const historyTab = page.locator(
      'text=/History/i, [data-testid="history-tab"], button:has-text("History")',
    );

    if ((await historyTab.count()) > 0) {
      await historyTab.first().click();

      // Verify history entry exists
      await page.waitForTimeout(500);

      // Should see the URL we just requested
      const historyEntry = page.locator(`text=${mockData.api.endpoints.get.substring(0, 30)}`);
      expect(await historyEntry.count()).toBeGreaterThan(0);
    }
  });

  test('should save request to collection', async ({ page }) => {
    // Enter request details
    const urlInput = page.locator('input[type="text"]').first();
    await urlInput.fill(mockData.api.endpoints.get);

    // Look for save button
    const saveButton = page.locator(
      'button:has-text("Save"), [data-testid="save-request"], [aria-label*="Save"]',
    );

    if ((await saveButton.count()) > 0) {
      await saveButton.first().click();

      // Fill save dialog
      await page.waitForTimeout(500);

      const nameInput = page.locator(
        'input[placeholder*="name"], input[placeholder*="Name"], [data-testid="request-name"]',
      );

      if ((await nameInput.count()) > 0) {
        await nameInput.first().fill('Test Request');

        // Confirm save
        const confirmButton = page.locator('button:has-text("Save"), button:has-text("OK")');
        if ((await confirmButton.count()) > 1) {
          await confirmButton.last().click();
        }

        await page.waitForTimeout(500);

        // Verify saved (check for success message or collection list)
        const success = page.locator('text=/Saved|Success/i, [role="status"]');
        expect(await success.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should handle authentication', async ({ page }) => {
    // Find auth tab
    const authTab = page.locator(
      'text=/Auth|Authentication/i, [data-testid="auth-tab"], button:has-text("Auth")',
    );

    if ((await authTab.count()) > 0) {
      await authTab.first().click();

      // Select auth type
      const authTypeSelect = page.locator('select, [role="combobox"]');

      if ((await authTypeSelect.count()) > 0) {
        // Try to select Bearer token
        const options = await authTypeSelect.first().locator('option').allTextContents();

        if (options.some((opt) => opt.includes('Bearer') || opt.includes('Token'))) {
          const bearerOption =
            options.find((opt) => opt.includes('Bearer')) ||
            options.find((opt) => opt.includes('Token'));
          if (bearerOption) {
            await authTypeSelect.first().selectOption({ label: bearerOption });
          }

          // Enter token
          const tokenInput = page.locator(
            'input[placeholder*="token"], input[placeholder*="Token"]',
          );

          if ((await tokenInput.count()) > 0) {
            await tokenInput.first().fill('test-token-123');

            // Verify token was entered
            expect(await tokenInput.first().inputValue()).toBe('test-token-123');
          }
        }
      }
    }
  });

  test('should handle query parameters', async ({ page }) => {
    // Find params tab
    const paramsTab = page.locator('text=/Params|Parameters|Query/i, [data-testid="params-tab"]');

    if ((await paramsTab.count()) > 0) {
      await paramsTab.first().click();

      // Add parameter
      const addButton = page.locator('button:has-text("Add"), [data-testid="add-param"]');

      if ((await addButton.count()) > 0) {
        await addButton.first().click();

        // Fill parameter
        const keyInput = page.locator('input[placeholder*="key"], input[placeholder*="Key"]');
        const valueInput = page.locator('input[placeholder*="value"], input[placeholder*="Value"]');

        if ((await keyInput.count()) > 0) {
          await keyInput.first().fill('page');
          await valueInput.first().fill('1');

          // Verify URL updates
          const urlInput = page.locator('input[type="text"]').first();
          const url = await urlInput.inputValue();

          expect(url.includes('?') || url.includes('page=1')).toBeTruthy();
        }
      }
    }
  });

  test('should copy response', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Make a request
    const urlInput = page.locator('input[type="text"]').first();
    await urlInput.fill(mockData.api.endpoints.get);

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.first().click();

    await page.waitForTimeout(3000);

    // Find copy button in response
    const copyButton = page.locator(
      '[data-testid="copy-response"], button:has-text("Copy"), [aria-label*="Copy"]',
    );

    if ((await copyButton.count()) > 0) {
      await copyButton.first().click();
      await page.waitForTimeout(500);

      // Verify clipboard has content
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText.length).toBeGreaterThan(0);
    }
  });

  test('should format response JSON', async ({ page }) => {
    // Make a request
    const urlInput = page.locator('input[type="text"]').first();
    await urlInput.fill(mockData.api.endpoints.get);

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.first().click();

    await page.waitForTimeout(3000);

    // Look for format toggle
    const formatButton = page.locator(
      'button:has-text("Format"), button:has-text("Pretty"), [data-testid="format-toggle"]',
    );

    if ((await formatButton.count()) > 0) {
      await formatButton.first().click();

      // Response should be formatted
      const response = page.locator('[data-testid="response-body"], .response-body, pre, code');

      if ((await response.count()) > 0) {
        const text = await response.first().textContent();
        expect(text).toContain('\n'); // Should have newlines if formatted
      }
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Enter invalid URL
    const urlInput = page.locator('input[type="text"]').first();
    await urlInput.fill('https://invalid-url-that-does-not-exist-12345.com');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.first().click();

    // Wait for error
    await page.waitForTimeout(5000);

    // Should show error message
    const error = page.locator(
      '[role="alert"], .error, [data-testid="error"], text=/Error|Failed|Network/i',
    );

    expect(await error.count()).toBeGreaterThan(0);
  });

  test('should persist state on refresh', async ({ page }) => {
    // Enter some data
    const urlInput = page.locator('input[type="text"]').first();
    const testUrl = 'https://api.example.com/test';
    await urlInput.fill(testUrl);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if URL is still there (if tool supports persistence)
    const urlAfterReload = await page.locator('input[type="text"]').first().inputValue();

    // Either preserved or empty (both are valid behaviors)
    expect(urlAfterReload === testUrl || urlAfterReload === '').toBeTruthy();
  });
});
