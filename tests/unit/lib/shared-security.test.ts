/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { validateHTMLSecurity } from '@/lib/tools/shared';

describe('validateHTMLSecurity', () => {
  describe('script tag detection', () => {
    it('should detect basic script tags', () => {
      expect(() => validateHTMLSecurity('<script>alert(1)</script>')).toThrow(
        'HTML contains <script> tags',
      );
    });

    it('should detect script tags with attributes in opening tag', () => {
      expect(() =>
        validateHTMLSecurity('<script type="text/javascript">alert(1)</script>'),
      ).toThrow('HTML contains <script> tags');
    });

    it('should detect script tags with whitespace in closing tag', () => {
      expect(() => validateHTMLSecurity('<script>alert(1)</script >')).toThrow(
        'HTML contains <script> tags',
      );
    });

    it('should detect script tags with attributes in closing tag', () => {
      // This is the key edge case from the security alert
      expect(() => validateHTMLSecurity('<script>alert(1)</script foo="bar">')).toThrow(
        'HTML contains <script> tags',
      );
    });

    it('should detect script tags with tab and newline in closing tag', () => {
      expect(() => validateHTMLSecurity('<script>alert(1)</script\t\n bar>')).toThrow(
        'HTML contains <script> tags',
      );
    });

    it('should detect script tags with multiple spaces in closing tag', () => {
      expect(() => validateHTMLSecurity('<script>alert(1)</script   >')).toThrow(
        'HTML contains <script> tags',
      );
    });

    it('should detect script tags with mixed case', () => {
      expect(() => validateHTMLSecurity('<SCRIPT>alert(1)</SCRIPT>')).toThrow(
        'HTML contains <script> tags',
      );
      expect(() => validateHTMLSecurity('<ScRiPt>alert(1)</ScRiPt>')).toThrow(
        'HTML contains <script> tags',
      );
    });

    it('should detect script tags with newlines in content', () => {
      expect(() =>
        validateHTMLSecurity(`<script>
        alert(1);
        console.log('test');
      </script>`),
      ).toThrow('HTML contains <script> tags');
    });

    it('should allow HTML without script tags', () => {
      expect(() =>
        validateHTMLSecurity('<div><p>Hello World</p><span>Test</span></div>'),
      ).not.toThrow();
    });

    it('should allow HTML with word "script" in content', () => {
      expect(() => validateHTMLSecurity('<p>This is a script for the play</p>')).not.toThrow();
    });

    it('should allow HTML with script-like text but not in tags', () => {
      expect(() => validateHTMLSecurity('<p>Use &lt;script&gt; tags carefully</p>')).not.toThrow();
    });
  });

  describe('event handler detection', () => {
    it('should detect onclick event handler', () => {
      expect(() => validateHTMLSecurity('<button onclick="alert(1)">Click</button>')).toThrow(
        'event handlers',
      );
    });

    it('should detect onload event handler', () => {
      expect(() => validateHTMLSecurity('<img src="x" onload="alert(1)">')).toThrow(
        'event handlers',
      );
    });

    it('should detect onerror event handler', () => {
      expect(() => validateHTMLSecurity('<img src="x" onerror="alert(1)">')).toThrow(
        'event handlers',
      );
    });

    it('should detect onmouseover event handler', () => {
      expect(() => validateHTMLSecurity('<div onmouseover="alert(1)">Hover</div>')).toThrow(
        'event handlers',
      );
    });

    it('should allow HTML without event handlers', () => {
      expect(() =>
        validateHTMLSecurity('<button class="btn" id="myBtn">Click</button>'),
      ).not.toThrow();
    });
  });

  describe('combined security checks', () => {
    it('should detect both script tags and event handlers', () => {
      expect(() =>
        validateHTMLSecurity('<script>alert(1)</script><button onclick="alert(2)">Click</button>'),
      ).toThrow();
    });

    it('should allow safe HTML with various elements', () => {
      const safeHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Page</title>
          </head>
          <body>
            <div class="container">
              <h1>Welcome</h1>
              <p>This is a safe HTML document</p>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </div>
          </body>
        </html>
      `;
      expect(() => validateHTMLSecurity(safeHTML)).not.toThrow();
    });
  });
});
