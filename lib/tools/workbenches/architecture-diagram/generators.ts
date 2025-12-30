/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Architecture Diagram Generators
 * Generate diagrams in various formats (SVG, Mermaid, PlantUML)
 */

import {
  LayoutResult,
  LayoutNode,
  LayoutEdge,
  DiagramStyle,
  ArchitectureDiagramConfig,
} from './types';
import { getComponentIcon, getConnectionArrowStyle } from './icons';

/**
 * Generate SVG diagram from layout result
 */
export function generateSVG(layout: LayoutResult, config: ArchitectureDiagramConfig): string {
  const { nodes, edges, width, height } = layout;
  const style = config.style || 'modern';
  const theme = config.theme || 'light';

  const svgHeader = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    ${generateArrowMarkers()}
    ${generateFilters()}
  </defs>
  ${generateBackground(width, height, theme)}
  ${generateTitle(config.title, width)}
  ${generateEdges(edges, theme)}
  ${generateNodes(nodes, style, theme)}
  ${config.legend ? generateLegend(width, height, theme) : ''}
</svg>`;

  return svgHeader;
}

/**
 * Generate arrow markers for connections
 */
function generateArrowMarkers(): string {
  return `
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
    </marker>
    <marker id="arrowhead-reverse" markerWidth="10" markerHeight="10" refX="1" refY="3" orient="auto">
      <polygon points="10 0, 0 3, 10 6" fill="currentColor" />
    </marker>
  `;
}

/**
 * Generate SVG filters for shadows and effects
 */
function generateFilters(): string {
  return `
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.2"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  `;
}

/**
 * Generate background
 */
function generateBackground(width: number, height: number, theme: string): string {
  const bgColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
  return `<rect width="${width}" height="${height}" fill="${bgColor}"/>`;
}

/**
 * Generate title
 */
function generateTitle(title: string | undefined, width: number): string {
  if (!title) return '';

  return `
    <text x="${width / 2}" y="30" text-anchor="middle" font-size="24" font-weight="bold" fill="currentColor">
      ${escapeXML(title)}
    </text>
  `;
}

/**
 * Generate nodes (components)
 */
function generateNodes(nodes: LayoutNode[], style: DiagramStyle, theme: string): string {
  return nodes
    .map((node) => {
      const icon = getComponentIcon(
        node.component.type,
        node.component.cloudProvider,
        node.component.cloudService,
      );

      const textColor = theme === 'dark' ? '#ffffff' : '#333333';
      const borderColor = icon.color || '#4A90E2';

      const styleAttrs =
        style === 'modern'
          ? `filter="url(#shadow)" rx="8"`
          : style === 'detailed'
            ? `rx="4"`
            : `rx="2"`;

      return `
        <g id="node-${node.id}" transform="translate(${node.x}, ${node.y})">
          <!-- Background -->
          <rect
            width="${node.width}"
            height="${node.height}"
            fill="${theme === 'dark' ? '#2a2a2a' : '#f8f9fa'}"
            stroke="${borderColor}"
            stroke-width="2"
            ${styleAttrs}
          />

          <!-- Icon -->
          <g transform="translate(${node.width / 2 - 12}, 15)">
            <svg width="24" height="24" viewBox="${icon.viewBox}" fill="${borderColor}">
              ${icon.svg}
            </svg>
          </g>

          <!-- Label -->
          <text
            x="${node.width / 2}"
            y="${node.height - 15}"
            text-anchor="middle"
            font-size="12"
            font-weight="600"
            fill="${textColor}"
          >
            ${escapeXML(node.component.label)}
          </text>

          ${
            node.component.description
              ? `
          <title>${escapeXML(node.component.description)}</title>
          `
              : ''
          }
        </g>
      `;
    })
    .join('\n');
}

/**
 * Generate edges (connections)
 */
function generateEdges(edges: LayoutEdge[], theme: string): string {
  return `
    <g id="edges">
      ${edges
        .map((edge) => {
          const arrowStyle = getConnectionArrowStyle(edge.connection.type);
          const color = theme === 'dark' ? arrowStyle.stroke : arrowStyle.stroke;

          const pathData = generatePathData(edge.points);

          const markerEnd = edge.connection.bidirectional ? '' : 'marker-end="url(#arrowhead)"';
          const markerStart = edge.connection.bidirectional
            ? 'marker-start="url(#arrowhead-reverse)"'
            : '';

          return `
            <g id="edge-${edge.id}">
              <path
                d="${pathData}"
                stroke="${color}"
                stroke-width="${arrowStyle.strokeWidth}"
                stroke-dasharray="${arrowStyle.dashArray || 'none'}"
                fill="none"
                ${markerEnd}
                ${markerStart}
              />
              ${edge.connection.label ? generateEdgeLabel(edge, color, theme) : ''}
              ${
                edge.connection.protocol || edge.connection.port
                  ? `
              <title>${[edge.connection.protocol, edge.connection.port].filter(Boolean).join(':')}</title>
              `
                  : ''
              }
            </g>
          `;
        })
        .join('\n')}
    </g>
  `;
}

/**
 * Generate path data for edge
 */
function generatePathData(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';

  const start = points[0];
  let path = `M ${start.x} ${start.y}`;

  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }

  return path;
}

/**
 * Generate edge label
 */
function generateEdgeLabel(edge: LayoutEdge, color: string, theme: string): string {
  if (!edge.connection.label || edge.points.length < 2) return '';

  const midIndex = Math.floor(edge.points.length / 2);
  const midPoint = edge.points[midIndex];

  const bgColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
  const textColor = theme === 'dark' ? '#ffffff' : '#333333';

  return `
    <g transform="translate(${midPoint.x}, ${midPoint.y})">
      <rect
        x="-30"
        y="-10"
        width="60"
        height="20"
        fill="${bgColor}"
        stroke="${color}"
        stroke-width="1"
        rx="4"
      />
      <text
        text-anchor="middle"
        y="5"
        font-size="10"
        fill="${textColor}"
      >
        ${escapeXML(edge.connection.label)}
      </text>
    </g>
  `;
}

/**
 * Generate legend
 */
function generateLegend(width: number, height: number, theme: string): string {
  const legendX = width - 200;
  const legendY = height - 150;
  const bgColor = theme === 'dark' ? '#2a2a2a' : '#f8f9fa';
  const textColor = theme === 'dark' ? '#ffffff' : '#333333';

  return `
    <g id="legend" transform="translate(${legendX}, ${legendY})">
      <rect width="180" height="130" fill="${bgColor}" stroke="#ccc" stroke-width="1" rx="4"/>
      <text x="10" y="20" font-size="12" font-weight="bold" fill="${textColor}">Legend</text>

      <line x1="10" y1="35" x2="40" y2="35" stroke="#4CAF50" stroke-width="2"/>
      <text x="45" y="38" font-size="10" fill="${textColor}">HTTP/HTTPS</text>

      <line x1="10" y1="50" x2="40" y2="50" stroke="#2196F3" stroke-width="2"/>
      <text x="45" y="53" font-size="10" fill="${textColor}">TCP/UDP</text>

      <line x1="10" y1="65" x2="40" y2="65" stroke="#FF9800" stroke-width="2" stroke-dasharray="8,4"/>
      <text x="45" y="68" font-size="10" fill="${textColor}">Message Queue</text>

      <line x1="10" y1="80" x2="40" y2="80" stroke="#E91E63" stroke-width="2"/>
      <text x="45" y="83" font-size="10" fill="${textColor}">Database</text>

      <line x1="10" y1="95" x2="40" y2="95" stroke="#9C27B0" stroke-width="2" stroke-dasharray="5,5"/>
      <text x="45" y="98" font-size="10" fill="${textColor}">Async</text>
    </g>
  `;
}

/**
 * Generate Mermaid diagram
 */
export function generateMermaid(config: ArchitectureDiagramConfig): string {
  const lines: string[] = [];

  lines.push('graph TD');

  if (config.title) {
    lines.push(`  %% ${config.title}`);
  }

  config.components.forEach((comp) => {
    const shape = getMermaidShape(comp.type);
    const label = comp.label;
    lines.push(`  ${sanitizeMermaidId(comp.id)}${shape[0]}${label}${shape[1]}`);
  });

  lines.push('');

  config.connections.forEach((conn) => {
    const fromId = sanitizeMermaidId(conn.from);
    const toId = sanitizeMermaidId(conn.to);
    const arrow = getMermaidArrow(conn.type, conn.bidirectional);
    const label = conn.label ? `|${conn.label}|` : '';

    lines.push(`  ${fromId} ${arrow[0]}${label}${arrow[1]} ${toId}`);
  });

  return lines.join('\n');
}

/**
 * Get Mermaid shape for component type
 */
function getMermaidShape(type: string): [string, string] {
  const shapes: Record<string, [string, string]> = {
    user: ['([', '])'],
    database: ['[(', ')]'],
    queue: ['{{', '}}'],
    cache: ['([', '])'],
    'cloud-service': ['(((', ')))'],
    default: ['[', ']'],
  };

  return shapes[type] || shapes.default;
}

/**
 * Get Mermaid arrow style
 */
function getMermaidArrow(type: string, bidirectional?: boolean): [string, string] {
  if (bidirectional) {
    return ['<--', '-->'];
  }

  const arrows: Record<string, [string, string]> = {
    https: ['==', '==>'],
    http: ['--', '-->'],
    async: ['-.', '.->'],
    'message-queue': ['==', '==>'],
    default: ['--', '-->'],
  };

  return arrows[type] || arrows.default;
}

/**
 * Generate PlantUML diagram
 */
export function generatePlantUML(config: ArchitectureDiagramConfig): string {
  const lines: string[] = [];

  lines.push('@startuml');

  if (config.title) {
    lines.push(`title ${config.title}`);
  }

  lines.push('');
  lines.push('!define RECTANGLE class');
  lines.push('');

  config.components.forEach((comp) => {
    const stereotype = getPlantUMLStereotype(comp.type);
    lines.push(`${stereotype} "${comp.label}" as ${sanitizePlantUMLId(comp.id)}`);
  });

  lines.push('');

  config.connections.forEach((conn) => {
    const fromId = sanitizePlantUMLId(conn.from);
    const toId = sanitizePlantUMLId(conn.to);
    const arrow = getPlantUMLArrow(conn.type, conn.bidirectional);
    const label = conn.label ? `: ${conn.label}` : '';

    lines.push(`${fromId} ${arrow} ${toId}${label}`);
  });

  lines.push('@enduml');

  return lines.join('\n');
}

/**
 * Get PlantUML stereotype
 */
function getPlantUMLStereotype(type: string): string {
  const stereotypes: Record<string, string> = {
    user: 'actor',
    database: 'database',
    queue: 'queue',
    cloud: 'cloud',
    component: 'component',
    default: 'rectangle',
  };

  return stereotypes[type] || stereotypes.default;
}

/**
 * Get PlantUML arrow
 */
function getPlantUMLArrow(type: string, bidirectional?: boolean): string {
  if (bidirectional) {
    return '<-->';
  }

  const arrows: Record<string, string> = {
    https: '==>',
    http: '-->',
    async: '..>',
    database: '-->',
    default: '-->',
  };

  return arrows[type] || arrows.default;
}

/**
 * Utility: Escape XML special characters
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Utility: Sanitize ID for Mermaid
 */
function sanitizeMermaidId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Utility: Sanitize ID for PlantUML
 */
function sanitizePlantUMLId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}
