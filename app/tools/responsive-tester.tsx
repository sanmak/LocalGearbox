/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { FramingErrorPanel } from '@/components/errors/FramingErrorPanel';

// Device presets inspired by Responsively App
interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  category: 'mobile' | 'tablet' | 'desktop';
  icon: string;
}

const DEVICE_PRESETS: DevicePreset[] = [
  // Mobile devices
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    width: 375,
    height: 667,
    category: 'mobile',
    icon: '📱',
  },
  {
    id: 'iphone-14',
    name: 'iPhone 14',
    width: 390,
    height: 844,
    category: 'mobile',
    icon: '📱',
  },
  {
    id: 'iphone-14-pro-max',
    name: 'iPhone 14 Pro Max',
    width: 430,
    height: 932,
    category: 'mobile',
    icon: '📱',
  },
  {
    id: 'pixel-7',
    name: 'Pixel 7',
    width: 412,
    height: 915,
    category: 'mobile',
    icon: '📱',
  },
  {
    id: 'samsung-s23',
    name: 'Samsung S23',
    width: 360,
    height: 780,
    category: 'mobile',
    icon: '📱',
  },

  // Tablet devices
  {
    id: 'ipad-mini',
    name: 'iPad Mini',
    width: 768,
    height: 1024,
    category: 'tablet',
    icon: '📲',
  },
  {
    id: 'ipad-air',
    name: 'iPad Air',
    width: 820,
    height: 1180,
    category: 'tablet',
    icon: '📲',
  },
  {
    id: 'ipad-pro-11',
    name: 'iPad Pro 11"',
    width: 834,
    height: 1194,
    category: 'tablet',
    icon: '📲',
  },
  {
    id: 'ipad-pro-12',
    name: 'iPad Pro 12.9"',
    width: 1024,
    height: 1366,
    category: 'tablet',
    icon: '📲',
  },
  {
    id: 'surface-pro',
    name: 'Surface Pro 7',
    width: 912,
    height: 1368,
    category: 'tablet',
    icon: '📲',
  },

  // Desktop breakpoints
  {
    id: 'laptop',
    name: 'Laptop',
    width: 1366,
    height: 768,
    category: 'desktop',
    icon: '💻',
  },
  {
    id: 'desktop-hd',
    name: 'Desktop HD',
    width: 1440,
    height: 900,
    category: 'desktop',
    icon: '🖥️',
  },
  {
    id: 'desktop-fhd',
    name: 'Desktop FHD',
    width: 1920,
    height: 1080,
    category: 'desktop',
    icon: '🖥️',
  },
  {
    id: 'desktop-2k',
    name: 'Desktop 2K',
    width: 2560,
    height: 1440,
    category: 'desktop',
    icon: '🖥️',
  },
];

// Icons
const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const RotateIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m0 0a8.001 8.001 0 0115.356 2M4.582 9H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ExpandIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
    />
  </svg>
);

const CollapseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
    />
  </svg>
);

interface ActiveDevice extends DevicePreset {
  rotated: boolean;
  key: string;
}

export default function ResponsiveTesterPage() {
  const [url, setUrl] = useState('');
  const [loadedUrl, setLoadedUrl] = useState('');
  const [activeDevices, setActiveDevices] = useState<ActiveDevice[]>([]);
  const [scale, setScale] = useState(0.5);
  const [error, setError] = useState<string | null>(null);
  const [syncScroll, setSyncScroll] = useState(true);
  const [layout, setLayout] = useState<'grid' | 'horizontal'>('horizontal');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showDevicesMenu, setShowDevicesMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    'mobile' | 'tablet' | 'desktop' | 'all' | null
  >(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenDevice, setFullscreenDevice] = useState<ActiveDevice | null>(null);
  const [isAllFullscreen, setIsAllFullscreen] = useState(false);
  const [framingErrors, setFramingErrors] = useState<Record<string, boolean>>({});
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Validate and sanitize URL to prevent XSS
  const isValidUrl = useCallback((urlString: string): boolean => {
    try {
      const parsed = new URL(urlString);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, []);

  // Sanitize URL to prevent XSS attacks via javascript:, data:, or other dangerous protocols
  const sanitizeUrl = useCallback((urlString: string): string => {
    try {
      const parsed = new URL(urlString);
      // Only allow http and https protocols
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return 'about:blank';
      }
      return urlString;
    } catch {
      return 'about:blank';
    }
  }, []);

  // Load URL
  const handleLoadUrl = useCallback(() => {
    setError(null);
    setFramingErrors({}); // Clear framing errors when loading new URL

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    let urlToLoad = url.trim();

    // Add https:// if no protocol specified
    if (!urlToLoad.startsWith('http://') && !urlToLoad.startsWith('https://')) {
      urlToLoad = 'https://' + urlToLoad;
    }

    if (!isValidUrl(urlToLoad)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setLoadedUrl(urlToLoad);

    // Add default devices if none selected
    if (activeDevices.length === 0) {
      const defaultDevices: ActiveDevice[] = [
        {
          ...DEVICE_PRESETS[1],
          rotated: false,
          key: `${DEVICE_PRESETS[1].id}-${Date.now()}-0`,
        }, // iPhone 14
        {
          ...DEVICE_PRESETS[5],
          rotated: false,
          key: `${DEVICE_PRESETS[5].id}-${Date.now()}-1`,
        }, // iPad Mini
        {
          ...DEVICE_PRESETS[10],
          rotated: false,
          key: `${DEVICE_PRESETS[10].id}-${Date.now()}-2`,
        }, // Laptop
      ];
      setActiveDevices(defaultDevices);
    }
  }, [url, isValidUrl, activeDevices.length]);

  // Add device
  const addDevice = useCallback((preset: DevicePreset) => {
    const newDevice: ActiveDevice = {
      ...preset,
      rotated: false,
      key: `${preset.id}-${Date.now()}`,
    };
    setActiveDevices((prev) => [...prev, newDevice]);
  }, []);

  // Remove device
  const removeDevice = useCallback((key: string) => {
    setActiveDevices((prev) => prev.filter((d) => d.key !== key));
    delete iframeRefs.current[key];
  }, []);

  // Rotate device
  const rotateDevice = useCallback((key: string) => {
    setActiveDevices((prev) =>
      prev.map((d) => (d.key === key ? { ...d, rotated: !d.rotated } : d)),
    );
  }, []);

  // Refresh all iframes
  const refreshAll = useCallback(() => {
    Object.values(iframeRefs.current).forEach((iframe) => {
      if (iframe) {
        iframe.src = iframe.src;
      }
    });
  }, []);

  // Quick preset selections
  const addQuickPreset = useCallback((category: 'mobile' | 'tablet' | 'desktop' | 'all') => {
    const now = Date.now();
    let devicesToAdd: ActiveDevice[] = [];

    // Toggle selection state
    setSelectedCategory((prev) => (prev === category ? null : category));

    if (category === 'all') {
      // Add one of each category
      devicesToAdd = [
        {
          ...DEVICE_PRESETS[1],
          rotated: false,
          key: `${DEVICE_PRESETS[1].id}-${now}-0`,
        },
        {
          ...DEVICE_PRESETS[5],
          rotated: false,
          key: `${DEVICE_PRESETS[5].id}-${now}-1`,
        },
        {
          ...DEVICE_PRESETS[10],
          rotated: false,
          key: `${DEVICE_PRESETS[10].id}-${now}-2`,
        },
      ];
    } else {
      const categoryDevices = DEVICE_PRESETS.filter((d) => d.category === category);
      devicesToAdd = categoryDevices.slice(0, 3).map((d, i) => ({
        ...d,
        rotated: false,
        key: `${d.id}-${now}-${i}`,
      }));
    }

    setActiveDevices((prev) => [...prev, ...devicesToAdd]);
  }, []);

  // Clear all devices
  const clearAllDevices = useCallback(() => {
    setActiveDevices([]);
    setSelectedCategory(null);
    iframeRefs.current = {};
  }, []);

  // Open fullscreen view
  const openFullscreen = useCallback((device: ActiveDevice) => {
    setFullscreenDevice(device);
    setIsFullscreen(true);
  }, []);

  // Close fullscreen view
  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setFullscreenDevice(null);
  }, []);

  // Open all devices fullscreen
  const openAllFullscreen = useCallback(() => {
    setIsAllFullscreen(true);
  }, []);

  // Close all devices fullscreen
  const closeAllFullscreen = useCallback(() => {
    setIsAllFullscreen(false);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleLoadUrl();
      }
      // Escape closes fullscreen
      if (e.key === 'Escape') {
        if (isFullscreen) {
          closeFullscreen();
        }
        if (isAllFullscreen) {
          closeAllFullscreen();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleLoadUrl, isFullscreen, isAllFullscreen, closeFullscreen, closeAllFullscreen]);

  // Get device dimensions (considering rotation)
  const getDeviceDimensions = (device: ActiveDevice) => {
    if (device.rotated) {
      return { width: device.height, height: device.width };
    }
    return { width: device.width, height: device.height };
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex flex-col gap-4">
          {/* Title and description */}
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              🧪 Responsive Tester
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Preview websites across multiple device sizes simultaneously.
            </p>
          </div>

          {/* URL Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLoadUrl();
                  }
                }}
                placeholder="Enter URL (e.g., https://example.com)"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleLoadUrl}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <PlayIcon />
              Load
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Device quick add buttons - Collapsible */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowAddMenu(!showAddMenu);
                  setShowDevicesMenu(false);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  showAddMenu
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>➕ Add</span>
                <ChevronDownIcon />
              </button>
              {showAddMenu && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[200px]">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        addQuickPreset('mobile');
                        setShowAddMenu(false);
                      }}
                      className={`px-3 py-2 text-sm rounded-md transition-colors text-left ${
                        selectedCategory === 'mobile'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      📱 Mobile Devices
                    </button>
                    <button
                      onClick={() => {
                        addQuickPreset('tablet');
                        setShowAddMenu(false);
                      }}
                      className={`px-3 py-2 text-sm rounded-md transition-colors text-left ${
                        selectedCategory === 'tablet'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      📲 Tablet Devices
                    </button>
                    <button
                      onClick={() => {
                        addQuickPreset('desktop');
                        setShowAddMenu(false);
                      }}
                      className={`px-3 py-2 text-sm rounded-md transition-colors text-left ${
                        selectedCategory === 'desktop'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      🖥️ Desktop Devices
                    </button>
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={() => {
                        addQuickPreset('all');
                        setShowAddMenu(false);
                      }}
                      className={`px-3 py-2 text-sm rounded-md transition-colors text-left ${
                        selectedCategory === 'all'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      ✨ All (One of Each)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Individual device selector - Collapsible */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowDevicesMenu(!showDevicesMenu);
                  setShowAddMenu(false);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  showDevicesMenu
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>📱 Devices</span>
                <ChevronDownIcon />
              </button>
              {showDevicesMenu && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[280px] max-h-[400px] overflow-y-auto">
                  <div className="mb-2 px-2 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Mobile
                  </div>
                  {DEVICE_PRESETS.filter((d) => d.category === 'mobile').map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        addDevice(preset);
                        setShowDevicesMenu(false);
                      }}
                      className="w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors text-left flex items-center justify-between"
                    >
                      <span>
                        {preset.icon} {preset.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {preset.width}×{preset.height}
                      </span>
                    </button>
                  ))}
                  <div className="my-2 px-2 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Tablet
                  </div>
                  {DEVICE_PRESETS.filter((d) => d.category === 'tablet').map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        addDevice(preset);
                        setShowDevicesMenu(false);
                      }}
                      className="w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors text-left flex items-center justify-between"
                    >
                      <span>
                        {preset.icon} {preset.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {preset.width}×{preset.height}
                      </span>
                    </button>
                  ))}
                  <div className="my-2 px-2 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Desktop
                  </div>
                  {DEVICE_PRESETS.filter((d) => d.category === 'desktop').map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        addDevice(preset);
                        setShowDevicesMenu(false);
                      }}
                      className="w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors text-left flex items-center justify-between"
                    >
                      <span>
                        {preset.icon} {preset.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {preset.width}×{preset.height}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

            {/* Scale control */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Scale:</span>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-24 accent-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 w-12">
                {Math.round(scale * 100)}%
              </span>
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

            {/* Layout toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLayout(layout === 'grid' ? 'horizontal' : 'grid')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
                  layout === 'grid'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <GridIcon />
                {layout === 'grid' ? 'Grid' : 'Row'}
              </button>
            </div>

            {/* Sync scroll toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={syncScroll}
                onChange={(e) => setSyncScroll(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Sync Scroll</span>
            </label>

            <div className="flex-1" />

            {/* Action buttons */}
            <button
              onClick={openAllFullscreen}
              disabled={activeDevices.length === 0}
              className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title="View all devices in fullscreen"
            >
              <ExpandIcon />
              Expand All
            </button>
            <button
              onClick={refreshAll}
              disabled={!loadedUrl}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <RefreshIcon />
              Refresh All
            </button>
            <button
              onClick={clearAllDevices}
              disabled={activeDevices.length === 0}
              className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Preview area */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto p-4 ${
          layout === 'grid' ? 'flex flex-wrap content-start gap-4' : 'flex gap-4'
        }`}
      >
        {!loadedUrl && activeDevices.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400 max-w-lg px-4">
              <div className="text-7xl mb-6">🖥️ 📱 💻</div>
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-3">
                Test Your Website Across All Devices
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                See how your website looks on phones, tablets, and desktops — all at once. Simply
                enter a URL above and watch the magic happen as your site loads across multiple
                screen sizes simultaneously.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                  How to get started:
                </h3>
                <ol className="text-sm text-blue-600 dark:text-blue-400 text-left space-y-1">
                  <li>1. Enter a website URL in the field above</li>
                  <li>
                    2. Click <strong>Load</strong> or press{' '}
                    <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">
                      ⌘+Enter
                    </kbd>
                  </li>
                  <li>
                    3. Add more devices using the <strong>Add</strong> or <strong>Devices</strong>{' '}
                    buttons
                  </li>
                  <li>4. Adjust scale, rotate devices, or expand to fullscreen</li>
                </ol>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                <span>📱 Mobile</span>
                <span>•</span>
                <span>📲 Tablet</span>
                <span>•</span>
                <span>🖥️ Desktop</span>
                <span>•</span>
                <span>14+ Device Presets</span>
              </div>
            </div>
          </div>
        )}

        {activeDevices.map((device) => {
          const dimensions = getDeviceDimensions(device);
          const scaledWidth = dimensions.width * scale;
          const scaledHeight = dimensions.height * scale;

          return (
            <div
              key={device.key}
              className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              style={{ width: scaledWidth + 2, height: 'fit-content' }}
            >
              {/* Device header */}
              <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{device.icon}</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-32">
                    {device.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {dimensions.width}×{dimensions.height}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openFullscreen(device)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Fullscreen"
                  >
                    <ExpandIcon />
                  </button>
                  <button
                    onClick={() => rotateDevice(device.key)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Rotate"
                  >
                    <RotateIcon />
                  </button>
                  <button
                    onClick={() => removeDevice(device.key)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                    title="Remove"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>

              {/* Device frame */}
              <div
                className="bg-gray-50 dark:bg-gray-900 overflow-hidden"
                style={{ width: scaledWidth, height: scaledHeight }}
              >
                {loadedUrl ? (
                  framingErrors[device.key] ? (
                    <div
                      className="w-full h-full overflow-auto p-2"
                      style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        width: dimensions.width,
                        height: dimensions.height,
                      }}
                    >
                      <FramingErrorPanel url={loadedUrl} />
                    </div>
                  ) : (
                    <iframe
                      ref={(el) => {
                        iframeRefs.current[device.key] = el;
                      }}
                      src={sanitizeUrl(loadedUrl)}
                      title={`${device.name} preview`}
                      style={{
                        width: dimensions.width,
                        height: dimensions.height,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        border: 'none',
                      }}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      onLoad={() => {
                        const iframe = iframeRefs.current[device.key];
                        if (iframe) {
                          try {
                            const doc = iframe.contentDocument || iframe.contentWindow?.document;
                            if (!doc) {
                              setFramingErrors((prev) => ({ ...prev, [device.key]: true }));
                            }
                          } catch {
                            setFramingErrors((prev) => ({ ...prev, [device.key]: true }));
                          }
                        }
                      }}
                      onError={() => {
                        setFramingErrors((prev) => ({ ...prev, [device.key]: true }));
                      }}
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <span className="text-sm">Enter URL to preview</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with info */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div>
            {activeDevices.length > 0 && (
              <span>
                {activeDevices.length} device
                {activeDevices.length !== 1 ? 's' : ''} active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && fullscreenDevice && (
        <div className="fixed inset-0 z-50 bg-gray-900/95 flex flex-col">
          {/* Fullscreen Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">{fullscreenDevice.icon}</span>
                <span className="text-white font-medium">{fullscreenDevice.name}</span>
                <span className="text-gray-400 text-sm">
                  {getDeviceDimensions(fullscreenDevice).width}×
                  {getDeviceDimensions(fullscreenDevice).height}
                </span>
              </div>

              {/* Device switcher in fullscreen */}
              <div className="flex items-center gap-2 ml-4 border-l border-gray-700 pl-4">
                <span className="text-gray-400 text-sm">Switch:</span>
                {activeDevices.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setFullscreenDevice(d)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      d.key === fullscreenDevice.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {d.icon} {d.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Rotate in fullscreen */}
              <button
                onClick={() => rotateDevice(fullscreenDevice.key)}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                title="Rotate"
              >
                <RotateIcon />
              </button>

              {/* Scale in fullscreen */}
              <div className="flex items-center gap-2 px-3">
                <span className="text-gray-400 text-sm">Scale:</span>
                <input
                  type="range"
                  min="0.3"
                  max="1"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-24 accent-blue-500"
                />
                <span className="text-white text-sm w-12">{Math.round(scale * 100)}%</span>
              </div>

              {/* Close fullscreen */}
              <button
                onClick={closeFullscreen}
                className="p-2 bg-gray-700 hover:bg-red-600 rounded-lg text-white transition-colors"
                title="Exit Fullscreen (Esc)"
              >
                <CollapseIcon />
              </button>
            </div>
          </div>

          {/* Fullscreen Preview */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden border-2 border-gray-600"
              style={{
                width: getDeviceDimensions(fullscreenDevice).width * scale + 4,
              }}
            >
              {/* Device frame header */}
              <div className="flex items-center justify-center px-3 py-2 bg-gray-700 border-b border-gray-600">
                <span className="text-white text-sm">{loadedUrl || 'No URL loaded'}</span>
              </div>
              <div
                className="bg-gray-100 dark:bg-gray-900 overflow-hidden"
                style={{
                  width: getDeviceDimensions(fullscreenDevice).width * scale,
                  height: getDeviceDimensions(fullscreenDevice).height * scale,
                }}
              >
                {loadedUrl ? (
                  framingErrors['fullscreen'] ? (
                    <div
                      className="w-full h-full overflow-auto p-4"
                      style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        width: getDeviceDimensions(fullscreenDevice).width,
                        height: getDeviceDimensions(fullscreenDevice).height,
                      }}
                    >
                      <FramingErrorPanel url={loadedUrl} />
                    </div>
                  ) : (
                    <iframe
                      src={sanitizeUrl(loadedUrl)}
                      title={`${fullscreenDevice.name} fullscreen preview`}
                      style={{
                        width: getDeviceDimensions(fullscreenDevice).width,
                        height: getDeviceDimensions(fullscreenDevice).height,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        border: 'none',
                      }}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      onLoad={(e) => {
                        const iframe = e.currentTarget;
                        try {
                          const doc = iframe.contentDocument || iframe.contentWindow?.document;
                          if (!doc) {
                            setFramingErrors((prev) => ({ ...prev, fullscreen: true }));
                          }
                        } catch {
                          setFramingErrors((prev) => ({ ...prev, fullscreen: true }));
                        }
                      }}
                      onError={() => {
                        setFramingErrors((prev) => ({ ...prev, fullscreen: true }));
                      }}
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span>Enter URL to preview</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fullscreen Footer */}
          <div className="flex-shrink-0 px-4 py-2 bg-gray-800 border-t border-gray-700 text-center">
            <span className="text-gray-400 text-xs">
              Press <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-white">Esc</kbd> to exit
              fullscreen
            </span>
          </div>
        </div>
      )}

      {/* All Devices Fullscreen Modal */}
      {isAllFullscreen && activeDevices.length > 0 && (
        <div className="fixed inset-0 z-50 bg-gray-900/95 flex flex-col">
          {/* All Fullscreen Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-4">
              <span className="text-white font-medium text-lg">📱 All Devices Preview</span>
              <span className="text-gray-400 text-sm">
                {activeDevices.length} device
                {activeDevices.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Scale in all fullscreen */}
              <div className="flex items-center gap-2 px-3">
                <span className="text-gray-400 text-sm">Scale:</span>
                <input
                  type="range"
                  min="0.2"
                  max="0.8"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-24 accent-blue-500"
                />
                <span className="text-white text-sm w-12">{Math.round(scale * 100)}%</span>
              </div>

              {/* Close all fullscreen */}
              <button
                onClick={closeAllFullscreen}
                className="p-2 bg-gray-700 hover:bg-red-600 rounded-lg text-white transition-colors"
                title="Exit Fullscreen (Esc)"
              >
                <CollapseIcon />
              </button>
            </div>
          </div>

          {/* All Devices Grid */}
          <div className="flex-1 overflow-auto p-6">
            <div className="flex flex-wrap gap-6 justify-center items-start">
              {activeDevices.map((device) => {
                const dimensions = getDeviceDimensions(device);
                const fullscreenScale = Math.min(scale, 0.6);
                const scaledWidth = dimensions.width * fullscreenScale;
                const scaledHeight = dimensions.height * fullscreenScale;

                return (
                  <div
                    key={device.key}
                    className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden border border-gray-600 flex-shrink-0"
                    style={{ width: scaledWidth + 2 }}
                  >
                    {/* Device header */}
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-700 border-b border-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{device.icon}</span>
                        <span className="text-white text-sm font-medium">{device.name}</span>
                      </div>
                      <span className="text-gray-400 text-xs">
                        {dimensions.width}×{dimensions.height}
                      </span>
                    </div>

                    {/* Device frame */}
                    <div
                      className="bg-gray-900 overflow-hidden"
                      style={{ width: scaledWidth, height: scaledHeight }}
                    >
                      {loadedUrl ? (
                        framingErrors[`allfullscreen-${device.key}`] ? (
                          <div
                            className="w-full h-full overflow-auto p-4"
                            style={{
                              transform: `scale(${fullscreenScale})`,
                              transformOrigin: 'top left',
                              width: dimensions.width,
                              height: dimensions.height,
                            }}
                          >
                            <FramingErrorPanel url={loadedUrl} />
                          </div>
                        ) : (
                          <iframe
                            src={sanitizeUrl(loadedUrl)}
                            title={`${device.name} all fullscreen preview`}
                            style={{
                              width: dimensions.width,
                              height: dimensions.height,
                              transform: `scale(${fullscreenScale})`,
                              transformOrigin: 'top left',
                              border: 'none',
                            }}
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                            onLoad={(e) => {
                              const iframe = e.currentTarget;
                              try {
                                const doc =
                                  iframe.contentDocument || iframe.contentWindow?.document;
                                if (!doc) {
                                  setFramingErrors((prev) => ({
                                    ...prev,
                                    [`allfullscreen-${device.key}`]: true,
                                  }));
                                }
                              } catch {
                                setFramingErrors((prev) => ({
                                  ...prev,
                                  [`allfullscreen-${device.key}`]: true,
                                }));
                              }
                            }}
                            onError={() => {
                              setFramingErrors((prev) => ({
                                ...prev,
                                [`allfullscreen-${device.key}`]: true,
                              }));
                            }}
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <span className="text-sm">No URL loaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Fullscreen Footer */}
          <div className="flex-shrink-0 px-4 py-2 bg-gray-800 border-t border-gray-700 text-center">
            <span className="text-gray-400 text-xs">
              Press <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-white">Esc</kbd> to exit
              fullscreen • Click on any device above to view it in single fullscreen mode
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
