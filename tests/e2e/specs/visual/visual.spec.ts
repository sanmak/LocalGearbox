/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { test, expect } from '@playwright/test';

/**
 * Visual regression tests
 * Captures screenshots and compares them against baseline images
 */
test.describe('Visual Regression Tests', () => {
  test('home page should match baseline - desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take screenshot and compare
    await expect(page).toHaveScreenshot('home-desktop.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('home page should match baseline - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('home-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('JSON formatter should match baseline', async ({ page }) => {
    await page.goto('/tools/json-formatter');
    await page.waitForLoadState('networkidle');

    // Wait for any animations to complete
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('json-formatter.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('JSON formatter with input should match baseline', async ({ page }) => {
    await page.goto('/tools/json-formatter');

    // Enter sample JSON
    await page.fill('textarea', '{"name": "test", "value": 123}');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('json-formatter-with-input.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('dark mode should match baseline', async ({ page }) => {
    await page.goto('/');

    // Enable dark mode
    await page.emulateMedia({ colorScheme: 'dark' });

    // Toggle theme if needed
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot('home-dark-mode.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('API client should match baseline', async ({ page }) => {
    await page.goto('/tools/api-client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('api-client.png', {
      fullPage: false, // Don't capture full page for complex layouts
      maxDiffPixels: 150,
    });
  });

  test('error state should match baseline', async ({ page }) => {
    await page.goto('/tools/json-formatter');

    // Trigger error state
    await page.fill('textarea', '{invalid json}');
    await page.waitForTimeout(500);

    // Take screenshot of error state
    await expect(page).toHaveScreenshot('error-state.png', {
      maxDiffPixels: 100,
    });
  });

  test('responsive layout - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('home-tablet.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('component - button states', async ({ page }) => {
    await page.goto('/');

    const button = page.locator('button').first();
    await button.waitFor({ state: 'visible' });

    // Normal state
    await expect(button).toHaveScreenshot('button-normal.png');

    // Hover state
    await button.hover();
    await page.waitForTimeout(200);
    await expect(button).toHaveScreenshot('button-hover.png');

    // Focus state
    await button.focus();
    await page.waitForTimeout(200);
    await expect(button).toHaveScreenshot('button-focus.png');
  });

  test('tool categories section', async ({ page }) => {
    await page.goto('/');

    // Scroll to categories
    const categories = page.locator('text=/All Tools|Browse/i').first();
    await categories.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Screenshot just the categories section
    const section = page.locator('[data-testid="categories-section"]');
    if ((await section.count()) > 0) {
      await expect(section).toHaveScreenshot('categories-section.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test('search results should be consistent', async ({ page }) => {
    await page.goto('/');

    // Search for a tool
    const search = page.locator('[data-testid="tool-search"]');
    if ((await search.count()) > 0) {
      await search.fill('json');
      await page.waitForTimeout(500);

      // Screenshot search results
      await expect(page).toHaveScreenshot('search-results-json.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test('footer should match baseline', async ({ page }) => {
    await page.goto('/');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const footer = page.locator('footer');
    await expect(footer).toHaveScreenshot('footer.png', {
      maxDiffPixels: 50,
    });
  });

  test('modal/dialog appearance', async ({ page }) => {
    await page.goto('/');

    // Find and trigger a modal if exists
    const dialogButton = page.locator('[data-testid*="dialog"], button:has-text("Open")');

    if ((await dialogButton.count()) > 0) {
      await dialogButton.first().click();
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"]');
      if ((await dialog.count()) > 0) {
        await expect(dialog).toHaveScreenshot('dialog.png', {
          maxDiffPixels: 100,
        });
      }
    }
  });

  test('animation completion', async ({ page }) => {
    await page.goto('/');

    // Wait for all animations to complete
    await page.waitForFunction(() => {
      const animations = document.getAnimations();
      return animations.every((anim) => anim.playState === 'finished' || anim.playState === 'idle');
    });

    await expect(page).toHaveScreenshot('home-animations-complete.png', {
      fullPage: true,
      maxDiffPixels: 100,
      animations: 'disabled', // Disable animations for consistent screenshots
    });
  });
});

/**
 * Cross-browser visual tests
 * These run on different browsers to catch browser-specific rendering issues
 */
test.describe('Cross-Browser Visual Tests', () => {
  test('should render consistently across browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot(`home-${browserName}.png`, {
      fullPage: true,
      maxDiffPixels: 200, // Allow more tolerance for browser differences
    });
  });
});
