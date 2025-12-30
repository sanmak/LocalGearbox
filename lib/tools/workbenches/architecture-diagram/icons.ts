/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Architecture Diagram Icons
 * SVG icon library for common cloud services and components
 */

import { CloudProvider, ComponentType } from './types';

export interface IconDefinition {
  name: string;
  svg: string;
  viewBox: string;
  color?: string;
}

/**
 * Get icon for a component type
 */
export function getComponentIcon(
  type: ComponentType,
  cloudProvider?: CloudProvider,
  cloudService?: string,
): IconDefinition {
  if (cloudProvider && cloudService) {
    const cloudIcon = getCloudServiceIcon(cloudProvider, cloudService);
    if (cloudIcon) return cloudIcon;
  }

  return getGenericIcon(type);
}

/**
 * Generic component icons
 */
function getGenericIcon(type: ComponentType): IconDefinition {
  const icons: Record<ComponentType, IconDefinition> = {
    server: {
      name: 'server',
      viewBox: '0 0 24 24',
      svg: `<rect x="2" y="4" width="20" height="6" rx="2" fill="currentColor" opacity="0.2"/>
            <rect x="2" y="4" width="20" height="6" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
            <rect x="2" y="14" width="20" height="6" rx="2" fill="currentColor" opacity="0.2"/>
            <rect x="2" y="14" width="20" height="6" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
            <circle cx="6" cy="7" r="1" fill="currentColor"/>
            <circle cx="6" cy="17" r="1" fill="currentColor"/>`,
      color: '#4A90E2',
    },
    database: {
      name: 'database',
      viewBox: '0 0 24 24',
      svg: `<ellipse cx="12" cy="5" rx="9" ry="3" fill="currentColor" opacity="0.2"/>
            <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" stroke="currentColor" stroke-width="2" fill="none"/>`,
      color: '#E94B3C',
    },
    container: {
      name: 'container',
      viewBox: '0 0 24 24',
      svg: `<rect x="3" y="4" width="18" height="16" rx="2" fill="currentColor" opacity="0.2"/>
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
            <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="2"/>
            <rect x="6" y="12" width="4" height="4" rx="1" fill="currentColor"/>
            <rect x="14" y="12" width="4" height="4" rx="1" fill="currentColor"/>`,
      color: '#0DB7ED',
    },
    vm: {
      name: 'vm',
      viewBox: '0 0 24 24',
      svg: `<rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" opacity="0.2"/>
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
            <line x1="2" y1="9" x2="22" y2="9" stroke="currentColor" stroke-width="2"/>
            <circle cx="6" cy="6.5" r="0.8" fill="currentColor"/>
            <circle cx="9" cy="6.5" r="0.8" fill="currentColor"/>
            <rect x="6" y="12" width="12" height="2" rx="1" fill="currentColor"/>
            <rect x="6" y="16" width="8" height="2" rx="1" fill="currentColor"/>`,
      color: '#5E35B1',
    },
    api: {
      name: 'api',
      viewBox: '0 0 24 24',
      svg: `<path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.2"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" fill="none"/>`,
      color: '#4CAF50',
    },
    queue: {
      name: 'queue',
      viewBox: '0 0 24 24',
      svg: `<rect x="2" y="6" width="5" height="4" rx="1" fill="currentColor" opacity="0.3"/>
            <rect x="9" y="6" width="5" height="4" rx="1" fill="currentColor" opacity="0.5"/>
            <rect x="16" y="6" width="5" height="4" rx="1" fill="currentColor"/>
            <rect x="2" y="14" width="5" height="4" rx="1" fill="currentColor" opacity="0.3"/>
            <rect x="9" y="14" width="5" height="4" rx="1" fill="currentColor" opacity="0.5"/>
            <rect x="16" y="14" width="5" height="4" rx="1" fill="currentColor"/>`,
      color: '#FF9800',
    },
    cache: {
      name: 'cache',
      viewBox: '0 0 24 24',
      svg: `<circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.2"/>
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M12 6v6l4 4" stroke="currentColor" stroke-width="2" fill="none"/>`,
      color: '#E91E63',
    },
    'load-balancer': {
      name: 'load-balancer',
      viewBox: '0 0 24 24',
      svg: `<circle cx="12" cy="4" r="2" fill="currentColor"/>
            <circle cx="6" cy="20" r="2" fill="currentColor" opacity="0.5"/>
            <circle cx="12" cy="20" r="2" fill="currentColor" opacity="0.5"/>
            <circle cx="18" cy="20" r="2" fill="currentColor" opacity="0.5"/>
            <line x1="12" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
            <line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" stroke-width="2"/>
            <line x1="12" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>`,
      color: '#3F51B5',
    },
    firewall: {
      name: 'firewall',
      viewBox: '0 0 24 24',
      svg: `<path d="M12 2L4 6v6c0 5.25 3.6 10.15 8 11.5 4.4-1.35 8-6.25 8-11.5V6l-8-4z" fill="currentColor" opacity="0.2"/>
            <path d="M12 2L4 6v6c0 5.25 3.6 10.15 8 11.5 4.4-1.35 8-6.25 8-11.5V6l-8-4z" stroke="currentColor" stroke-width="2" fill="none"/>
            <line x1="9" y1="10" x2="15" y2="16" stroke="currentColor" stroke-width="2"/>`,
      color: '#F44336',
    },
    gateway: {
      name: 'gateway',
      viewBox: '0 0 24 24',
      svg: `<rect x="4" y="8" width="16" height="8" rx="2" fill="currentColor" opacity="0.2"/>
            <rect x="4" y="8" width="16" height="8" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
            <line x1="2" y1="12" x2="4" y2="12" stroke="currentColor" stroke-width="2"/>
            <line x1="20" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2"/>
            <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="12" r="1.5" fill="currentColor"/>`,
      color: '#00BCD4',
    },
    'cloud-service': {
      name: 'cloud-service',
      viewBox: '0 0 24 24',
      svg: `<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="currentColor" opacity="0.2"/>
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="currentColor" stroke-width="2" fill="none"/>`,
      color: '#2196F3',
    },
    storage: {
      name: 'storage',
      viewBox: '0 0 24 24',
      svg: `<rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" opacity="0.2"/>
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
            <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2"/>
            <rect x="6" y="7" width="12" height="2" rx="1" fill="currentColor"/>
            <rect x="6" y="15" width="8" height="2" rx="1" fill="currentColor"/>`,
      color: '#9C27B0',
    },
    function: {
      name: 'function',
      viewBox: '0 0 24 24',
      svg: `<path d="M8 2h3v2h2V2h3v2a4 4 0 0 1-4 4 4 4 0 0 1 4 4v2h-3v-2h-2v2H8v-2a4 4 0 0 1 4-4 4 4 0 0 1-4-4V2z" fill="currentColor" opacity="0.2"/>
            <path d="M8 2h3v2h2V2h3v2a4 4 0 0 1-4 4 4 4 0 0 1 4 4v2h-3v-2h-2v2H8v-2a4 4 0 0 1 4-4 4 4 0 0 1-4-4V2z" stroke="currentColor" stroke-width="2" fill="none"/>`,
      color: '#FF5722',
    },
    cdn: {
      name: 'cdn',
      viewBox: '0 0 24 24',
      svg: `<circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
            <circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2" fill="none"/>
            <circle cx="12" cy="12" r="2" fill="currentColor"/>`,
      color: '#FFC107',
    },
    dns: {
      name: 'dns',
      viewBox: '0 0 24 24',
      svg: `<circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
            <text x="12" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="currentColor">DNS</text>`,
      color: '#795548',
    },
    user: {
      name: 'user',
      viewBox: '0 0 24 24',
      svg: `<circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.3"/>
            <path d="M6 21v-2a6 6 0 0 1 12 0v2" fill="currentColor" opacity="0.3"/>
            <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M6 21v-2a6 6 0 0 1 12 0v2" stroke="currentColor" stroke-width="2" fill="none"/>`,
      color: '#607D8B',
    },
    'external-service': {
      name: 'external-service',
      viewBox: '0 0 24 24',
      svg: `<rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" opacity="0.2"/>
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4" fill="none"/>
            <circle cx="12" cy="12" r="3" fill="currentColor"/>`,
      color: '#9E9E9E',
    },
    custom: {
      name: 'custom',
      viewBox: '0 0 24 24',
      svg: `<rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" opacity="0.2"/>
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>`,
      color: '#607D8B',
    },
  };

  return icons[type] || icons.custom;
}

/**
 * Cloud service specific icons
 */
function getCloudServiceIcon(provider: CloudProvider, service: string): IconDefinition | null {
  const awsIcons: Record<string, IconDefinition> = {
    ec2: {
      name: 'AWS EC2',
      viewBox: '0 0 24 24',
      svg: `<rect x="3" y="3" width="18" height="18" rx="2" fill="#FF9900" opacity="0.2"/>
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="#FF9900" stroke-width="2" fill="none"/>
            <text x="12" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="#FF9900">EC2</text>`,
      color: '#FF9900',
    },
    s3: {
      name: 'AWS S3',
      viewBox: '0 0 24 24',
      svg: `<path d="M12 2L2 7l10 5 10-5-10-5z" fill="#569A31" opacity="0.3"/>
            <path d="M2 12l10 5 10-5M2 17l10 5 10-5" stroke="#569A31" stroke-width="2" fill="none"/>
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#569A31" stroke-width="2" fill="none"/>`,
      color: '#569A31',
    },
    rds: {
      name: 'AWS RDS',
      viewBox: '0 0 24 24',
      svg: `<ellipse cx="12" cy="5" rx="9" ry="3" fill="#527FFF" opacity="0.3"/>
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" stroke="#527FFF" stroke-width="2" fill="none"/>
            <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" stroke="#527FFF" stroke-width="2" fill="none"/>`,
      color: '#527FFF',
    },
    lambda: {
      name: 'AWS Lambda',
      viewBox: '0 0 24 24',
      svg: `<path d="M12 2L2 22h20L12 2z" fill="#FF9900" opacity="0.2"/>
            <path d="M12 2L2 22h20L12 2z" stroke="#FF9900" stroke-width="2" fill="none"/>
            <text x="12" y="18" text-anchor="middle" font-size="10" font-weight="bold" fill="#FF9900">λ</text>`,
      color: '#FF9900',
    },
    'api-gateway': {
      name: 'AWS API Gateway',
      viewBox: '0 0 24 24',
      svg: `<rect x="4" y="8" width="16" height="8" rx="2" fill="#FF4F8B" opacity="0.2"/>
            <rect x="4" y="8" width="16" height="8" rx="2" stroke="#FF4F8B" stroke-width="2" fill="none"/>
            <line x1="2" y1="12" x2="4" y2="12" stroke="#FF4F8B" stroke-width="2"/>
            <line x1="20" y1="12" x2="22" y2="12" stroke="#FF4F8B" stroke-width="2"/>`,
      color: '#FF4F8B',
    },
  };

  const gcpIcons: Record<string, IconDefinition> = {
    'compute-engine': {
      name: 'GCP Compute Engine',
      viewBox: '0 0 24 24',
      svg: `<rect x="3" y="4" width="18" height="16" rx="2" fill="#4285F4" opacity="0.2"/>
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="#4285F4" stroke-width="2" fill="none"/>
            <text x="12" y="15" text-anchor="middle" font-size="9" font-weight="bold" fill="#4285F4">GCE</text>`,
      color: '#4285F4',
    },
    'cloud-storage': {
      name: 'GCP Cloud Storage',
      viewBox: '0 0 24 24',
      svg: `<path d="M12 2L2 7l10 5 10-5-10-5z" fill="#EA4335" opacity="0.3"/>
            <path d="M2 12l10 5 10-5M2 17l10 5 10-5" stroke="#EA4335" stroke-width="2" fill="none"/>
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#EA4335" stroke-width="2" fill="none"/>`,
      color: '#EA4335',
    },
    'cloud-sql': {
      name: 'GCP Cloud SQL',
      viewBox: '0 0 24 24',
      svg: `<ellipse cx="12" cy="5" rx="9" ry="3" fill="#4285F4" opacity="0.3"/>
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" stroke="#4285F4" stroke-width="2" fill="none"/>`,
      color: '#4285F4',
    },
    'cloud-functions': {
      name: 'GCP Cloud Functions',
      viewBox: '0 0 24 24',
      svg: `<path d="M12 2L2 22h20L12 2z" fill="#FBBC04" opacity="0.2"/>
            <path d="M12 2L2 22h20L12 2z" stroke="#FBBC04" stroke-width="2" fill="none"/>
            <text x="12" y="18" text-anchor="middle" font-size="10" font-weight="bold" fill="#FBBC04">ƒ</text>`,
      color: '#FBBC04',
    },
  };

  const azureIcons: Record<string, IconDefinition> = {
    'virtual-machines': {
      name: 'Azure VMs',
      viewBox: '0 0 24 24',
      svg: `<rect x="2" y="4" width="20" height="16" rx="2" fill="#0078D4" opacity="0.2"/>
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="#0078D4" stroke-width="2" fill="none"/>
            <text x="12" y="15" text-anchor="middle" font-size="9" font-weight="bold" fill="#0078D4">VM</text>`,
      color: '#0078D4',
    },
    'blob-storage': {
      name: 'Azure Blob Storage',
      viewBox: '0 0 24 24',
      svg: `<rect x="2" y="4" width="20" height="16" rx="2" fill="#0078D4" opacity="0.2"/>
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="#0078D4" stroke-width="2" fill="none"/>
            <circle cx="8" cy="10" r="2" fill="#0078D4"/>
            <circle cx="16" cy="10" r="2" fill="#0078D4"/>
            <circle cx="12" cy="14" r="2" fill="#0078D4"/>`,
      color: '#0078D4',
    },
    'sql-database': {
      name: 'Azure SQL',
      viewBox: '0 0 24 24',
      svg: `<ellipse cx="12" cy="5" rx="9" ry="3" fill="#0078D4" opacity="0.3"/>
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" stroke="#0078D4" stroke-width="2" fill="none"/>`,
      color: '#0078D4',
    },
    functions: {
      name: 'Azure Functions',
      viewBox: '0 0 24 24',
      svg: `<path d="M12 2L2 22h20L12 2z" fill="#0078D4" opacity="0.2"/>
            <path d="M12 2L2 22h20L12 2z" stroke="#0078D4" stroke-width="2" fill="none"/>
            <text x="12" y="18" text-anchor="middle" font-size="10" font-weight="bold" fill="#0078D4">ƒₐ</text>`,
      color: '#0078D4',
    },
  };

  const providerIcons: Record<string, Record<string, IconDefinition>> = {
    aws: awsIcons,
    gcp: gcpIcons,
    azure: azureIcons,
    generic: {},
  };

  const icons = providerIcons[provider];
  if (!icons) return null;

  return icons[service.toLowerCase()] || null;
}

/**
 * Get connection arrow style
 */
export function getConnectionArrowStyle(type: string): {
  stroke: string;
  dashArray?: string;
  strokeWidth: number;
} {
  const styles: Record<string, { stroke: string; dashArray?: string; strokeWidth: number }> = {
    http: { stroke: '#4CAF50', strokeWidth: 2 },
    https: { stroke: '#4CAF50', strokeWidth: 3 },
    tcp: { stroke: '#2196F3', strokeWidth: 2 },
    udp: { stroke: '#03A9F4', strokeWidth: 2, dashArray: '5,5' },
    grpc: { stroke: '#00BCD4', strokeWidth: 2 },
    websocket: { stroke: '#009688', strokeWidth: 2, dashArray: '10,5' },
    'message-queue': { stroke: '#FF9800', strokeWidth: 2, dashArray: '8,4' },
    database: { stroke: '#E91E63', strokeWidth: 2 },
    sync: { stroke: '#3F51B5', strokeWidth: 3 },
    async: { stroke: '#9C27B0', strokeWidth: 2, dashArray: '5,5' },
    custom: { stroke: '#607D8B', strokeWidth: 2 },
  };

  return styles[type] || styles.custom;
}
