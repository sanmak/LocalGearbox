/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * JMESPath Parser Utility
 * Wrapper around the jmespath library for standardized use
 */

import jmespath from 'jmespath';

/**
 * Executes a JMESPath query against a JSON object
 */
export const parseJMESPath = async (data: any, query: string): Promise<any> => {
  try {
    return jmespath.search(data, query);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`JMESPath search failed: ${error.message}`);
    }
    throw error;
  }
};
