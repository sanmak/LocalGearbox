/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Architecture Diagram Generator Types
 * Type definitions for architecture diagrams, components, and layouts
 */

export type ComponentType =
  | 'server'
  | 'database'
  | 'container'
  | 'vm'
  | 'api'
  | 'queue'
  | 'cache'
  | 'load-balancer'
  | 'firewall'
  | 'gateway'
  | 'cloud-service'
  | 'storage'
  | 'function'
  | 'cdn'
  | 'dns'
  | 'user'
  | 'external-service'
  | 'custom';

export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'generic';

export type ConnectionType =
  | 'http'
  | 'https'
  | 'tcp'
  | 'udp'
  | 'grpc'
  | 'websocket'
  | 'message-queue'
  | 'database'
  | 'sync'
  | 'async'
  | 'custom';

export type LayoutAlgorithm =
  | 'hierarchical'
  | 'force-directed'
  | 'circular'
  | 'grid'
  | 'layered'
  | 'tree';

export type DiagramStyle = 'modern' | 'classic' | 'minimal' | 'detailed';

export interface ArchitectureComponent {
  id: string;
  type: ComponentType;
  label: string;
  description?: string;
  cloudProvider?: CloudProvider;
  cloudService?: string;
  icon?: string;
  metadata?: Record<string, string>;
  position?: { x: number; y: number };
  layer?: number;
  tags?: string[];
}

export interface ArchitectureConnection {
  id: string;
  from: string;
  to: string;
  type: ConnectionType;
  label?: string;
  protocol?: string;
  port?: number | string;
  bidirectional?: boolean;
  latency?: string;
  throughput?: string;
  metadata?: Record<string, string>;
}

export interface ArchitectureDiagramConfig {
  title?: string;
  description?: string;
  components: ArchitectureComponent[];
  connections: ArchitectureConnection[];
  layout?: LayoutAlgorithm;
  style?: DiagramStyle;
  layers?: DiagramLayer[];
  annotations?: Annotation[];
  legend?: boolean;
  theme?: 'light' | 'dark';
}

export interface DiagramLayer {
  id: string;
  name: string;
  description?: string;
  visible?: boolean;
  order?: number;
  color?: string;
}

export interface Annotation {
  id: string;
  text: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  type?: 'note' | 'warning' | 'info' | 'callout';
}

export interface DiagramOutput {
  svg?: string;
  mermaid?: string;
  plantuml?: string;
  json?: string;
  metadata?: DiagramMetadata;
}

export interface DiagramMetadata {
  componentCount: number;
  connectionCount: number;
  layers: string[];
  complexity: 'low' | 'medium' | 'high';
  validationErrors?: string[];
  validationWarnings?: string[];
}

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  component: ArchitectureComponent;
}

export interface LayoutEdge {
  id: string;
  from: string;
  to: string;
  points: { x: number; y: number }[];
  connection: ArchitectureConnection;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}
