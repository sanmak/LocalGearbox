/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { test, expect } from '@playwright/test';

/**
 * Smoke tests for home page
 * These tests verify basic functionality and should run fast
 */
test.describe('Home Page - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load home page successfully', async ({ page }) => {
    // Verify page loads
    await expect(page).toHaveTitle(/LocalGearbox|Developer Tools/);

    // Verify hero section is visible
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display navigation and search', async ({ page }) => {
    // Verify search is present
    const search = page.locator('[data-testid="tool-search"]');
    await expect(search).toBeVisible();
  });

  test('should display tool categories', async ({ page }) => {
    // Verify categories section exists
    const categories = page.locator('text=/Formatters|Converters|Validators/');
    await expect(categories.first()).toBeVisible();
  });

  test('should have working theme toggle', async ({ page }) => {
    // Click theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"]');

    // Check if toggle exists (might be in menu on mobile)
    const isVisible = await themeToggle.isVisible().catch(() => false);

    if (isVisible) {
      await themeToggle.click();

      // Verify theme changed (check for dark class on html)
      const html = page.locator('html');
      const classes = await html.getAttribute('class');

      expect(classes).toMatch(/dark|light/);
    }
  });

  test('should navigate to popular tools', async ({ page }) => {
    // Find and click on a popular tool (e.g., JSON Formatter)
    const jsonFormatter = page.locator('text=JSON Formatter').first();
    await jsonFormatter.click();

    // Verify navigation
    await expect(page).toHaveURL(/\/tools\/json-formatter/);
  });

  test('should have accessible navigation', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');

    // Verify focus is on an interactive element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Allow some common framework warnings but fail on real errors
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('Warning:') && !error.includes('[HMR]') && !error.includes('DevTools'),
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify page is responsive
    await expect(page.locator('h1')).toBeVisible();

    // Check if mobile menu button exists
    const menuButton = page.locator('[data-testid="menu-button"]');
    const isVisible = await menuButton.isVisible().catch(() => false);

    if (isVisible) {
      await menuButton.click();

      // Verify mobile menu opens
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).toBeVisible({ timeout: 2000 });
    }
  });

  test('should have valid meta tags', async ({ page }) => {
    // Check for important meta tags
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /.+/);

    // Check for viewport meta
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('should have working footer links', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Verify footer is visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check for GitHub link
    const githubLink = page.locator('a[href*="github.com"]').first();
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('target', '_blank');
    await expect(githubLink).toHaveAttribute('rel', /noopener/);
  });
});
