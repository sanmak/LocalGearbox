/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { TOOL_CATEGORIES, TOOLS } from '@/lib/tool-registry';

// Icons
const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export const Sidebar = () => {
  const pathname = usePathname();

  // Expand categories that have the active tool
  const getInitialExpanded = () => {
    const expanded = new Set<string>();
    Object.values(TOOL_CATEGORIES).forEach((category) => {
      const categoryTools = Object.values(TOOLS).filter((tool) => tool.category === category.id);
      if (categoryTools.some((tool) => pathname === `/tools/${tool.id}`)) {
        expanded.add(category.id);
      }
    });
    // If no active tool, expand first category
    if (expanded.size === 0) {
      const firstCategory = Object.values(TOOL_CATEGORIES)[0];
      if (firstCategory) expanded.add(firstCategory.id);
    }
    return expanded;
  };

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(getInitialExpanded);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-border bg-surface overflow-hidden">
      {/* Tool Categories */}
      <nav className="flex-1 overflow-y-auto py-3">
        {Object.values(TOOL_CATEGORIES).map((category) => {
          const categoryTools = Object.values(TOOLS).filter(
            (tool) => tool.category === category.id,
          );

          if (categoryTools.length === 0) return null;

          const isExpanded = expandedCategories.has(category.id);
          const hasActiveTool = categoryTools.some((tool) => pathname === `/tools/${tool.id}`);

          return (
            <div key={category.id} className="mb-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-secondary ${
                  hasActiveTool ? 'text-accent' : 'text-text-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{category.icon}</span>
                  <span>{category.name}</span>
                  <span className="text-xs text-text-tertiary">({categoryTools.length})</span>
                </div>
                <ChevronIcon expanded={isExpanded} />
              </button>

              {/* Category Tools */}
              {isExpanded && (
                <div className="pb-2">
                  {categoryTools.map((tool) => {
                    const isActive = pathname === `/tools/${tool.id}`;
                    return (
                      <Link
                        key={tool.id}
                        href={`/tools/${tool.id}`}
                        className={`flex items-center gap-2 pl-10 pr-4 py-2 text-sm transition-colors ${
                          isActive
                            ? 'text-accent bg-accent-subtle border-r-2 border-accent'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                        }`}
                      >
                        <span className="truncate">{tool.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-border px-4 py-3">
        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <span>{Object.keys(TOOLS).length} tools</span>
          <a
            href="https://github.com/sanmak/LocalGearbox"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition-colors"
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </aside>
  );
};
