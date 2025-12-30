/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { expect, Page, Locator } from '@playwright/test';

/**
 * Custom assertion helpers for E2E tests
 */
export class Assertions {
  /**
   * Assert that an element is visible
   */
  static async assertVisible(locator: Locator, timeout = 5000) {
    await expect(locator).toBeVisible({ timeout });
  }

  /**
   * Assert that an element contains text
   */
  static async assertContainsText(locator: Locator, text: string | RegExp) {
    await expect(locator).toContainText(text);
  }

  /**
   * Assert that page has correct title
   */
  static async assertPageTitle(page: Page, title: string | RegExp) {
    await expect(page).toHaveTitle(title);
  }

  /**
   * Assert that URL contains path
   */
  static async assertURL(page: Page, path: string | RegExp) {
    await expect(page).toHaveURL(path);
  }

  /**
   * Assert that element has attribute
   */
  static async assertAttribute(locator: Locator, attribute: string, value: string | RegExp) {
    await expect(locator).toHaveAttribute(attribute, value);
  }

  /**
   * Assert that element is focused
   */
  static async assertFocused(locator: Locator) {
    await expect(locator).toBeFocused();
  }

  /**
   * Assert that element is disabled
   */
  static async assertDisabled(locator: Locator) {
    await expect(locator).toBeDisabled();
  }

  /**
   * Assert that element is enabled
   */
  static async assertEnabled(locator: Locator) {
    await expect(locator).toBeEnabled();
  }

  /**
   * Assert that checkbox is checked
   */
  static async assertChecked(locator: Locator) {
    await expect(locator).toBeChecked();
  }

  /**
   * Assert JSON output matches expected
   */
  static async assertValidJSON(text: string) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      throw new Error(`Expected valid JSON but got: ${text}`);
    }
    expect(parsed).toBeDefined();
  }

  /**
   * Assert element count
   */
  static async assertCount(locator: Locator, count: number) {
    await expect(locator).toHaveCount(count);
  }

  /**
   * Assert element has class
   */
  static async assertHasClass(locator: Locator, className: string) {
    await expect(locator).toHaveClass(new RegExp(className));
  }

  /**
   * Assert no console errors
   */
  static async assertNoConsoleErrors(page: Page, allowedErrors: string[] = []) {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const isAllowed = allowedErrors.some((allowed) => text.includes(allowed));
        if (!isAllowed) {
          errors.push(text);
        }
      }
    });

    // Check after test
    expect(errors).toHaveLength(0);
  }
}
