/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * JSON Content Detector
 * Detect content types like dates, URLs, colors, emails, UUIDs
 */

import { ContentType, ContentInfo } from './types';

/**
 * Check if string is a valid date
 */
export const isValidDate = (str: string): boolean => {
  // ISO 8601 format
  const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/;
  // RFC 2822 format
  const rfcRegex = /^\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2}/;
  // Unix timestamp (seconds or milliseconds)
  const unixRegex = /^\d{10,13}$/;

  if (isoRegex.test(str) || rfcRegex.test(str)) {
    const date = new Date(str);
    return !isNaN(date.getTime());
  }
  if (unixRegex.test(str)) {
    const timestamp = parseInt(str);
    const date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
    return !isNaN(date.getTime()) && date.getFullYear() > 1970 && date.getFullYear() < 2100;
  }
  return false;
};

/**
 * Check if string is a valid URL
 */
export const isValidUrl = (str: string): boolean => {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Check if string is an image URL
 */
export const isImageUrl = (str: string): boolean => {
  if (!isValidUrl(str)) return false;
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif)(\?.*)?$/i;
  const imageHosts = /(imgur\.com|giphy\.com|unsplash\.com|pexels\.com)/i;
  return imageExtensions.test(str) || imageHosts.test(str);
};

/**
 * Check if string is a valid color
 */
export const isValidColor = (str: string): boolean => {
  // Hex colors
  const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
  // RGB/RGBA
  const rgbRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/i;
  // HSL/HSLA
  const hslRegex = /^hsla?\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(,\s*[\d.]+\s*)?\)$/i;
  // Named colors (common ones)
  const namedColors =
    /^(red|blue|green|yellow|orange|purple|pink|black|white|gray|grey|brown|cyan|magenta)$/i;

  return hexRegex.test(str) || rgbRegex.test(str) || hslRegex.test(str) || namedColors.test(str);
};

/**
 * Check if string is a valid email
 */
export const isValidEmail = (str: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
};

/**
 * Check if string is a valid UUID
 */
export const isValidUuid = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Check if string is a JSON string
 */
export const isJsonString = (str: string): boolean => {
  try {
    const trimmed = str.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      JSON.parse(trimmed);
      return true;
    }
  } catch {
    // Not valid JSON
  }
  return false;
};

/**
 * Detect the content type of a value
 */
export const detectContentType = (value: unknown): ContentInfo => {
  if (value === null) {
    return { type: 'null', value, displayValue: 'null' };
  }
  if (typeof value === 'boolean') {
    return { type: 'boolean', value, displayValue: String(value) };
  }
  if (typeof value === 'number') {
    return { type: 'number', value, displayValue: String(value) };
  }
  if (typeof value === 'string') {
    if (isValidDate(value)) {
      const date = new Date(value);
      return {
        type: 'date',
        value,
        displayValue: date.toLocaleString(),
      };
    }
    if (isImageUrl(value)) {
      return { type: 'image', value };
    }
    if (isValidUrl(value)) {
      return { type: 'url', value };
    }
    if (isValidColor(value)) {
      return { type: 'color', value };
    }
    if (isValidEmail(value)) {
      return { type: 'email', value };
    }
    if (isValidUuid(value)) {
      return { type: 'uuid', value };
    }
    if (isJsonString(value)) {
      return { type: 'json', value };
    }
    return { type: 'string', value };
  }
  return { type: 'string', value };
};

/**
 * Get display label for content type
 */
export const getContentTypeLabel = (type: ContentType): string => {
  const labels: Record<ContentType, string> = {
    date: 'Date/Time',
    url: 'URL',
    image: 'Image URL',
    color: 'Color',
    email: 'Email',
    uuid: 'UUID',
    json: 'JSON String',
    number: 'Number',
    boolean: 'Boolean',
    null: 'Null',
    string: 'String',
  };
  return labels[type] || 'Unknown';
};

/**
 * Get icon for content type
 */
export const getContentTypeIcon = (type: ContentType): string => {
  const icons: Record<ContentType, string> = {
    date: '📅',
    url: '🔗',
    image: '🖼️',
    color: '🎨',
    email: '📧',
    uuid: '🔑',
    json: '{ }',
    number: '#',
    boolean: '◐',
    null: '∅',
    string: 'Aa',
  };
  return icons[type] || '?';
};
