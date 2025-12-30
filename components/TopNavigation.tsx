/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Search, Menu, X, Command, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ThemeSwitcher } from './ThemeSwitcher';
import { TOOLS, TOOL_CATEGORIES, getAllToolsByCategory } from '@/lib/tool-registry';
import { TEXTS } from '@/lib/constants/texts';

interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
}

// GitHub Icon Component
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

// Enhanced fuzzy search (from ToolSearch - production-critical)
const fuzzySearch = (query: string, tools: Tool[]): Tool[] => {
  if (!query.trim()) return [];

  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter((word) => word.length > 0);

  const scored = tools.map((tool) => {
    let score = 0;
    const toolNameLower = tool.name.toLowerCase();
    const toolDescLower = tool.description.toLowerCase();

    // Exact name match (highest priority)
    if (toolNameLower === queryLower) {
      score += 1000;
    }

    // Starts with query
    if (toolNameLower.startsWith(queryLower)) {
      score += 500;
    }

    // Contains full query in name
    if (toolNameLower.includes(queryLower)) {
      score += 200;
    }

    // Contains full query in description
    if (toolDescLower.includes(queryLower)) {
      score += 100;
    }

    // Word-by-word matching
    queryWords.forEach((word) => {
      if (toolNameLower.includes(word)) {
        score += 150;
      }
      if (toolDescLower.includes(word)) {
        score += 75;
      }
      if (tool.category.toLowerCase().includes(word)) {
        score += 50;
      }
    });

    // Character sequence matching (fuzzy)
    const nameChars = toolNameLower.replace(/\s/g, '').split('');
    const queryChars = queryLower.replace(/\s/g, '').split('');
    let queryIndex = 0;
    let consecutiveMatches = 0;

    for (let i = 0; i < nameChars.length && queryIndex < queryChars.length; i++) {
      if (nameChars[i] === queryChars[queryIndex]) {
        queryIndex++;
        consecutiveMatches++;
        score += consecutiveMatches * 5;
      } else {
        consecutiveMatches = 0;
      }
    }

    // Bonus for matching all query characters
    if (queryIndex === queryChars.length) {
      score += 50;
    }

    // Acronym matching (e.g., "jf" matches "JSON Formatter")
    const words = tool.name.toLowerCase().split(/\s+/);
    const acronym = words.map((word) => word[0]).join('');
    if (acronym.includes(queryLower)) {
      score += 100;
    }

    return { ...tool, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8); // Performance-tested limit
};

export const TopNavigation = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const allTools = useMemo(() => Object.values(TOOLS), []);
  const filteredTools = useMemo(
    () => (searchQuery.trim() ? fuzzySearch(searchQuery, allTools) : []),
    [searchQuery, allTools],
  );

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Keyboard shortcuts (⌘/ for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search with ⌘/ or Ctrl+/
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setSearchOpen(true);
      }

      // Close search with Escape
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
        setSelectedIndex(-1);
      }

      // Arrow navigation in search results
      if (searchOpen && filteredTools.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev < filteredTools.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredTools.length - 1));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const tool = selectedIndex >= 0 ? filteredTools[selectedIndex] : filteredTools[0];
          if (tool) {
            window.location.href = `/tools/${tool.id}`;
            setSearchOpen(false);
            setSearchQuery('');
            setSelectedIndex(-1);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, filteredTools, selectedIndex]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

  const getCategoryIcon = (categoryId: string) => {
    const category = TOOL_CATEGORIES[categoryId as keyof typeof TOOL_CATEGORIES];
    return category?.icon || '🛠';
  };

  const toolsByCategory = getAllToolsByCategory();

  return (
    <>
      <nav className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="h-full px-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary-foreground animate-spin-slow" />
            </div>
            <span className="font-semibold text-lg hidden sm:block">LocalGearbox</span>
          </Link>

          {/* Center: Search Bar (Desktop) */}
          <div className="flex-1 max-w-md hidden md:block">
            <Button
              variant="outline"
              onClick={() => setSearchOpen(true)}
              className="w-full justify-start text-sm text-muted-foreground font-normal"
            >
              <Search className="mr-2 h-4 w-4" />
              <span className="flex-1 text-left">{TEXTS.navigation.searchTrigger}</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <Command className="h-3 w-3" />/
              </kbd>
            </Button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* GitHub Link */}
            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://github.com/sanmak/LocalGearbox"
                target="_blank"
                rel="noopener noreferrer"
                title="View on GitHub"
              >
                <GitHubIcon className="h-4 w-4" />
              </a>
            </Button>

            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Toggle menu">
                  {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 sm:w-96">
                <SheetHeader>
                  <SheetTitle>{TEXTS.navigation.navTitle}</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
                  <div className="space-y-1">
                    <Link
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                        pathname === '/' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      }`}
                    >
                      {TEXTS.navigation.home}
                    </Link>

                    {/* Categorized Tools */}
                    {Object.entries(toolsByCategory).map(([categoryId, tools]) => {
                      if (tools.length === 0) return null;
                      const category = TOOL_CATEGORIES[categoryId as keyof typeof TOOL_CATEGORIES];

                      return (
                        <div key={categoryId} className="pt-4">
                          <div className="px-4 pb-2 flex items-center gap-2">
                            <span className="text-lg">{category.icon}</span>
                            <span className="text-sm font-semibold text-muted-foreground">
                              {category.name}
                            </span>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {tools.length}
                            </Badge>
                          </div>
                          {tools.slice(0, 5).map((tool) => (
                            <Link
                              key={tool.id}
                              href={`/tools/${tool.id}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`block px-4 py-2.5 rounded-lg text-sm transition-colors ${
                                pathname === `/tools/${tool.id}`
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {tool.name}
                            </Link>
                          ))}
                        </div>
                      );
                    })}

                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setSearchOpen(true);
                      }}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      {TEXTS.navigation.searchTrigger}
                    </Button>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 animate-in fade-in-0 duration-200">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery('');
              setSelectedIndex(-1);
            }}
          />
          <div className="relative w-full max-w-2xl bg-card border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-200">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={TEXTS.navigation.searchPlaceholder}
                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedIndex(-1);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                ESC
              </kbd>
            </div>

            {/* Search Results */}
            {searchQuery.trim() ? (
              <ScrollArea className="max-h-[60vh]">
                {filteredTools.length > 0 ? (
                  <div className="p-2">
                    {filteredTools.map((tool: Tool, index: number) => (
                      <Link
                        key={tool.id}
                        href={`/tools/${tool.id}`}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                          setSelectedIndex(-1);
                        }}
                        className={`flex items-start gap-3 px-3 py-3 rounded-lg transition-colors ${
                          index === selectedIndex
                            ? 'bg-primary/10 border-l-2 border-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <span className="text-xl mt-0.5 flex-shrink-0">
                          {getCategoryIcon(tool.category)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{tool.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {tool.description}
                          </div>
                          <Badge variant="secondary" className="mt-1.5 text-[10px] capitalize">
                            {tool.category}
                          </Badge>
                        </div>
                      </Link>
                    ))}

                    {/* Search Hints */}
                    <div className="px-3 py-2 mt-2 border-t">
                      <div className="text-xs text-muted-foreground flex items-center justify-between">
                        <span>{TEXTS.navigation.searchHints}</span>
                        <span>{TEXTS.navigation.searchClose}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-12 text-center">
                    <div className="text-muted-foreground">
                      <svg
                        className="mx-auto h-12 w-12 mb-3 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm font-medium">
                        {TEXTS.navigation.noResults(searchQuery)}
                      </p>
                      <p className="text-xs mt-1">{TEXTS.navigation.searchHintSubtitle}</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            ) : (
              /* Popular Tools when empty */
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {TEXTS.navigation.popularTools}
                </div>
                {[
                  'api-client',
                  'json-formatter',
                  'json-studio',
                  'responsive-tester',
                  'dns-analysis',
                  'uuid-generator',
                ].map((toolId) => {
                  const tool = TOOLS[toolId];
                  if (!tool) return null;
                  return (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.id}`}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <span className="text-lg">{getCategoryIcon(tool.category)}</span>
                      <span className="text-sm font-medium">{tool.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
