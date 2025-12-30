/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TOOLS } from '@/lib/tool-registry';

interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
}

// Enhanced fuzzy search implementation
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
        score += consecutiveMatches * 5; // Bonus for consecutive matches
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
    .slice(0, 8); // Show up to 8 results
};

export const ToolSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Tool[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const tools = useMemo(() => Object.values(TOOLS), []);

  // Handle search
  useEffect(() => {
    if (query.trim()) {
      const searchResults = fuzzySearch(query, tools);
      setResults(searchResults);
      setIsOpen(searchResults.length > 0);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  }, [query, tools]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectTool(results[selectedIndex]);
        } else if (results.length > 0) {
          handleSelectTool(results[0]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle tool selection
  const handleSelectTool = (tool: Tool) => {
    // Try Next.js router first
    try {
      router.push(`/tools/${tool.id}`);
    } catch (error) {
      // Fallback to window.location
      window.location.href = `/tools/${tool.id}`;
    }

    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Get category emoji
  const getCategoryEmoji = (category: string) => {
    const categories: Record<string, string> = {
      formatters: '✨',
      validators: '✓',
      encoders: '🔒',
      generators: '🎲',
      converters: '🔄',
    };
    return categories[category] || '🛠';
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-full">
      {/* Search Input */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
          <svg
            className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(results.length > 0)}
          placeholder="Search for tools... (JSON, XML, UUID, etc.)"
          className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center"
          >
            <svg
              className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-72 sm:max-h-80 overflow-y-auto">
          <div className="py-1 sm:py-2">
            {results.map((tool, index) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.id}`}
                onClick={() => {
                  setQuery('');
                  setIsOpen(false);
                  setSelectedIndex(-1);
                  inputRef.current?.blur();
                }}
                className={`block w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                  index === selectedIndex
                    ? 'bg-blue-50 dark:bg-blue-900/50 border-l-4 border-blue-500'
                    : ''
                }`}
              >
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <span className="text-base sm:text-lg mt-0.5 flex-shrink-0">
                    {getCategoryEmoji(tool.category)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                      {tool.name}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                      {tool.description}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 capitalize mt-1">
                      {tool.category}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Search tip */}
          <div className="border-t border-gray-200 dark:border-gray-600 px-3 sm:px-4 py-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <span className="hidden sm:inline">Use ↑↓ to navigate, Enter to select</span>
              <span className="sm:hidden">↑↓ Enter</span>
              <span>ESC to close</span>
            </div>
          </div>
        </div>
      )}

      {/* No results */}
      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="px-4 py-6 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <svg
                className="mx-auto h-12 w-12 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm">No tools found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs mt-1">Try searching for JSON, XML, UUID, Base64, etc.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
