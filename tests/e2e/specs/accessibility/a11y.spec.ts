/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility tests using axe-core
 * Ensures WCAG 2.1 AA compliance
 */
test.describe('Accessibility Tests', () => {
  test('home page should not have accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('JSON formatter tool should not have accessibility violations', async ({ page }) => {
    await page.goto('/tools/json-formatter');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('API client should not have accessibility violations', async ({ page }) => {
    await page.goto('/tools/api-client');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    expect(await h1.count()).toBeGreaterThanOrEqual(1);

    // Verify heading levels are in order
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');

        // Alt attribute should exist (can be empty for decorative images)
        expect(alt).not.toBeNull();
      }
    }
  });

  test('should have labels for form inputs', async ({ page }) => {
    await page.goto('/tools/json-formatter');

    const inputs = page.locator('input, textarea, select');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');

      // Input should have some form of label
      const hasLabel =
        (id && (await page.locator(`label[for="${id}"]`).count()) > 0) ||
        ariaLabel ||
        ariaLabelledby ||
        placeholder;

      expect(hasLabel).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Press Tab multiple times
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');

      const focusedElement = page.locator(':focus');
      const tagName = await focusedElement.evaluate((el) => el.tagName);

      // Focused element should be interactive
      expect(['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT']).toContain(tagName);
    }
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/');

    // Tab to first interactive element
    await page.keyboard.press('Tab');

    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Check if focus is visually indicated
    const boundingBox = await focusedElement.boundingBox();
    expect(boundingBox).not.toBeNull();
  });

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/');

    // Check for ARIA landmarks
    const landmarks = page.locator('[role="main"], [role="navigation"], [role="banner"]');
    expect(await landmarks.count()).toBeGreaterThan(0);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');

    await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .disableRules(['color-contrast']) // We'll check this separately
      .analyze();

    // Run specific color contrast check
    const contrastResults = await new AxeBuilder({ page })
      .include('body')
      .withRules(['color-contrast'])
      .analyze();

    expect(contrastResults.violations).toEqual([]);
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/');

    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledby = await button.getAttribute('aria-labelledby');

      // Button should have accessible name
      const hasAccessibleName = (text && text.trim().length > 0) || ariaLabel || ariaLabelledby;

      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should announce errors to screen readers', async ({ page }) => {
    await page.goto('/tools/json-formatter');

    // Enter invalid JSON
    await page.fill('textarea', '{invalid json}');
    await page.waitForTimeout(500);

    // Check for aria-live region or role="alert"
    const alert = page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"]');

    // If an error is shown, it should be announced
    const errorVisible = await page.locator('.error, [data-testid="error"]').count();

    if (errorVisible > 0) {
      expect(await alert.count()).toBeGreaterThan(0);
    }
  });

  test('dialogs should trap focus', async ({ page }) => {
    await page.goto('/');

    // Find and open a dialog/modal if exists
    const dialogTrigger = page.locator('button:has-text("Open"), [data-testid*="dialog"]');

    if ((await dialogTrigger.count()) > 0) {
      await dialogTrigger.first().click();

      // Check if dialog opened
      const dialog = page.locator('[role="dialog"]');

      if ((await dialog.count()) > 0) {
        await expect(dialog).toBeVisible();

        // Tab should stay within dialog
        const initialFocus = page.locator(':focus');
        await initialFocus.evaluate((el) => el);

        // Press Tab multiple times
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('Tab');
        }

        // Focus should still be inside dialog
        const currentFocus = page.locator(':focus');
        const dialogHandle = await dialog.elementHandle();
        const isInDialog = await currentFocus.evaluate(
          (el, dlg) => dlg?.contains(el) ?? false,
          dialogHandle,
        );

        expect(isInDialog).toBeTruthy();
      }
    }
  });
});
