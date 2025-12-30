/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect, Page } from '@playwright/test';

/**
 * Custom fixtures for tool testing
 */
type ToolFixtures = {
  toolPage: ToolPageHelper;
};

/**
 * Helper class for tool page interactions
 */
class ToolPageHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to a specific tool
   */
  async navigate(toolId: string) {
    await this.page.goto(`/tools/${toolId}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for tool to fully load
   */
  async waitForToolLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForSelector('[data-testid="tool-container"]', {
      state: 'visible',
      timeout: 5000,
    });
  }

  /**
   * Enter text into the tool input
   */
  async enterInput(text: string, selector = '[data-testid="tool-input"]') {
    const input = this.page.locator(selector);
    await input.fill(text);
    // Wait for any debounced processing
    await this.page.waitForTimeout(300);
  }

  /**
   * Get the output text from the tool
   */
  async getOutput(selector = '[data-testid="tool-output"]'): Promise<string> {
    const output = this.page.locator(selector);
    await output.waitFor({ state: 'visible' });
    return (await output.textContent()) || '';
  }

  /**
   * Copy output to clipboard
   */
  async copyOutput(selector = '[data-testid="copy-output"]') {
    await this.page.click(selector);
    // Wait for copy animation/feedback
    await this.page.waitForTimeout(500);
  }

  /**
   * Clear input field
   */
  async clearInput(selector = '[data-testid="clear-input"]') {
    await this.page.click(selector);
  }

  /**
   * Check if error message is displayed
   */
  async hasError(): Promise<boolean> {
    const error = this.page.locator('[data-testid="error-message"]');
    try {
      await error.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    const error = this.page.locator('[data-testid="error-message"]');
    return (await error.textContent()) || '';
  }

  /**
   * Check if success message is displayed
   */
  async hasSuccess(): Promise<boolean> {
    const success = this.page.locator('[data-testid="success-message"]');
    try {
      await success.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Click a button by test ID
   */
  async clickButton(testId: string) {
    await this.page.click(`[data-testid="${testId}"]`);
  }

  /**
   * Select an option from dropdown
   */
  async selectOption(testId: string, value: string) {
    await this.page.selectOption(`[data-testid="${testId}"]`, value);
  }

  /**
   * Take a screenshot of the tool
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }
}

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<ToolFixtures>({
  toolPage: async ({ page }, use) => {
    const helper = new ToolPageHelper(page);
    await use(helper);
  },
});

export { expect };
