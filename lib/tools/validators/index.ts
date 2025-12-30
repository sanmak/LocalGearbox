/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Validators - JSON, XML validation tools
 * Pure functions for validation logic
 */

import { validateInput, isValidXML, JSON_SIZE_LIMIT, XML_SIZE_LIMIT } from '../shared';

/**
 * Validates JSON and returns validation result
 */
export const validateJSON = async (input: string): Promise<string> => {
  validateInput(input, JSON_SIZE_LIMIT);

  try {
    JSON.parse(input);
    return JSON.stringify(
      {
        valid: true,
        message: 'Valid JSON',
      },
      null,
      2,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return JSON.stringify(
        {
          valid: false,
          error: error.message,
          position: error.message.match(/position (\d+)/)
            ? parseInt(error.message.match(/position (\d+)/)![1])
            : null,
        },
        null,
        2,
      );
    }
    throw error;
  }
};

/**
 * Validates XML and returns validation result
 */
export const validateXML = async (input: string): Promise<string> => {
  validateInput(input, XML_SIZE_LIMIT);

  const isValid = isValidXML(input);

  if (isValid) {
    return JSON.stringify(
      {
        valid: true,
        message: 'Valid XML',
      },
      null,
      2,
    );
  } else {
    return JSON.stringify(
      {
        valid: false,
        error: 'Invalid XML format',
      },
      null,
      2,
    );
  }
};
