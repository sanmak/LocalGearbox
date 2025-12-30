/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Architecture Diagram Generator
 * Main processor for generating architecture diagrams
 */

import { validateInput, JSON_SIZE_LIMIT } from '../../shared';
import { ArchitectureDiagramConfig, DiagramOutput, LayoutAlgorithm } from './types';
import { layoutDiagram } from './layouts';
import { generateSVG, generateMermaid, generatePlantUML } from './generators';
import { validateDiagram, generateDiagramSummary } from './validation';
import { getTemplate, getTemplateList } from './templates';

/**
 * Main processor for architecture diagram generation
 */
export async function processArchitectureDiagram(input: string): Promise<string> {
  validateInput(input, JSON_SIZE_LIMIT);

  try {
    const request = JSON.parse(input);

    if (request.action === 'list-templates') {
      return JSON.stringify({ templates: getTemplateList() }, null, 2);
    }

    if (request.action === 'load-template' && request.templateId) {
      const template = getTemplate(request.templateId);
      if (!template) {
        throw new Error(`Template not found: ${request.templateId}`);
      }
      return JSON.stringify({ config: template }, null, 2);
    }

    if (!request.config) {
      throw new Error("Request must include 'config' field with diagram configuration");
    }

    const config: ArchitectureDiagramConfig = request.config;

    const metadata = validateDiagram(config);

    if (metadata.validationErrors && metadata.validationErrors.length > 0) {
      return JSON.stringify(
        {
          success: false,
          errors: metadata.validationErrors,
          warnings: metadata.validationWarnings,
        },
        null,
        2,
      );
    }

    const layoutAlgorithm: LayoutAlgorithm = config.layout || 'hierarchical';
    const layout = layoutDiagram(config.components, config.connections || [], layoutAlgorithm);

    const output: DiagramOutput = {
      metadata,
    };

    const format = request.format || 'all';

    if (format === 'all' || format === 'svg') {
      output.svg = generateSVG(layout, config);
    }

    if (format === 'all' || format === 'mermaid') {
      output.mermaid = generateMermaid(config);
    }

    if (format === 'all' || format === 'plantuml') {
      output.plantuml = generatePlantUML(config);
    }

    if (format === 'all' || format === 'json') {
      output.json = JSON.stringify(
        {
          config,
          layout,
          metadata,
        },
        null,
        2,
      );
    }

    if (request.generateSummary) {
      const summary = generateDiagramSummary(config);
      return JSON.stringify(
        {
          success: true,
          output,
          summary,
          warnings: metadata.validationWarnings,
        },
        null,
        2,
      );
    }

    return JSON.stringify(
      {
        success: true,
        output,
        warnings: metadata.validationWarnings,
      },
      null,
      2,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `Invalid JSON input: ${error.message}. Please provide valid JSON configuration.`,
      );
    }

    throw new Error(
      `Failed to generate architecture diagram: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}
