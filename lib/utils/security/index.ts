/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

export {
  isCorsError,
  categorizeNetworkError,
  generateCorsEducation,
  type EducationContent as CorsEducationContent,
} from './detect-cors-error';

export {
  detectFramingBlock,
  createIframeErrorHandler,
  createIframeLoadHandler,
  generateFramingEducation,
  type FramingError,
  type FramingErrorType,
  type EducationContent as FramingEducationContent,
} from './detect-framing-error';
