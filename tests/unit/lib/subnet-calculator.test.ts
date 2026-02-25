/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { subnetCalculator, calculateSubnet } from '@/lib/tools/network/subnet-calculator';

describe('subnetCalculator', () => {
  // ─── IPv4 Basic CIDR Values ──────────────────────────────────────────────

  describe('IPv4 calculations', () => {
    it('should calculate /24 subnet correctly', () => {
      const result = calculateSubnet({ address: '192.168.1.0', cidr: 24, type: 'ipv4' });
      expect(result.valid).toBe(true);
      if (result.type !== 'ipv4' || !result.valid) throw new Error('unexpected');
      expect(result.networkAddress).toBe('192.168.1.0');
      expect(result.broadcastAddress).toBe('192.168.1.255');
      expect(result.subnetMask).toBe('255.255.255.0');
      expect(result.wildcardMask).toBe('0.0.0.255');
      expect(result.firstUsableHost).toBe('192.168.1.1');
      expect(result.lastUsableHost).toBe('192.168.1.254');
      expect(result.totalHosts).toBe(256);
      expect(result.usableHosts).toBe(254);
      expect(result.networkBits).toBe(24);
      expect(result.hostBits).toBe(8);
    });

    it('should calculate /16 subnet correctly', () => {
      const result = calculateSubnet({ address: '172.16.5.100', cidr: 16, type: 'ipv4' });
      expect(result.valid).toBe(true);
      if (result.type !== 'ipv4' || !result.valid) throw new Error('unexpected');
      expect(result.networkAddress).toBe('172.16.0.0');
      expect(result.broadcastAddress).toBe('172.16.255.255');
      expect(result.subnetMask).toBe('255.255.0.0');
      expect(result.wildcardMask).toBe('0.0.255.255');
      expect(result.totalHosts).toBe(65536);
      expect(result.usableHosts).toBe(65534);
    });

    it('should calculate /8 subnet correctly', () => {
      const result = calculateSubnet({ address: '10.0.0.1', cidr: 8, type: 'ipv4' });
      expect(result.valid).toBe(true);
      if (result.type !== 'ipv4' || !result.valid) throw new Error('unexpected');
      expect(result.networkAddress).toBe('10.0.0.0');
      expect(result.broadcastAddress).toBe('10.255.255.255');
      expect(result.subnetMask).toBe('255.0.0.0');
      expect(result.wildcardMask).toBe('0.255.255.255');
      expect(result.totalHosts).toBe(16777216);
      expect(result.usableHosts).toBe(16777214);
      expect(result.ipClass).toBe('A');
      expect(result.isPrivate).toBe(true);
    });

    it('should calculate /28 subnet correctly', () => {
      const result = calculateSubnet({ address: '192.168.10.35', cidr: 28, type: 'ipv4' });
      expect(result.valid).toBe(true);
      if (result.type !== 'ipv4' || !result.valid) throw new Error('unexpected');
      expect(result.networkAddress).toBe('192.168.10.32');
      expect(result.broadcastAddress).toBe('192.168.10.47');
      expect(result.subnetMask).toBe('255.255.255.240');
      expect(result.wildcardMask).toBe('0.0.0.15');
      expect(result.firstUsableHost).toBe('192.168.10.33');
      expect(result.lastUsableHost).toBe('192.168.10.46');
      expect(result.totalHosts).toBe(16);
      expect(result.usableHosts).toBe(14);
    });

    it('should calculate /30 (point-to-point-like) subnet correctly', () => {
      const result = calculateSubnet({ address: '10.1.1.4', cidr: 30, type: 'ipv4' });
      expect(result.valid).toBe(true);
      if (result.type !== 'ipv4' || !result.valid) throw new Error('unexpected');
      expect(result.networkAddress).toBe('10.1.1.4');
      expect(result.broadcastAddress).toBe('10.1.1.7');
      expect(result.totalHosts).toBe(4);
      expect(result.usableHosts).toBe(2);
    });

    it('should calculate /32 single host correctly', () => {
      const result = calculateSubnet({ address: '192.168.1.100', cidr: 32, type: 'ipv4' });
      expect(result.valid).toBe(true);
      if (result.type !== 'ipv4' || !result.valid) throw new Error('unexpected');
      expect(result.networkAddress).toBe('192.168.1.100');
      expect(result.broadcastAddress).toBe('192.168.1.100');
      expect(result.firstUsableHost).toBe('192.168.1.100');
      expect(result.lastUsableHost).toBe('192.168.1.100');
      expect(result.totalHosts).toBe(1);
      expect(result.usableHosts).toBe(1);
      expect(result.subnetMask).toBe('255.255.255.255');
      expect(result.wildcardMask).toBe('0.0.0.0');
    });

    it('should calculate /31 point-to-point link correctly', () => {
      const result = calculateSubnet({ address: '10.0.0.2', cidr: 31, type: 'ipv4' });
      expect(result.valid).toBe(true);
      if (result.type !== 'ipv4' || !result.valid) throw new Error('unexpected');
      expect(result.totalHosts).toBe(2);
      expect(result.usableHosts).toBe(2);
    });

    it('should calculate /0 correctly (entire IPv4 space)', () => {
      const result = calculateSubnet({ address: '0.0.0.0', cidr: 0, type: 'ipv4' });
      expect(result.valid).toBe(true);
      if (result.type !== 'ipv4' || !result.valid) throw new Error('unexpected');
      expect(result.networkAddress).toBe('0.0.0.0');
      expect(result.broadcastAddress).toBe('255.255.255.255');
      expect(result.subnetMask).toBe('0.0.0.0');
      expect(result.wildcardMask).toBe('255.255.255.255');
      expect(result.totalHosts).toBe(4294967296);
    });

    it('should produce correct binary representation', () => {
      const result = calculateSubnet({ address: '192.168.1.1', cidr: 24, type: 'ipv4' });
      expect(result.valid).toBe(true);
      if (result.type !== 'ipv4' || !result.valid) throw new Error('unexpected');
      expect(result.binaryAddress).toBe('11000000.10101000.00000001.00000001');
      expect(result.subnetMaskBinary).toBe('11111111.11111111.11111111.00000000');
    });

    it('should detect IP class correctly', () => {
      const classA = calculateSubnet({ address: '10.0.0.1', cidr: 8, type: 'ipv4' });
      const classB = calculateSubnet({ address: '172.16.0.1', cidr: 16, type: 'ipv4' });
      const classC = calculateSubnet({ address: '192.168.1.1', cidr: 24, type: 'ipv4' });
      const classD = calculateSubnet({ address: '224.0.0.1', cidr: 24, type: 'ipv4' });
      const classE = calculateSubnet({ address: '240.0.0.1', cidr: 24, type: 'ipv4' });

      if (classA.type !== 'ipv4' || !classA.valid) throw new Error('unexpected');
      if (classB.type !== 'ipv4' || !classB.valid) throw new Error('unexpected');
      if (classC.type !== 'ipv4' || !classC.valid) throw new Error('unexpected');
      if (classD.type !== 'ipv4' || !classD.valid) throw new Error('unexpected');
      if (classE.type !== 'ipv4' || !classE.valid) throw new Error('unexpected');

      expect(classA.ipClass).toBe('A');
      expect(classB.ipClass).toBe('B');
      expect(classC.ipClass).toBe('C');
      expect(classD.ipClass).toBe('D (Multicast)');
      expect(classE.ipClass).toBe('E (Reserved)');
    });

    it('should detect private addresses correctly', () => {
      const private10 = calculateSubnet({ address: '10.0.0.1', cidr: 8, type: 'ipv4' });
      const private172 = calculateSubnet({ address: '172.16.0.1', cidr: 12, type: 'ipv4' });
      const private192 = calculateSubnet({ address: '192.168.1.1', cidr: 24, type: 'ipv4' });
      const loopback = calculateSubnet({ address: '127.0.0.1', cidr: 8, type: 'ipv4' });
      const linkLocal = calculateSubnet({ address: '169.254.1.1', cidr: 16, type: 'ipv4' });
      const publicIp = calculateSubnet({ address: '8.8.8.8', cidr: 32, type: 'ipv4' });

      if (private10.type !== 'ipv4' || !private10.valid) throw new Error('unexpected');
      if (private172.type !== 'ipv4' || !private172.valid) throw new Error('unexpected');
      if (private192.type !== 'ipv4' || !private192.valid) throw new Error('unexpected');
      if (loopback.type !== 'ipv4' || !loopback.valid) throw new Error('unexpected');
      if (linkLocal.type !== 'ipv4' || !linkLocal.valid) throw new Error('unexpected');
      if (publicIp.type !== 'ipv4' || !publicIp.valid) throw new Error('unexpected');

      expect(private10.isPrivate).toBe(true);
      expect(private172.isPrivate).toBe(true);
      expect(private192.isPrivate).toBe(true);
      expect(loopback.isPrivate).toBe(true);
      expect(linkLocal.isPrivate).toBe(true);
      expect(publicIp.isPrivate).toBe(false);
    });
  });

  // ─── IPv6 Calculations ───────────────────────────────────────────────────

  describe('IPv6 calculations', () => {
    it('should calculate /64 subnet correctly', () => {
      const result = calculateSubnet({ address: '2001:db8::1', cidr: 64, type: 'ipv6' });
      expect(result.valid).toBe(true);
      if (result.type !== 'ipv6' || !result.valid) throw new Error('unexpected');
      expect(result.networkAddress).toBe('2001:db8::');
      expect(result.addressRangeStart).toBe('2001:db8::');
      expect(result.totalAddresses).toBe('18446744073709551616');
      expect(result.networkBits).toBe(64);
      expect(result.hostBits).toBe(64);
    });

    it('should calculate /48 subnet correctly', () => {
      const result = calculateSubnet({ address: '2001:db8:abcd::1', cidr: 48, type: 'ipv6' });
      expect(result.valid).toBe(true);
      if (result.type !== 'ipv6' || !result.valid) throw new Error('unexpected');
      expect(result.networkAddress).toBe('2001:db8:abcd::');
      expect(result.networkBits).toBe(48);
      expect(result.hostBits).toBe(80);
    });

    it('should calculate /128 single host correctly', () => {
      const result = calculateSubnet({ address: '::1', cidr: 128, type: 'ipv6' });
      expect(result.valid).toBe(true);
      if (result.type !== 'ipv6' || !result.valid) throw new Error('unexpected');
      expect(result.totalAddresses).toBe('1');
      expect(result.networkBits).toBe(128);
      expect(result.hostBits).toBe(0);
    });

    it('should produce expanded and compressed forms', () => {
      const result = calculateSubnet({ address: '2001:db8::1', cidr: 64, type: 'ipv6' });
      expect(result.valid).toBe(true);
      if (result.type !== 'ipv6' || !result.valid) throw new Error('unexpected');
      expect(result.expandedForm).toBe('2001:0db8:0000:0000:0000:0000:0000:0001');
      expect(result.compressedForm).toBe('2001:db8::1');
    });

    it('should identify address types correctly', () => {
      const loopback = calculateSubnet({ address: '::1', cidr: 128, type: 'ipv6' });
      const globalUnicast = calculateSubnet({ address: '2001:db8::1', cidr: 64, type: 'ipv6' });

      if (loopback.type !== 'ipv6' || !loopback.valid) throw new Error('unexpected');
      if (globalUnicast.type !== 'ipv6' || !globalUnicast.valid) throw new Error('unexpected');

      expect(loopback.addressType).toBe('Loopback (::1)');
      expect(globalUnicast.addressType).toBe('Documentation');
    });

    it('should produce binary address for IPv6', () => {
      const result = calculateSubnet({ address: '2001:db8:1::1', cidr: 128, type: 'ipv6' });
      expect(result.valid).toBe(true);
      if (result.type !== 'ipv6' || !result.valid) throw new Error('unexpected');
      expect(result.binaryAddress).toContain('0010000000000001');
      expect(result.addressType).toBe('Documentation');
    });

    it('should handle full IPv6 address without abbreviation', () => {
      const result = calculateSubnet({
        address: '2001:0db8:0000:0000:0000:0000:0000:0001',
        cidr: 64,
        type: 'ipv6',
      });
      expect(result.valid).toBe(true);
      if (result.type !== 'ipv6' || !result.valid) throw new Error('unexpected');
      expect(result.expandedForm).toBe('2001:0db8:0000:0000:0000:0000:0000:0001');
    });
  });

  // ─── Error Cases ─────────────────────────────────────────────────────────

  describe('error cases', () => {
    it('should return error for invalid IPv4 address', () => {
      const result = calculateSubnet({ address: '999.999.999.999', cidr: 24, type: 'ipv4' });
      expect(result.valid).toBe(false);
      expect('error' in result && result.error).toContain('Invalid IPv4');
    });

    it('should return error for non-numeric IPv4 octets', () => {
      const result = calculateSubnet({ address: 'abc.def.ghi.jkl', cidr: 24, type: 'ipv4' });
      expect(result.valid).toBe(false);
    });

    it('should return error for out-of-range CIDR for IPv4', () => {
      const result = calculateSubnet({ address: '192.168.1.1', cidr: 33, type: 'ipv4' });
      expect(result.valid).toBe(false);
      expect('error' in result && result.error).toContain('CIDR');
    });

    it('should return error for negative CIDR for IPv4', () => {
      const result = calculateSubnet({ address: '192.168.1.1', cidr: -1, type: 'ipv4' });
      expect(result.valid).toBe(false);
    });

    it('should return error for invalid IPv6 address', () => {
      const result = calculateSubnet({ address: 'gggg::1', cidr: 64, type: 'ipv6' });
      expect(result.valid).toBe(false);
      expect('error' in result && result.error).toContain('Invalid IPv6');
    });

    it('should return error for out-of-range CIDR for IPv6', () => {
      const result = calculateSubnet({ address: '::1', cidr: 129, type: 'ipv6' });
      expect(result.valid).toBe(false);
      expect('error' in result && result.error).toContain('CIDR');
    });

    it('should return error for non-integer CIDR', () => {
      const result = calculateSubnet({ address: '192.168.1.1', cidr: 24.5, type: 'ipv4' });
      expect(result.valid).toBe(false);
    });

    it('should return error for IPv4 with too few octets', () => {
      const result = calculateSubnet({ address: '192.168.1', cidr: 24, type: 'ipv4' });
      expect(result.valid).toBe(false);
    });

    it('should return error for IPv4 with leading zeros', () => {
      const result = calculateSubnet({ address: '192.168.01.1', cidr: 24, type: 'ipv4' });
      expect(result.valid).toBe(false);
    });
  });

  // ─── JSON String Interface (subnetCalculator) ────────────────────────────

  describe('subnetCalculator JSON string interface', () => {
    it('should accept JSON string input for IPv4', async () => {
      const input = JSON.stringify({ address: '192.168.1.0', cidr: 24, type: 'ipv4' });
      const resultStr = await subnetCalculator(input);
      const result = JSON.parse(resultStr);
      expect(result.valid).toBe(true);
      expect(result.networkAddress).toBe('192.168.1.0');
    });

    it('should accept JSON string input for IPv6', async () => {
      const input = JSON.stringify({ address: '2001:db8::1', cidr: 64, type: 'ipv6' });
      const resultStr = await subnetCalculator(input);
      const result = JSON.parse(resultStr);
      expect(result.valid).toBe(true);
      expect(result.networkAddress).toBe('2001:db8::');
    });

    it('should handle invalid JSON input', async () => {
      const resultStr = await subnetCalculator('not valid json');
      const result = JSON.parse(resultStr);
      expect(result.error).toBeDefined();
    });

    it('should handle empty JSON input', async () => {
      const resultStr = await subnetCalculator('{}');
      const result = JSON.parse(resultStr);
      // Should return an error or invalid result since address is missing
      expect(result.valid === false || result.error).toBeTruthy();
    });
  });
});
