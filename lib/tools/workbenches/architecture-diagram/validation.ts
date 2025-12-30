/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Architecture Diagram Validation
 * Validates diagram configurations and detects issues
 */

import {
  ArchitectureDiagramConfig,
  ArchitectureComponent,
  ArchitectureConnection,
  DiagramMetadata,
} from './types';

/**
 * Validate diagram configuration
 */
export function validateDiagram(config: ArchitectureDiagramConfig): DiagramMetadata {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.components || config.components.length === 0) {
    errors.push('Diagram must have at least one component');
  }

  if (config.components) {
    validateComponents(config.components, errors, warnings);
  }

  if (config.connections) {
    validateConnections(config.connections, config.components || [], errors, warnings);
  }

  const complexity = calculateComplexity(config);

  return {
    componentCount: config.components?.length || 0,
    connectionCount: config.connections?.length || 0,
    layers: extractLayers(config),
    complexity,
    validationErrors: errors.length > 0 ? errors : undefined,
    validationWarnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate components
 */
function validateComponents(
  components: ArchitectureComponent[],
  errors: string[],
  warnings: string[],
): void {
  const ids = new Set<string>();

  components.forEach((comp, index) => {
    if (!comp.id) {
      errors.push(`Component at index ${index} is missing an ID`);
      return;
    }

    if (ids.has(comp.id)) {
      errors.push(`Duplicate component ID: ${comp.id}`);
    }
    ids.add(comp.id);

    if (!comp.type) {
      errors.push(`Component ${comp.id} is missing a type`);
    }

    if (!comp.label || comp.label.trim() === '') {
      warnings.push(`Component ${comp.id} is missing a label`);
    }

    if (comp.cloudProvider && !comp.cloudService) {
      warnings.push(`Component ${comp.id} has a cloud provider but no cloud service specified`);
    }
  });
}

/**
 * Validate connections
 */
function validateConnections(
  connections: ArchitectureConnection[],
  components: ArchitectureComponent[],
  errors: string[],
  warnings: string[],
): void {
  const componentIds = new Set(components.map((c) => c.id));
  const connectionIds = new Set<string>();

  connections.forEach((conn, index) => {
    if (!conn.id) {
      errors.push(`Connection at index ${index} is missing an ID`);
      return;
    }

    if (connectionIds.has(conn.id)) {
      errors.push(`Duplicate connection ID: ${conn.id}`);
    }
    connectionIds.add(conn.id);

    if (!conn.from) {
      errors.push(`Connection ${conn.id} is missing 'from' field`);
    } else if (!componentIds.has(conn.from)) {
      errors.push(`Connection ${conn.id} references non-existent component: ${conn.from}`);
    }

    if (!conn.to) {
      errors.push(`Connection ${conn.id} is missing 'to' field`);
    } else if (!componentIds.has(conn.to)) {
      errors.push(`Connection ${conn.id} references non-existent component: ${conn.to}`);
    }

    if (conn.from === conn.to) {
      warnings.push(`Connection ${conn.id} connects a component to itself`);
    }

    if (!conn.type) {
      warnings.push(`Connection ${conn.id} is missing a type`);
    }
  });

  detectDisconnectedComponents(components, connections, warnings);
  detectCycles(components, connections, warnings);
}

/**
 * Detect disconnected components
 */
function detectDisconnectedComponents(
  components: ArchitectureComponent[],
  connections: ArchitectureConnection[],
  warnings: string[],
): void {
  const connectedIds = new Set<string>();

  connections.forEach((conn) => {
    connectedIds.add(conn.from);
    connectedIds.add(conn.to);
  });

  components.forEach((comp) => {
    if (!connectedIds.has(comp.id)) {
      warnings.push(`Component ${comp.id} (${comp.label}) is not connected to any other component`);
    }
  });
}

/**
 * Detect cycles in the diagram
 */
function detectCycles(
  components: ArchitectureComponent[],
  connections: ArchitectureConnection[],
  warnings: string[],
): void {
  const graph = new Map<string, string[]>();

  components.forEach((comp) => {
    graph.set(comp.id, []);
  });

  connections.forEach((conn) => {
    if (!conn.bidirectional) {
      const neighbors = graph.get(conn.from) || [];
      neighbors.push(conn.to);
      graph.set(conn.from, neighbors);
    }
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  for (const comp of components) {
    if (!visited.has(comp.id)) {
      if (hasCycle(comp.id)) {
        warnings.push(
          'Diagram contains cycles (circular dependencies) which may indicate an issue',
        );
        break;
      }
    }
  }
}

/**
 * Calculate diagram complexity
 */
function calculateComplexity(config: ArchitectureDiagramConfig): 'low' | 'medium' | 'high' {
  const componentCount = config.components?.length || 0;
  const connectionCount = config.connections?.length || 0;

  const totalNodes = componentCount + connectionCount;

  if (totalNodes < 10) return 'low';
  if (totalNodes < 30) return 'medium';
  return 'high';
}

/**
 * Extract unique layers from config
 */
function extractLayers(config: ArchitectureDiagramConfig): string[] {
  const layers = new Set<string>();

  if (config.layers) {
    config.layers.forEach((layer) => layers.add(layer.name));
  }

  if (config.components) {
    config.components.forEach((comp) => {
      if (comp.layer !== undefined) {
        layers.add(`Layer ${comp.layer}`);
      }
      if (comp.tags) {
        comp.tags.forEach((tag) => layers.add(tag));
      }
    });
  }

  return Array.from(layers);
}

/**
 * Generate diagram summary for documentation
 */
export function generateDiagramSummary(config: ArchitectureDiagramConfig): string {
  const lines: string[] = [];

  if (config.title) {
    lines.push(`# ${config.title}`);
    lines.push('');
  }

  if (config.description) {
    lines.push(config.description);
    lines.push('');
  }

  lines.push('## Components');
  lines.push('');

  const componentsByType = new Map<string, ArchitectureComponent[]>();
  config.components.forEach((comp) => {
    const type = comp.type;
    if (!componentsByType.has(type)) {
      componentsByType.set(type, []);
    }
    componentsByType.get(type)!.push(comp);
  });

  componentsByType.forEach((comps, type) => {
    lines.push(`### ${type} (${comps.length})`);
    comps.forEach((comp) => {
      let line = `- **${comp.label}** (${comp.id})`;
      if (comp.description) {
        line += `: ${comp.description}`;
      }
      if (comp.cloudProvider && comp.cloudService) {
        line += ` [${comp.cloudProvider.toUpperCase()} ${comp.cloudService}]`;
      }
      lines.push(line);
    });
    lines.push('');
  });

  lines.push('## Connections');
  lines.push('');

  const connectionsByType = new Map<string, ArchitectureConnection[]>();
  config.connections.forEach((conn) => {
    const type = conn.type;
    if (!connectionsByType.has(type)) {
      connectionsByType.set(type, []);
    }
    connectionsByType.get(type)!.push(conn);
  });

  connectionsByType.forEach((conns, type) => {
    lines.push(`### ${type} (${conns.length})`);
    conns.forEach((conn) => {
      const componentMap = new Map(config.components.map((c) => [c.id, c]));
      const fromLabel = componentMap.get(conn.from)?.label || conn.from;
      const toLabel = componentMap.get(conn.to)?.label || conn.to;

      const arrow = conn.bidirectional ? '↔' : '→';
      let line = `- ${fromLabel} ${arrow} ${toLabel}`;

      if (conn.label) {
        line += ` (${conn.label})`;
      }

      if (conn.protocol || conn.port) {
        const details = [conn.protocol, conn.port].filter(Boolean).join(':');
        line += ` [${details}]`;
      }

      lines.push(line);
    });
    lines.push('');
  });

  return lines.join('\n');
}
