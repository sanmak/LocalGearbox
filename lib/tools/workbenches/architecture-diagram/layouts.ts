/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Architecture Diagram Layout Algorithms
 * Implements various layout strategies for positioning components
 */

import {
  ArchitectureComponent,
  ArchitectureConnection,
  LayoutAlgorithm,
  LayoutNode,
  LayoutEdge,
  LayoutResult,
} from './types';

const NODE_WIDTH = 120;
const NODE_HEIGHT = 80;
const HORIZONTAL_SPACING = 150;
const VERTICAL_SPACING = 120;
const PADDING = 50;

/**
 * Main layout function that routes to specific algorithms
 */
export function layoutDiagram(
  components: ArchitectureComponent[],
  connections: ArchitectureConnection[],
  algorithm: LayoutAlgorithm = 'hierarchical',
): LayoutResult {
  switch (algorithm) {
    case 'hierarchical':
      return hierarchicalLayout(components, connections);
    case 'force-directed':
      return forceDirectedLayout(components, connections);
    case 'circular':
      return circularLayout(components, connections);
    case 'grid':
      return gridLayout(components, connections);
    case 'layered':
      return layeredLayout(components, connections);
    case 'tree':
      return treeLayout(components, connections);
    default:
      return hierarchicalLayout(components, connections);
  }
}

/**
 * Hierarchical layout - organizes components in layers based on dependencies
 */
function hierarchicalLayout(
  components: ArchitectureComponent[],
  connections: ArchitectureConnection[],
): LayoutResult {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  // Build dependency graph
  const graph = buildDependencyGraph(components, connections);

  // Assign layers using topological sort
  const layers = assignLayers(graph, components);

  // Position nodes in each layer
  let maxWidth = 0;
  layers.forEach((layerNodes, layerIndex) => {
    const layerWidth = layerNodes.length * (NODE_WIDTH + HORIZONTAL_SPACING);
    maxWidth = Math.max(maxWidth, layerWidth);

    const startX = PADDING;
    const y = PADDING + layerIndex * (NODE_HEIGHT + VERTICAL_SPACING);

    layerNodes.forEach((component, index) => {
      const x = startX + index * (NODE_WIDTH + HORIZONTAL_SPACING);
      nodes.push({
        id: component.id,
        x,
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        component,
      });
    });
  });

  // Create edges with routing
  connections.forEach((connection) => {
    const fromNode = nodes.find((n) => n.id === connection.from);
    const toNode = nodes.find((n) => n.id === connection.to);

    if (fromNode && toNode) {
      edges.push({
        id: connection.id,
        from: connection.from,
        to: connection.to,
        points: calculateEdgePoints(fromNode, toNode),
        connection,
      });
    }
  });

  return {
    nodes,
    edges,
    width: maxWidth + 2 * PADDING,
    height: layers.length * (NODE_HEIGHT + VERTICAL_SPACING) + 2 * PADDING,
  };
}

/**
 * Force-directed layout - uses physics simulation for organic positioning
 */
function forceDirectedLayout(
  components: ArchitectureComponent[],
  connections: ArchitectureConnection[],
): LayoutResult {
  const nodes: LayoutNode[] = components.map((comp) => ({
    id: comp.id,
    x: Math.random() * 800 + PADDING,
    y: Math.random() * 600 + PADDING,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    component: comp,
  }));

  // Simple force-directed algorithm (simplified version)
  const iterations = 100;
  const k = Math.sqrt((1000 * 800) / components.length); // Optimal distance
  const temperature = 100;

  for (let iter = 0; iter < iterations; iter++) {
    const forces: { x: number; y: number }[] = nodes.map(() => ({ x: 0, y: 0 }));

    // Repulsive forces between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (k * k) / distance;

        forces[i].x -= (force * dx) / distance;
        forces[i].y -= (force * dy) / distance;
        forces[j].x += (force * dx) / distance;
        forces[j].y += (force * dy) / distance;
      }
    }

    // Attractive forces for connected nodes
    connections.forEach((connection) => {
      const fromIndex = nodes.findIndex((n) => n.id === connection.from);
      const toIndex = nodes.findIndex((n) => n.id === connection.to);

      if (fromIndex !== -1 && toIndex !== -1) {
        const dx = nodes[toIndex].x - nodes[fromIndex].x;
        const dy = nodes[toIndex].y - nodes[fromIndex].y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (distance * distance) / k;

        forces[fromIndex].x += (force * dx) / distance;
        forces[fromIndex].y += (force * dy) / distance;
        forces[toIndex].x -= (force * dx) / distance;
        forces[toIndex].y -= (force * dy) / distance;
      }
    });

    // Apply forces with cooling
    const t = temperature * (1 - iter / iterations);
    nodes.forEach((node, i) => {
      const force = Math.sqrt(forces[i].x ** 2 + forces[i].y ** 2) || 1;
      node.x += (forces[i].x / force) * Math.min(force, t);
      node.y += (forces[i].y / force) * Math.min(force, t);

      // Keep within bounds
      node.x = Math.max(PADDING, Math.min(node.x, 1000 - PADDING - NODE_WIDTH));
      node.y = Math.max(PADDING, Math.min(node.y, 800 - PADDING - NODE_HEIGHT));
    });
  }

  const edges: LayoutEdge[] = connections.map((connection) => {
    const fromNode = nodes.find((n) => n.id === connection.from);
    const toNode = nodes.find((n) => n.id === connection.to);

    return {
      id: connection.id,
      from: connection.from,
      to: connection.to,
      points: fromNode && toNode ? calculateEdgePoints(fromNode, toNode) : [],
      connection,
    };
  });

  return {
    nodes,
    edges,
    width: 1000,
    height: 800,
  };
}

/**
 * Circular layout - arranges components in a circle
 */
function circularLayout(
  components: ArchitectureComponent[],
  connections: ArchitectureConnection[],
): LayoutResult {
  const nodes: LayoutNode[] = [];
  const centerX = 500;
  const centerY = 400;
  const radius = 300;

  components.forEach((component, idx) => {
    const angle = (2 * Math.PI * idx) / components.length;
    const x = centerX + radius * Math.cos(angle) - NODE_WIDTH / 2;
    const y = centerY + radius * Math.sin(angle) - NODE_HEIGHT / 2;

    nodes.push({
      id: component.id,
      x,
      y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      component,
    });
  });

  const edges: LayoutEdge[] = connections.map((connection) => {
    const fromNode = nodes.find((n) => n.id === connection.from);
    const toNode = nodes.find((n) => n.id === connection.to);

    return {
      id: connection.id,
      from: connection.from,
      to: connection.to,
      points: fromNode && toNode ? calculateEdgePoints(fromNode, toNode) : [],
      connection,
    };
  });

  return {
    nodes,
    edges,
    width: 1000,
    height: 800,
  };
}

/**
 * Grid layout - simple grid arrangement
 */
function gridLayout(
  components: ArchitectureComponent[],
  connections: ArchitectureConnection[],
): LayoutResult {
  const nodes: LayoutNode[] = [];
  const cols = Math.ceil(Math.sqrt(components.length));

  components.forEach((component, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    nodes.push({
      id: component.id,
      x: PADDING + col * (NODE_WIDTH + HORIZONTAL_SPACING),
      y: PADDING + row * (NODE_HEIGHT + VERTICAL_SPACING),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      component,
    });
  });

  const edges: LayoutEdge[] = connections.map((connection) => {
    const fromNode = nodes.find((n) => n.id === connection.from);
    const toNode = nodes.find((n) => n.id === connection.to);

    return {
      id: connection.id,
      from: connection.from,
      to: connection.to,
      points: fromNode && toNode ? calculateEdgePoints(fromNode, toNode) : [],
      connection,
    };
  });

  const rows = Math.ceil(components.length / cols);
  return {
    nodes,
    edges,
    width: cols * (NODE_WIDTH + HORIZONTAL_SPACING) + 2 * PADDING,
    height: rows * (NODE_HEIGHT + VERTICAL_SPACING) + 2 * PADDING,
  };
}

/**
 * Layered layout - organizes by explicit layer property
 */
function layeredLayout(
  components: ArchitectureComponent[],
  connections: ArchitectureConnection[],
): LayoutResult {
  const nodes: LayoutNode[] = [];

  // Group by layer
  const layers = new Map<number, ArchitectureComponent[]>();
  components.forEach((component) => {
    const layer = component.layer || 0;
    if (!layers.has(layer)) {
      layers.set(layer, []);
    }
    layers.get(layer)!.push(component);
  });

  // Sort layers
  const sortedLayers = Array.from(layers.entries()).sort((a, b) => a[0] - b[0]);

  let maxWidth = 0;
  sortedLayers.forEach(([, layerComponents], index) => {
    const layerWidth = layerComponents.length * (NODE_WIDTH + HORIZONTAL_SPACING);
    maxWidth = Math.max(maxWidth, layerWidth);

    const startX = PADDING;
    const y = PADDING + index * (NODE_HEIGHT + VERTICAL_SPACING);

    layerComponents.forEach((component, idx) => {
      const x = startX + idx * (NODE_WIDTH + HORIZONTAL_SPACING);
      nodes.push({
        id: component.id,
        x,
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        component,
      });
    });
  });

  const edges: LayoutEdge[] = connections.map((connection) => {
    const fromNode = nodes.find((n) => n.id === connection.from);
    const toNode = nodes.find((n) => n.id === connection.to);

    return {
      id: connection.id,
      from: connection.from,
      to: connection.to,
      points: fromNode && toNode ? calculateEdgePoints(fromNode, toNode) : [],
      connection,
    };
  });

  return {
    nodes,
    edges,
    width: maxWidth + 2 * PADDING,
    height: sortedLayers.length * (NODE_HEIGHT + VERTICAL_SPACING) + 2 * PADDING,
  };
}

/**
 * Tree layout - hierarchical tree structure
 */
function treeLayout(
  components: ArchitectureComponent[],
  connections: ArchitectureConnection[],
): LayoutResult {
  const nodes: LayoutNode[] = [];

  // Find root nodes (nodes with no incoming connections)
  const incomingCounts = new Map<string, number>();
  components.forEach((comp) => incomingCounts.set(comp.id, 0));
  connections.forEach((conn) => {
    incomingCounts.set(conn.to, (incomingCounts.get(conn.to) || 0) + 1);
  });

  const roots = components.filter((comp) => incomingCounts.get(comp.id) === 0);
  if (roots.length === 0 && components.length > 0) {
    roots.push(components[0]); // Fallback to first component
  }

  // Build tree structure using BFS
  const visited = new Set<string>();
  const levels: ArchitectureComponent[][] = [];

  let currentLevel = roots;
  while (currentLevel.length > 0) {
    levels.push(currentLevel);
    currentLevel.forEach((comp) => visited.add(comp.id));

    const nextLevel: ArchitectureComponent[] = [];
    currentLevel.forEach((comp) => {
      const children = connections
        .filter((conn) => conn.from === comp.id && !visited.has(conn.to))
        .map((conn) => components.find((c) => c.id === conn.to))
        .filter((c): c is ArchitectureComponent => c !== undefined);

      nextLevel.push(...children);
    });

    currentLevel = nextLevel;
  }

  // Position nodes
  let maxWidth = 0;
  levels.forEach((level, levelIndex) => {
    const levelWidth = level.length * (NODE_WIDTH + HORIZONTAL_SPACING);
    maxWidth = Math.max(maxWidth, levelWidth);

    const startX = PADDING;
    const y = PADDING + levelIndex * (NODE_HEIGHT + VERTICAL_SPACING);

    level.forEach((component, index) => {
      const x = startX + index * (NODE_WIDTH + HORIZONTAL_SPACING);
      nodes.push({
        id: component.id,
        x,
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        component,
      });
    });
  });

  const edges: LayoutEdge[] = connections.map((connection) => {
    const fromNode = nodes.find((n) => n.id === connection.from);
    const toNode = nodes.find((n) => n.id === connection.to);

    return {
      id: connection.id,
      from: connection.from,
      to: connection.to,
      points: fromNode && toNode ? calculateEdgePoints(fromNode, toNode) : [],
      connection,
    };
  });

  return {
    nodes,
    edges,
    width: maxWidth + 2 * PADDING,
    height: levels.length * (NODE_HEIGHT + VERTICAL_SPACING) + 2 * PADDING,
  };
}

/**
 * Build dependency graph for layout algorithms
 */
function buildDependencyGraph(
  components: ArchitectureComponent[],
  connections: ArchitectureConnection[],
): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  components.forEach((comp) => {
    graph.set(comp.id, new Set());
  });

  connections.forEach((conn) => {
    const deps = graph.get(conn.to);
    if (deps) {
      deps.add(conn.from);
    }
  });

  return graph;
}

/**
 * Assign components to layers using topological sort
 */
function assignLayers(
  graph: Map<string, Set<string>>,
  components: ArchitectureComponent[],
): ArchitectureComponent[][] {
  const layers: ArchitectureComponent[][] = [];
  const assigned = new Set<string>();

  while (assigned.size < components.length) {
    const layer: ArchitectureComponent[] = [];

    components.forEach((comp) => {
      if (assigned.has(comp.id)) return;

      const dependencies = graph.get(comp.id) || new Set();
      const allDepsAssigned = Array.from(dependencies).every((dep) => assigned.has(dep));

      if (allDepsAssigned) {
        layer.push(comp);
      }
    });

    if (layer.length === 0 && assigned.size < components.length) {
      // Handle cycles by adding remaining nodes
      const remaining = components.filter((c) => !assigned.has(c.id));
      layer.push(...remaining);
    }

    layer.forEach((comp) => assigned.add(comp.id));
    if (layer.length > 0) {
      layers.push(layer);
    }
  }

  return layers;
}

/**
 * Calculate edge routing points
 */
function calculateEdgePoints(fromNode: LayoutNode, toNode: LayoutNode): { x: number; y: number }[] {
  const fromCenterX = fromNode.x + fromNode.width / 2;
  const fromCenterY = fromNode.y + fromNode.height / 2;
  const toCenterX = toNode.x + toNode.width / 2;
  const toCenterY = toNode.y + toNode.height / 2;

  // Simple straight line for now
  // Could be enhanced with Bezier curves or orthogonal routing
  return [
    { x: fromCenterX, y: fromCenterY },
    { x: toCenterX, y: toCenterY },
  ];
}
