/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Generators - UUID generators, timestamp conversions
 * Pure generator functions
 */

/**
 * Generates UUID v4 (random)
 */
export const generateUUID = async (): Promise<string> => {
  return generateUUIDv4();
};

/**
 * Generates UUID v1 (timestamp-based)
 */
export const generateUUIDv1 = (): string => {
  const timestamp = Date.now();
  const timeHex = timestamp.toString(16).padStart(12, '0');
  const clockSeq = Math.floor(Math.random() * 16384)
    .toString(16)
    .padStart(4, '0');
  const node = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0'),
  ).join('');

  return `${timeHex.slice(0, 8)}-${timeHex.slice(8)}-1${clockSeq.slice(
    0,
    3,
  )}-8${clockSeq.slice(3)}-${node}`;
};

/**
 * Generates UUID v3 (MD5-based name)
 */
export const generateUUIDv3 = (namespace: string, name: string): string => {
  const combined = namespace + name;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-3${hex.slice(
    0,
    3,
  )}-8${hex.slice(0, 3)}-${hex.padEnd(12, '0')}`;
};

/**
 * Generates UUID v4 (random)
 */
export const generateUUIDv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Generates UUID v5 (SHA1-based name)
 */
export const generateUUIDv5 = (namespace: string, name: string): string => {
  const combined = namespace + name;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-5${hex.slice(
    0,
    3,
  )}-8${hex.slice(0, 3)}-${hex.padEnd(12, '0')}`;
};

/**
 * Generates timestamp-first UUID (for database ordering)
 */
export const generateTimestampFirstUUID = (): string => {
  const timestamp = Date.now().toString(16).padStart(12, '0');
  const random = Array.from({ length: 20 }, () => Math.floor(Math.random() * 16).toString(16)).join(
    '',
  );

  return `${timestamp}-${random.slice(0, 4)}-4${random.slice(
    4,
    7,
  )}-8${random.slice(7, 10)}-${random.slice(10)}`;
};

/**
 * Generates nil UUID (all zeros)
 */
export const generateNilUUID = (): string => {
  return '00000000-0000-0000-0000-000000000000';
};

/**
 * Generates max UUID (all Fs)
 */
export const generateMaxUUID = (): string => {
  return 'ffffffff-ffff-ffff-ffff-ffffffffffff';
};

/**
 * Generates bulk UUIDs
 */
export const generateBulkUUIDs = (
  count: number,
  version: string,
  namespace?: string,
  name?: string,
): string[] => {
  const uuids: string[] = [];

  for (let i = 0; i < count; i++) {
    switch (version) {
      case 'v1':
        uuids.push(generateUUIDv1());
        break;
      case 'v3':
        uuids.push(
          generateUUIDv3(namespace || 'default-namespace', `${name || 'default-name'}-${i}`),
        );
        break;
      case 'v4':
        uuids.push(generateUUIDv4());
        break;
      case 'v5':
        uuids.push(
          generateUUIDv5(namespace || 'default-namespace', `${name || 'default-name'}-${i}`),
        );
        break;
      case 'timestamp-first':
        uuids.push(generateTimestampFirstUUID());
        break;
      case 'nil':
        uuids.push(generateNilUUID());
        break;
      case 'max':
        uuids.push(generateMaxUUID());
        break;
      default:
        uuids.push(generateUUIDv4());
    }
  }

  return uuids;
};

/**
 * Converts epoch timestamp to human-readable date
 */
export const epochToDate = async (input: string): Promise<string> => {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  try {
    const epoch = parseInt(input, 10);

    if (isNaN(epoch)) {
      throw new Error('Invalid epoch timestamp');
    }

    // Detect if milliseconds or seconds
    const timestamp = epoch > 10000000000 ? epoch : epoch * 1000;
    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
      throw new Error('Invalid timestamp value');
    }

    return JSON.stringify(
      {
        epoch: input,
        iso: date.toISOString(),
        utc: date.toUTCString(),
        local: date.toLocaleString(),
        timestamp: date.getTime(),
      },
      null,
      2,
    );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to convert epoch to date');
  }
};

/**
 * Converts date to epoch timestamp
 */
export const dateToEpoch = async (input: string): Promise<string> => {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  try {
    const date = new Date(input);

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }

    return JSON.stringify(
      {
        input: input,
        milliseconds: date.getTime(),
        seconds: Math.floor(date.getTime() / 1000),
        iso: date.toISOString(),
        utc: date.toUTCString(),
      },
      null,
      2,
    );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to convert date to epoch');
  }
};
