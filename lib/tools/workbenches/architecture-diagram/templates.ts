/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Architecture Diagram Templates
 * Pre-built templates for common architecture patterns
 */

import { ArchitectureDiagramConfig } from './types';

export const TEMPLATES: Record<string, ArchitectureDiagramConfig> = {
  microservices: {
    title: 'Microservices Architecture',
    description: 'Modern microservices architecture with API gateway and service mesh',
    layout: 'hierarchical',
    style: 'modern',
    legend: true,
    components: [
      {
        id: 'user',
        type: 'user',
        label: 'Client',
        layer: 0,
      },
      {
        id: 'cdn',
        type: 'cdn',
        label: 'CDN',
        layer: 1,
      },
      {
        id: 'api-gateway',
        type: 'gateway',
        label: 'API Gateway',
        layer: 2,
      },
      {
        id: 'auth-service',
        type: 'api',
        label: 'Auth Service',
        layer: 3,
      },
      {
        id: 'user-service',
        type: 'api',
        label: 'User Service',
        layer: 3,
      },
      {
        id: 'order-service',
        type: 'api',
        label: 'Order Service',
        layer: 3,
      },
      {
        id: 'payment-service',
        type: 'api',
        label: 'Payment Service',
        layer: 3,
      },
      {
        id: 'message-queue',
        type: 'queue',
        label: 'Message Queue',
        layer: 4,
      },
      {
        id: 'cache',
        type: 'cache',
        label: 'Redis Cache',
        layer: 4,
      },
      {
        id: 'user-db',
        type: 'database',
        label: 'User DB',
        layer: 5,
      },
      {
        id: 'order-db',
        type: 'database',
        label: 'Order DB',
        layer: 5,
      },
    ],
    connections: [
      { id: 'c1', from: 'user', to: 'cdn', type: 'https', label: 'HTTPS' },
      { id: 'c2', from: 'cdn', to: 'api-gateway', type: 'https' },
      { id: 'c3', from: 'api-gateway', to: 'auth-service', type: 'grpc' },
      { id: 'c4', from: 'api-gateway', to: 'user-service', type: 'grpc' },
      { id: 'c5', from: 'api-gateway', to: 'order-service', type: 'grpc' },
      { id: 'c6', from: 'order-service', to: 'payment-service', type: 'grpc' },
      { id: 'c7', from: 'user-service', to: 'cache', type: 'tcp' },
      { id: 'c8', from: 'order-service', to: 'message-queue', type: 'message-queue' },
      { id: 'c9', from: 'user-service', to: 'user-db', type: 'database' },
      { id: 'c10', from: 'order-service', to: 'order-db', type: 'database' },
    ],
  },

  serverless: {
    title: 'Serverless Architecture',
    description: 'Event-driven serverless architecture with cloud functions',
    layout: 'hierarchical',
    style: 'modern',
    legend: true,
    components: [
      {
        id: 'user',
        type: 'user',
        label: 'Client',
        layer: 0,
      },
      {
        id: 'cdn',
        type: 'cdn',
        label: 'CloudFront',
        cloudProvider: 'aws',
        cloudService: 'cloudfront',
        layer: 1,
      },
      {
        id: 'api-gateway',
        type: 'gateway',
        label: 'API Gateway',
        cloudProvider: 'aws',
        cloudService: 'api-gateway',
        layer: 2,
      },
      {
        id: 'auth-fn',
        type: 'function',
        label: 'Auth Function',
        cloudProvider: 'aws',
        cloudService: 'lambda',
        layer: 3,
      },
      {
        id: 'user-fn',
        type: 'function',
        label: 'User Function',
        cloudProvider: 'aws',
        cloudService: 'lambda',
        layer: 3,
      },
      {
        id: 'order-fn',
        type: 'function',
        label: 'Order Function',
        cloudProvider: 'aws',
        cloudService: 'lambda',
        layer: 3,
      },
      {
        id: 's3',
        type: 'storage',
        label: 'S3 Storage',
        cloudProvider: 'aws',
        cloudService: 's3',
        layer: 4,
      },
      {
        id: 'dynamodb',
        type: 'database',
        label: 'DynamoDB',
        cloudProvider: 'aws',
        cloudService: 'dynamodb',
        layer: 4,
      },
    ],
    connections: [
      { id: 'c1', from: 'user', to: 'cdn', type: 'https' },
      { id: 'c2', from: 'cdn', to: 'api-gateway', type: 'https' },
      { id: 'c3', from: 'api-gateway', to: 'auth-fn', type: 'async' },
      { id: 'c4', from: 'api-gateway', to: 'user-fn', type: 'async' },
      { id: 'c5', from: 'api-gateway', to: 'order-fn', type: 'async' },
      { id: 'c6', from: 'user-fn', to: 'dynamodb', type: 'database' },
      { id: 'c7', from: 'order-fn', to: 'dynamodb', type: 'database' },
      { id: 'c8', from: 'order-fn', to: 's3', type: 'https' },
    ],
  },

  monolith: {
    title: 'Monolithic Architecture',
    description: 'Traditional three-tier monolithic application',
    layout: 'hierarchical',
    style: 'classic',
    legend: true,
    components: [
      {
        id: 'user',
        type: 'user',
        label: 'Users',
        layer: 0,
      },
      {
        id: 'lb',
        type: 'load-balancer',
        label: 'Load Balancer',
        layer: 1,
      },
      {
        id: 'web-1',
        type: 'server',
        label: 'Web Server 1',
        layer: 2,
      },
      {
        id: 'web-2',
        type: 'server',
        label: 'Web Server 2',
        layer: 2,
      },
      {
        id: 'app-server',
        type: 'server',
        label: 'Application Server',
        layer: 3,
      },
      {
        id: 'cache',
        type: 'cache',
        label: 'Cache',
        layer: 4,
      },
      {
        id: 'database',
        type: 'database',
        label: 'PostgreSQL',
        layer: 4,
      },
    ],
    connections: [
      { id: 'c1', from: 'user', to: 'lb', type: 'https' },
      { id: 'c2', from: 'lb', to: 'web-1', type: 'http' },
      { id: 'c3', from: 'lb', to: 'web-2', type: 'http' },
      { id: 'c4', from: 'web-1', to: 'app-server', type: 'tcp' },
      { id: 'c5', from: 'web-2', to: 'app-server', type: 'tcp' },
      { id: 'c6', from: 'app-server', to: 'cache', type: 'tcp' },
      { id: 'c7', from: 'app-server', to: 'database', type: 'database' },
    ],
  },

  'event-driven': {
    title: 'Event-Driven Architecture',
    description: 'Event-driven architecture with message brokers and event processing',
    layout: 'layered',
    style: 'modern',
    legend: true,
    components: [
      {
        id: 'frontend',
        type: 'user',
        label: 'Frontend App',
        layer: 0,
      },
      {
        id: 'api',
        type: 'api',
        label: 'REST API',
        layer: 1,
      },
      {
        id: 'event-bus',
        type: 'queue',
        label: 'Event Bus',
        layer: 2,
      },
      {
        id: 'order-processor',
        type: 'api',
        label: 'Order Processor',
        layer: 3,
      },
      {
        id: 'payment-processor',
        type: 'api',
        label: 'Payment Processor',
        layer: 3,
      },
      {
        id: 'notification-processor',
        type: 'api',
        label: 'Notification Service',
        layer: 3,
      },
      {
        id: 'analytics-processor',
        type: 'api',
        label: 'Analytics Service',
        layer: 3,
      },
      {
        id: 'order-db',
        type: 'database',
        label: 'Order DB',
        layer: 4,
      },
      {
        id: 'analytics-db',
        type: 'database',
        label: 'Analytics DB',
        layer: 4,
      },
    ],
    connections: [
      { id: 'c1', from: 'frontend', to: 'api', type: 'https' },
      { id: 'c2', from: 'api', to: 'event-bus', type: 'message-queue', label: 'Publish Events' },
      {
        id: 'c3',
        from: 'event-bus',
        to: 'order-processor',
        type: 'message-queue',
        label: 'OrderCreated',
      },
      {
        id: 'c4',
        from: 'event-bus',
        to: 'payment-processor',
        type: 'message-queue',
        label: 'PaymentRequired',
      },
      {
        id: 'c5',
        from: 'event-bus',
        to: 'notification-processor',
        type: 'message-queue',
        label: 'SendNotification',
      },
      {
        id: 'c6',
        from: 'event-bus',
        to: 'analytics-processor',
        type: 'message-queue',
        label: 'TrackEvent',
      },
      { id: 'c7', from: 'order-processor', to: 'order-db', type: 'database' },
      { id: 'c8', from: 'analytics-processor', to: 'analytics-db', type: 'database' },
    ],
  },

  'hybrid-cloud': {
    title: 'Hybrid Cloud Architecture',
    description: 'Hybrid cloud setup spanning on-premise and cloud infrastructure',
    layout: 'layered',
    style: 'detailed',
    legend: true,
    components: [
      {
        id: 'users',
        type: 'user',
        label: 'External Users',
        layer: 0,
      },
      {
        id: 'cloud-lb',
        type: 'load-balancer',
        label: 'Cloud LB',
        cloudProvider: 'aws',
        layer: 1,
        tags: ['cloud'],
      },
      {
        id: 'cloud-app',
        type: 'container',
        label: 'Cloud App',
        cloudProvider: 'aws',
        cloudService: 'ec2',
        layer: 2,
        tags: ['cloud'],
      },
      {
        id: 'vpn-gateway',
        type: 'gateway',
        label: 'VPN Gateway',
        layer: 3,
        tags: ['hybrid'],
      },
      {
        id: 'firewall',
        type: 'firewall',
        label: 'Firewall',
        layer: 4,
        tags: ['on-premise'],
      },
      {
        id: 'on-prem-app',
        type: 'server',
        label: 'On-Premise App',
        layer: 5,
        tags: ['on-premise'],
      },
      {
        id: 'on-prem-db',
        type: 'database',
        label: 'On-Premise DB',
        layer: 6,
        tags: ['on-premise'],
      },
      {
        id: 'cloud-db',
        type: 'database',
        label: 'Cloud DB',
        cloudProvider: 'aws',
        cloudService: 'rds',
        layer: 2,
        tags: ['cloud'],
      },
    ],
    connections: [
      { id: 'c1', from: 'users', to: 'cloud-lb', type: 'https' },
      { id: 'c2', from: 'cloud-lb', to: 'cloud-app', type: 'http' },
      { id: 'c3', from: 'cloud-app', to: 'cloud-db', type: 'database' },
      { id: 'c4', from: 'cloud-app', to: 'vpn-gateway', type: 'tcp', label: 'VPN Tunnel' },
      { id: 'c5', from: 'vpn-gateway', to: 'firewall', type: 'tcp' },
      { id: 'c6', from: 'firewall', to: 'on-prem-app', type: 'http' },
      { id: 'c7', from: 'on-prem-app', to: 'on-prem-db', type: 'database' },
      {
        id: 'c8',
        from: 'on-prem-app',
        to: 'vpn-gateway',
        type: 'sync',
        label: 'Data Sync',
        bidirectional: true,
      },
    ],
  },

  'container-orchestration': {
    title: 'Container Orchestration (Kubernetes)',
    description: 'Kubernetes-based container orchestration architecture',
    layout: 'layered',
    style: 'modern',
    legend: true,
    components: [
      {
        id: 'user',
        type: 'user',
        label: 'Users',
        layer: 0,
      },
      {
        id: 'ingress',
        type: 'gateway',
        label: 'Ingress Controller',
        layer: 1,
      },
      {
        id: 'frontend-svc',
        type: 'load-balancer',
        label: 'Frontend Service',
        layer: 2,
      },
      {
        id: 'frontend-pod-1',
        type: 'container',
        label: 'Frontend Pod 1',
        layer: 3,
      },
      {
        id: 'frontend-pod-2',
        type: 'container',
        label: 'Frontend Pod 2',
        layer: 3,
      },
      {
        id: 'api-svc',
        type: 'load-balancer',
        label: 'API Service',
        layer: 4,
      },
      {
        id: 'api-pod-1',
        type: 'container',
        label: 'API Pod 1',
        layer: 5,
      },
      {
        id: 'api-pod-2',
        type: 'container',
        label: 'API Pod 2',
        layer: 5,
      },
      {
        id: 'redis',
        type: 'cache',
        label: 'Redis',
        layer: 6,
      },
      {
        id: 'postgres',
        type: 'database',
        label: 'PostgreSQL',
        layer: 6,
      },
    ],
    connections: [
      { id: 'c1', from: 'user', to: 'ingress', type: 'https' },
      { id: 'c2', from: 'ingress', to: 'frontend-svc', type: 'http' },
      { id: 'c3', from: 'frontend-svc', to: 'frontend-pod-1', type: 'http' },
      { id: 'c4', from: 'frontend-svc', to: 'frontend-pod-2', type: 'http' },
      { id: 'c5', from: 'frontend-pod-1', to: 'api-svc', type: 'http' },
      { id: 'c6', from: 'frontend-pod-2', to: 'api-svc', type: 'http' },
      { id: 'c7', from: 'api-svc', to: 'api-pod-1', type: 'http' },
      { id: 'c8', from: 'api-svc', to: 'api-pod-2', type: 'http' },
      { id: 'c9', from: 'api-pod-1', to: 'redis', type: 'tcp' },
      { id: 'c10', from: 'api-pod-2', to: 'redis', type: 'tcp' },
      { id: 'c11', from: 'api-pod-1', to: 'postgres', type: 'database' },
      { id: 'c12', from: 'api-pod-2', to: 'postgres', type: 'database' },
    ],
  },

  simple: {
    title: 'Simple Web Application',
    description: 'Basic three-tier web application architecture',
    layout: 'hierarchical',
    style: 'minimal',
    legend: false,
    components: [
      {
        id: 'user',
        type: 'user',
        label: 'User',
        layer: 0,
      },
      {
        id: 'frontend',
        type: 'server',
        label: 'Web Frontend',
        layer: 1,
      },
      {
        id: 'backend',
        type: 'api',
        label: 'Backend API',
        layer: 2,
      },
      {
        id: 'database',
        type: 'database',
        label: 'Database',
        layer: 3,
      },
    ],
    connections: [
      { id: 'c1', from: 'user', to: 'frontend', type: 'https' },
      { id: 'c2', from: 'frontend', to: 'backend', type: 'http' },
      { id: 'c3', from: 'backend', to: 'database', type: 'database' },
    ],
  },
};

/**
 * Get list of available templates
 */
export function getTemplateList(): Array<{
  id: string;
  title: string;
  description: string;
}> {
  return Object.entries(TEMPLATES).map(([id, template]) => ({
    id,
    title: template.title || id,
    description: template.description || '',
  }));
}

/**
 * Get a specific template by ID
 */
export function getTemplate(id: string): ArchitectureDiagramConfig | null {
  return TEMPLATES[id] || null;
}
