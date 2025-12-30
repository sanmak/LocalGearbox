/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { Page } from '@playwright/test';

/**
 * Navigation helpers for E2E tests
 */
export class Navigation {
  constructor(private page: Page) {}

  /**
   * Navigate to home page
   */
  async goToHome() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to a specific tool
   */
  async goToTool(toolId: string) {
    await this.page.goto(`/tools/${toolId}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to API client
   */
  async goToApiClient() {
    await this.page.goto('/tools/api-client');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Use sidebar to navigate to a tool
   */
  async navigateViaSidebar(toolName: string) {
    // Open sidebar if on mobile
    const isMobile = await this.isMobileViewport();
    if (isMobile) {
      await this.page.click('[data-testid="menu-button"]');
    }

    // Search for tool
    await this.page.fill('[data-testid="tool-search"]', toolName);
    await this.page.waitForTimeout(300); // Wait for search debounce

    // Click first result
    await this.page.click(`[data-testid="tool-result-${toolName}"]`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Use tool search to find a tool
   */
  async searchTool(query: string) {
    await this.page.fill('[data-testid="tool-search"]', query);
    await this.page.waitForTimeout(300);
  }

  /**
   * Click on a category
   */
  async selectCategory(categoryId: string) {
    await this.page.click(`[data-testid="category-${categoryId}"]`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Go back in browser history
   */
  async goBack() {
    await this.page.goBack();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Go forward in browser history
   */
  async goForward() {
    await this.page.goForward();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Reload the page
   */
  async reload() {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if viewport is mobile
   */
  private async isMobileViewport(): Promise<boolean> {
    const viewport = this.page.viewportSize();
    return viewport ? viewport.width < 768 : false;
  }

  /**
   * Scroll to element
   */
  async scrollTo(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Scroll to bottom of page
   */
  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  /**
   * Scroll to top of page
   */
  async scrollToTop() {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }
}
