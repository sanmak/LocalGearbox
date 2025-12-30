/**
 * Shared utilities and validation for diff operations
 */

import { validateNotEmpty, validateSizeLimit } from '../shared';

// Size limit for each input (10MB)
export const DIFF_SIZE_LIMIT = 10 * 1024 * 1024;

/**
 * Validate both left and right inputs
 */
export const validateDiffInputs = (left: string, right: string): void => {
  validateNotEmpty(left, 'Left input');
  validateNotEmpty(right, 'Right input');
  validateSizeLimit(left, DIFF_SIZE_LIMIT);
  validateSizeLimit(right, DIFF_SIZE_LIMIT);
};
