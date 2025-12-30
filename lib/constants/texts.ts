/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

export const TEXTS = {
  metadata: {
    siteName: 'LocalGearbox',
    titleSuffix: ' | LocalGearbox',
    defaultTitle: 'LocalGearbox - Enterprise-Grade Developer Tools',
    defaultDescription:
      'Secure, privacy-first, local-only developer utilities. JSON tools, API client, networking utilities, and more.',
    homeTitle: 'LocalGearbox - Enterprise-Grade Developer Tools',
    homeDescription:
      'High-fidelity developer utilities built to enterprise standards. Privacy-native and local-first with zero telemetry.',
    ogTitle: 'LocalGearbox',
    ogDescription: 'Enterprise-Grade Developer Tools. Privacy-native and local-first.',
    keywords: [
      'developer tools',
      'json formatter',
      'api client',
      'privacy-first',
      'local-only',
      'open source',
    ],
    author: 'LocalGearbox Contributors',
  },
  layout: {
    skipToMain: 'Skip to main content',
  },
  navigation: {
    home: 'Home',
    searchPlaceholder: 'Search tools... (JSON, XML, Base64, etc.)',
    searchTrigger: 'Search tools...',
    navTitle: 'Navigation',
    popularTools: 'Popular Tools',
    noResults: (query: string) => `No tools found for "${query}"`,
    searchHintSubtitle: 'Try searching for JSON, XML, UUID, Base64, etc.',
    searchHints: 'Use ↑↓ to navigate, Enter to select',
    searchClose: 'ESC to close',
  },
  home: {
    hero: {
      badge: 'Privacy-First • Zero Trackers • Air-Gap Ready',
      headlinePrefix: 'Enterprise-Grade',
      headlineSuffix: 'Developer Tools',
      description: {
        part1: 'High-fidelity developer utilities built to ',
        part2: 'enterprise standards',
        part3: '. ',
        part4: 'Privacy-native',
        part5: ' and ',
        part6: 'local-first',
        part7: ', providing a secure workspace with ',
        part8: 'zero telemetry',
        part9: ' and total accessibility.',
      },
      cta: {
        explore: (count: number) => `Explore ${count} Tools`,
        github: 'View on GitHub',
      },
      stats: {
        tools: 'Tools',
        localFirst: 'Local-First',
        trackers: 'Trackers',
      },
    },
    features: {
      badge: 'Why Enterprises Choose Us',
      title: 'Built for Production Workloads',
      subtitle: "Trusted by teams who can't afford downtime, data leaks, or slow tools.",
      items: [
        {
          title: 'Zero Data Leakage',
          description:
            'All processing happens in-browser. No servers, no logs, no telemetry. Perfect for air-gapped environments and secure workstations.',
        },
        {
          title: 'Sub-50ms Response',
          description:
            'Optimized for speed. Fuzzy search, real-time formatting, and instant validation. No loading spinners, ever.',
        },
        {
          title: 'Security Compliant',
          description:
            'SOC 2 friendly. No external dependencies, no CDN calls. Self-hostable with Docker. Full audit trail available.',
        },
        {
          title: 'Keyboard-First UX',
          description:
            'Built for power users. ⌘K search, arrow navigation, shortcuts for every action. 60% faster than mouse-based workflows.',
        },
        {
          title: 'Accessible by Default',
          description:
            'Screen reader tested. Full keyboard navigation. High contrast mode. Built with Radix UI primitives.',
        },
        {
          title: 'MIT Licensed',
          description:
            'Fully open-source. Fork it, customize it, self-host it. No vendor lock-in. Contribute back or keep it private.',
        },
      ],
    },
    popular: {
      badge: 'Most Used',
      title: 'Popular Tools',
      subtitle: 'Production-tested by thousands of engineers',
    },
    allTools: {
      badge: 'Complete Toolkit',
      title: (count: number) => `Browse All ${count} Tools`,
      subtitle: (count: number) =>
        `Organized into ${count} categories for quick discovery. From JSON formatting to DNS analysis, we've got you covered.`,
      categories: {
        formatters: {
          title: 'Formatters',
          description: 'Beautify & minify code',
        },
        converters: {
          title: 'Converters',
          description: 'Transform between formats',
        },
        validators: {
          title: 'Validators',
          description: 'Verify data integrity',
        },
        generators: {
          title: 'Generators',
          description: 'Create test data',
        },
      },
    },
    trust: {
      title: 'Designed for Extended Daily Use',
      stats: [
        { value: '5-6h', label: 'Daily Usage' },
        { value: '<50ms', label: 'Response Time' },
        { value: '100%', label: 'Keyboard Nav' },
        { value: 'Dark', label: 'Mode First' },
      ],
    },
    cta: {
      title: 'Ready to Work Smarter?',
      subtitle: 'Join thousands of engineers who trust LocalGearbox for their daily workflows.',
      button: 'Start Using Tools',
      github: 'Star on GitHub',
      footer: 'Open source • MIT Licensed • Self-hostable',
    },
  },
  footer: {
    brandDescription:
      'Enterprise-grade developer tools for senior engineers. Built for privacy, speed, and accessibility. 100% local-first, zero trackers.',
    links: {
      quickLinks: {
        title: 'Quick Links',
        browse: 'Browse Tools',
        apiClient: 'API Client',
        jsonFormatter: 'JSON Formatter',
        dnsAnalysis: 'DNS Analysis',
      },
      resources: {
        title: 'Resources',
        documentation: 'Documentation',
        selfHosting: 'Self-Hosting Guide',
        designSystem: 'Design System',
        license: 'MIT License',
      },
    },
    bottom: {
      copyright: (year: number) => `© ${year} LocalGearbox. All rights reserved.`,
      privacy: 'Privacy-First',
      accessibility: 'Accessibility Native',
      response: '<50ms Response',
    },
  },
};
