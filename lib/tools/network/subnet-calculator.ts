/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Subnet Calculator - IPv4 and IPv6 subnet calculations
 *
 * All calculations are performed client-side using bitwise operations
 * and BigInt for IPv6 address math.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SubnetInput {
  address: string;
  cidr: number;
  type: 'ipv4' | 'ipv6';
}

export interface IPv4Result {
  type: 'ipv4';
  valid: boolean;
  address: string;
  cidr: number;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableHost: string;
  lastUsableHost: string;
  subnetMask: string;
  subnetMaskBinary: string;
  wildcardMask: string;
  totalHosts: number;
  usableHosts: number;
  ipClass: string;
  isPrivate: boolean;
  binaryAddress: string;
  networkBits: number;
  hostBits: number;
}

export interface IPv6Result {
  type: 'ipv6';
  valid: boolean;
  address: string;
  cidr: number;
  networkAddress: string;
  addressRangeStart: string;
  addressRangeEnd: string;
  totalAddresses: string;
  addressType: string;
  expandedForm: string;
  compressedForm: string;
  networkBits: number;
  hostBits: number;
  binaryAddress: string;
}

export interface SubnetError {
  type: 'ipv4' | 'ipv6';
  valid: false;
  error: string;
}

export type SubnetResult = IPv4Result | IPv6Result | SubnetError;

// ─── IPv4 Utilities ──────────────────────────────────────────────────────────

function isValidIPv4(address: string): boolean {
  const parts = address.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255 && String(num) === part;
  });
}

function ipv4ToNumber(address: string): number {
  const parts = address.split('.').map((p) => parseInt(p, 10));
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function numberToIPv4(num: number): string {
  return [(num >>> 24) & 0xff, (num >>> 16) & 0xff, (num >>> 8) & 0xff, num & 0xff].join('.');
}

function numberToBinaryString(num: number): string {
  return [
    ((num >>> 24) & 0xff).toString(2).padStart(8, '0'),
    ((num >>> 16) & 0xff).toString(2).padStart(8, '0'),
    ((num >>> 8) & 0xff).toString(2).padStart(8, '0'),
    (num & 0xff).toString(2).padStart(8, '0'),
  ].join('.');
}

function getIPv4Class(firstOctet: number): string {
  if (firstOctet >= 0 && firstOctet <= 127) return 'A';
  if (firstOctet >= 128 && firstOctet <= 191) return 'B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'C';
  if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)';
  return 'E (Reserved)';
}

function isPrivateIPv4(address: string): boolean {
  const parts = address.split('.').map((p) => parseInt(p, 10));
  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 127.0.0.0/8 (loopback)
  if (parts[0] === 127) return true;
  // 169.254.0.0/16 (link-local)
  if (parts[0] === 169 && parts[1] === 254) return true;
  return false;
}

function calculateIPv4(address: string, cidr: number): IPv4Result | SubnetError {
  if (!isValidIPv4(address)) {
    return { type: 'ipv4', valid: false, error: 'Invalid IPv4 address format' };
  }
  if (cidr < 0 || cidr > 32 || !Number.isInteger(cidr)) {
    return { type: 'ipv4', valid: false, error: 'CIDR must be an integer between 0 and 32' };
  }

  const ipNum = ipv4ToNumber(address);
  const maskNum = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
  const wildcardNum = ~maskNum >>> 0;

  const networkNum = (ipNum & maskNum) >>> 0;
  const broadcastNum = (networkNum | wildcardNum) >>> 0;

  const totalHosts = Math.pow(2, 32 - cidr);
  let usableHosts: number;
  let firstUsable: string;
  let lastUsable: string;

  if (cidr === 32) {
    usableHosts = 1;
    firstUsable = numberToIPv4(networkNum);
    lastUsable = numberToIPv4(networkNum);
  } else if (cidr === 31) {
    // Point-to-point link (RFC 3021)
    usableHosts = 2;
    firstUsable = numberToIPv4(networkNum);
    lastUsable = numberToIPv4(broadcastNum);
  } else if (cidr === 0) {
    usableHosts = totalHosts - 2;
    firstUsable = numberToIPv4((networkNum + 1) >>> 0);
    lastUsable = numberToIPv4((broadcastNum - 1) >>> 0);
  } else {
    usableHosts = totalHosts - 2;
    firstUsable = numberToIPv4((networkNum + 1) >>> 0);
    lastUsable = numberToIPv4((broadcastNum - 1) >>> 0);
  }

  const firstOctet = parseInt(address.split('.')[0], 10);

  return {
    type: 'ipv4',
    valid: true,
    address,
    cidr,
    networkAddress: numberToIPv4(networkNum),
    broadcastAddress: numberToIPv4(broadcastNum),
    firstUsableHost: firstUsable,
    lastUsableHost: lastUsable,
    subnetMask: numberToIPv4(maskNum),
    subnetMaskBinary: numberToBinaryString(maskNum),
    wildcardMask: numberToIPv4(wildcardNum),
    totalHosts,
    usableHosts,
    ipClass: getIPv4Class(firstOctet),
    isPrivate: isPrivateIPv4(address),
    binaryAddress: numberToBinaryString(ipNum),
    networkBits: cidr,
    hostBits: 32 - cidr,
  };
}

// ─── IPv6 Utilities ──────────────────────────────────────────────────────────

function expandIPv6(address: string): string | null {
  // Handle :: expansion
  let groups: string[];

  if (address.includes('::')) {
    const parts = address.split('::');
    if (parts.length > 2) return null;

    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    const missing = 8 - left.length - right.length;

    if (missing < 0) return null;

    const middle = Array(missing).fill('0000');
    groups = [
      ...left.map((g) => g.padStart(4, '0')),
      ...middle,
      ...right.map((g) => g.padStart(4, '0')),
    ];
  } else {
    groups = address.split(':');
    if (groups.length !== 8) return null;
    groups = groups.map((g) => g.padStart(4, '0'));
  }

  if (groups.length !== 8) return null;

  // Validate each group
  for (const group of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(group) && group !== '0000') {
      // Re-check after padding
      if (!/^[0-9a-fA-F]{4}$/.test(group)) return null;
    }
  }

  return groups.map((g) => g.toLowerCase().padStart(4, '0')).join(':');
}

function compressIPv6(expanded: string): string {
  const groups = expanded.split(':');

  // Find the longest run of consecutive all-zero groups
  let bestStart = -1;
  let bestLen = 0;
  let currentStart = -1;
  let currentLen = 0;

  for (let i = 0; i < groups.length; i++) {
    if (groups[i] === '0000') {
      if (currentStart === -1) {
        currentStart = i;
        currentLen = 1;
      } else {
        currentLen++;
      }
      if (currentLen > bestLen) {
        bestStart = currentStart;
        bestLen = currentLen;
      }
    } else {
      currentStart = -1;
      currentLen = 0;
    }
  }

  // Remove leading zeros from each group
  const shortened = groups.map((g) => g.replace(/^0+/, '') || '0');

  if (bestLen <= 1) {
    return shortened.join(':');
  }

  const before = shortened.slice(0, bestStart);
  const after = shortened.slice(bestStart + bestLen);

  if (before.length === 0 && after.length === 0) return '::';
  if (before.length === 0) return '::' + after.join(':');
  if (after.length === 0) return before.join(':') + '::';
  return before.join(':') + '::' + after.join(':');
}

function ipv6ToBigInt(expanded: string): bigint {
  const groups = expanded.split(':');
  let result = 0n;
  for (const group of groups) {
    result = (result << 16n) | BigInt(parseInt(group, 16));
  }
  return result;
}

function bigIntToIPv6(num: bigint): string {
  const groups: string[] = [];
  for (let i = 0; i < 8; i++) {
    groups.unshift(((num >> BigInt(i * 16)) & 0xffffn).toString(16).padStart(4, '0'));
  }
  return groups.join(':');
}

function ipv6ToBinaryString(expanded: string): string {
  const groups = expanded.split(':');
  return groups.map((g) => parseInt(g, 16).toString(2).padStart(16, '0')).join(':');
}

function getIPv6AddressType(expanded: string): string {
  const firstGroup = expanded.split(':')[0];
  const firstNibble = parseInt(firstGroup.charAt(0), 16);
  const firstTwoChars = firstGroup.substring(0, 2);
  const fullPrefix = expanded.replace(/:/g, '');

  // Unspecified
  if (fullPrefix === '00000000000000000000000000000000') {
    return 'Unspecified (::)';
  }

  // Loopback
  if (fullPrefix === '00000000000000000000000000000001') {
    return 'Loopback (::1)';
  }

  // Link-local: fe80::/10
  if (firstTwoChars === 'fe' && (parseInt(firstGroup.charAt(2), 16) & 0xc) === 0x8) {
    return 'Link-Local';
  }

  // Unique local: fc00::/7
  if (firstNibble === 0xf && (parseInt(firstGroup.charAt(1), 16) & 0xc) === 0xc) {
    return 'Unique Local (ULA)';
  }

  // Multicast: ff00::/8
  if (firstTwoChars === 'ff') {
    return 'Multicast';
  }

  // 6to4: 2002::/16
  if (firstGroup === '2002') {
    return '6to4 Tunnel';
  }

  // Teredo: 2001:0000::/32
  if (firstGroup === '2001' && expanded.split(':')[1] === '0000') {
    return 'Teredo Tunnel';
  }

  // Documentation: 2001:0db8::/32
  if (firstGroup === '2001' && expanded.split(':')[1] === '0db8') {
    return 'Documentation';
  }

  // Global unicast: 2000::/3
  if (firstNibble >= 0x2 && firstNibble <= 0x3) {
    return 'Global Unicast';
  }

  return 'Reserved';
}

function calculateIPv6(address: string, cidr: number): IPv6Result | SubnetError {
  const expanded = expandIPv6(address);
  if (!expanded) {
    return { type: 'ipv6', valid: false, error: 'Invalid IPv6 address format' };
  }
  if (cidr < 0 || cidr > 128 || !Number.isInteger(cidr)) {
    return { type: 'ipv6', valid: false, error: 'CIDR must be an integer between 0 and 128' };
  }

  const ipBigInt = ipv6ToBigInt(expanded);

  // Create mask
  const mask = cidr === 0 ? 0n : ((1n << 128n) - 1n) << BigInt(128 - cidr);
  const hostMask = cidr === 128 ? 0n : (1n << BigInt(128 - cidr)) - 1n;

  const networkBigInt = ipBigInt & mask;
  const rangeEnd = networkBigInt | hostMask;

  const totalAddresses = cidr === 128 ? 1n : 1n << BigInt(128 - cidr);

  const networkExpanded = bigIntToIPv6(networkBigInt);
  const rangeEndExpanded = bigIntToIPv6(rangeEnd);

  return {
    type: 'ipv6',
    valid: true,
    address,
    cidr,
    networkAddress: compressIPv6(networkExpanded),
    addressRangeStart: compressIPv6(networkExpanded),
    addressRangeEnd: compressIPv6(rangeEndExpanded),
    totalAddresses: totalAddresses.toString(),
    addressType: getIPv6AddressType(expanded),
    expandedForm: expanded,
    compressedForm: compressIPv6(expanded),
    networkBits: cidr,
    hostBits: 128 - cidr,
    binaryAddress: ipv6ToBinaryString(expanded),
  };
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

export function calculateSubnet(input: SubnetInput): SubnetResult {
  if (input.type === 'ipv4') {
    return calculateIPv4(input.address, input.cidr);
  }
  return calculateIPv6(input.address, input.cidr);
}

/**
 * Subnet calculator (placeholder for tool registry)
 * The dedicated UI page handles the interactive experience.
 */
export const subnetCalculator = async (inputStr: string): Promise<string> => {
  try {
    const input = JSON.parse(inputStr) as SubnetInput;
    const result = calculateSubnet(input);
    return JSON.stringify(result, null, 2);
  } catch {
    return JSON.stringify({ error: 'Invalid input. Expected JSON with address, cidr, and type.' });
  }
};
