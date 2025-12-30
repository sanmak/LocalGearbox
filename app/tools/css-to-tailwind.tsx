/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * CSS to Tailwind Converter
 * Convert CSS properties to Tailwind utility classes
 */

import { ToolLayout } from '@/components/ToolLayout';

const SAMPLE_CSS = `.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  margin: 0 auto;
  max-width: 1200px;
}

.button {
  background-color: #3b82f6;
  color: white;
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
}

.button:hover {
  background-color: #2563eb;
}

.card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1rem;
}`;

// CSS property to Tailwind class mapping
const cssToTailwindMap: Record<string, (value: string) => string | null> = {
  display: (v) => {
    const map: Record<string, string> = {
      flex: 'flex',
      'inline-flex': 'inline-flex',
      block: 'block',
      'inline-block': 'inline-block',
      inline: 'inline',
      grid: 'grid',
      'inline-grid': 'inline-grid',
      none: 'hidden',
      table: 'table',
    };
    return map[v] || null;
  },
  'flex-direction': (v) => {
    const map: Record<string, string> = {
      row: 'flex-row',
      'row-reverse': 'flex-row-reverse',
      column: 'flex-col',
      'column-reverse': 'flex-col-reverse',
    };
    return map[v] || null;
  },
  'flex-wrap': (v) => {
    const map: Record<string, string> = {
      wrap: 'flex-wrap',
      nowrap: 'flex-nowrap',
      'wrap-reverse': 'flex-wrap-reverse',
    };
    return map[v] || null;
  },
  'justify-content': (v) => {
    const map: Record<string, string> = {
      'flex-start': 'justify-start',
      'flex-end': 'justify-end',
      center: 'justify-center',
      'space-between': 'justify-between',
      'space-around': 'justify-around',
      'space-evenly': 'justify-evenly',
    };
    return map[v] || null;
  },
  'align-items': (v) => {
    const map: Record<string, string> = {
      'flex-start': 'items-start',
      'flex-end': 'items-end',
      center: 'items-center',
      baseline: 'items-baseline',
      stretch: 'items-stretch',
    };
    return map[v] || null;
  },
  padding: (v) => convertSpacing('p', v),
  'padding-top': (v) => convertSpacing('pt', v),
  'padding-right': (v) => convertSpacing('pr', v),
  'padding-bottom': (v) => convertSpacing('pb', v),
  'padding-left': (v) => convertSpacing('pl', v),
  margin: (v) => convertSpacing('m', v),
  'margin-top': (v) => convertSpacing('mt', v),
  'margin-right': (v) => convertSpacing('mr', v),
  'margin-bottom': (v) => convertSpacing('mb', v),
  'margin-left': (v) => convertSpacing('ml', v),
  gap: (v) => convertSpacing('gap', v),
  'max-width': (v) => {
    const map: Record<string, string> = {
      '100%': 'max-w-full',
      none: 'max-w-none',
      '1200px': 'max-w-7xl',
      '1024px': 'max-w-6xl',
      '768px': 'max-w-3xl',
    };
    return map[v] || null;
  },
  'font-weight': (v) => {
    const map: Record<string, string> = {
      '400': 'font-normal',
      '500': 'font-medium',
      '600': 'font-semibold',
      '700': 'font-bold',
      bold: 'font-bold',
      '800': 'font-extrabold',
    };
    return map[v] || null;
  },
  'text-align': (v) => {
    const map: Record<string, string> = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    };
    return map[v] || null;
  },
  color: (v) => convertColor('text', v),
  'background-color': (v) => convertColor('bg', v),
  'border-radius': (v) => {
    const map: Record<string, string> = {
      '0': 'rounded-none',
      '0.25rem': 'rounded',
      '0.375rem': 'rounded-md',
      '0.5rem': 'rounded-lg',
      '0.75rem': 'rounded-xl',
      '1rem': 'rounded-2xl',
      '9999px': 'rounded-full',
      '50%': 'rounded-full',
    };
    return map[v] || null;
  },
  cursor: (v) => {
    const map: Record<string, string> = {
      pointer: 'cursor-pointer',
      default: 'cursor-default',
      'not-allowed': 'cursor-not-allowed',
    };
    return map[v] || null;
  },
  'grid-template-columns': (v) => {
    const match = v.match(/repeat\((\d+),\s*1fr\)/);
    if (match) {
      return `grid-cols-${match[1]}`;
    }
    return null;
  },
};

function convertSpacing(prefix: string, value: string): string | null {
  if (value === '0' || value === '0px') return `${prefix}-0`;
  if (value === '0 auto') return 'mx-auto';

  const map: Record<string, string> = {
    '0.25rem': '1',
    '0.5rem': '2',
    '0.75rem': '3',
    '1rem': '4',
    '1.25rem': '5',
    '1.5rem': '6',
    '2rem': '8',
    '2.5rem': '10',
    '3rem': '12',
  };

  const size = map[value];
  if (size) return `${prefix}-${size}`;
  return null;
}

function convertColor(prefix: string, value: string): string | null {
  const colorMap: Record<string, string> = {
    white: `${prefix}-white`,
    '#fff': `${prefix}-white`,
    '#ffffff': `${prefix}-white`,
    black: `${prefix}-black`,
    '#000': `${prefix}-black`,
    '#3b82f6': `${prefix}-blue-500`,
    '#2563eb': `${prefix}-blue-600`,
    '#ef4444': `${prefix}-red-500`,
    '#22c55e': `${prefix}-green-500`,
  };

  return colorMap[value.toLowerCase()] || null;
}

interface CSSRule {
  selector: string;
  properties: { property: string; value: string }[];
}

function parseCSS(css: string): CSSRule[] {
  const rules: CSSRule[] = [];
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const body = match[2].trim();

    const properties: { property: string; value: string }[] = [];
    const propRegex = /([a-z-]+)\s*:\s*([^;]+);?/gi;
    let propMatch;

    while ((propMatch = propRegex.exec(body)) !== null) {
      properties.push({
        property: propMatch[1].trim().toLowerCase(),
        value: propMatch[2].trim(),
      });
    }

    rules.push({ selector, properties });
  }

  return rules;
}

async function convertCssToTailwind(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  const rules = parseCSS(input);
  const lines: string[] = [];

  for (const rule of rules) {
    const tailwindClasses: string[] = [];
    const unmapped: { property: string; value: string }[] = [];
    const isHover = rule.selector.includes(':hover');
    const isFocus = rule.selector.includes(':focus');

    for (const { property, value } of rule.properties) {
      const converter = cssToTailwindMap[property];
      if (converter) {
        const twClass = converter(value);
        if (twClass) {
          let finalClass = twClass;
          if (isHover) finalClass = `hover:${twClass}`;
          if (isFocus) finalClass = `focus:${twClass}`;
          tailwindClasses.push(finalClass);
        } else {
          unmapped.push({ property, value });
        }
      } else {
        unmapped.push({ property, value });
      }
    }

    lines.push(`/* ${rule.selector} */`);

    if (tailwindClasses.length > 0) {
      const selectorName = rule.selector.replace(/[:.#]/g, '').trim();
      lines.push(`${selectorName} → ${tailwindClasses.join(' ')}`);
      lines.push(`className="${tailwindClasses.join(' ')}"`);
    }

    if (unmapped.length > 0) {
      lines.push(
        `  /* Unmapped: ${unmapped.map((u) => `${u.property}: ${u.value}`).join('; ')} */`,
      );
    }

    lines.push('');
  }

  return lines.join('\n').trim();
}

export default function CSSToTailwindPage() {
  return (
    <ToolLayout
      toolName="CSS to Tailwind"
      toolDescription="Convert CSS properties to Tailwind CSS utility classes. Maps common CSS to Tailwind equivalents."
      onProcess={convertCssToTailwind}
      placeholder="Paste your CSS here..."
      sampleData={SAMPLE_CSS}
      showJsonButtons={false}
    />
  );
}
