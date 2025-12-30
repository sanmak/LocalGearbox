/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * ThemeSwitcher - Redesigned with New Design Language
 * Global theme toggle with Light, Dark, and System modes
 * Uses shadcn/ui components for consistency
 */

import { useTheme } from './ThemeProvider';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);

  // Safely access theme context
  let theme: 'light' | 'dark' | 'system' = 'system';
  let setTheme: (theme: 'light' | 'dark' | 'system') => void = () => {};

  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    setTheme = themeContext.setTheme;
  } catch (error) {
    // ThemeProvider not available during SSR - use defaults
  }

  // Wait until mounted to render interactive component
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show non-interactive icon during SSR/hydration
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Monitor className="h-4 w-4" />
      </Button>
    );
  }

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Light',
      icon: Sun,
      description: 'Light mode',
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: Moon,
      description: 'Dark mode',
    },
    {
      value: 'system' as const,
      label: 'System',
      icon: Monitor,
      description: 'Use system preference',
    },
  ];

  // Get current theme icon
  const CurrentIcon = themeOptions.find((opt) => opt.value === theme)?.icon || Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Toggle theme">
          <CurrentIcon className="h-4 w-4 transition-all" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.value;

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-sm">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </div>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
