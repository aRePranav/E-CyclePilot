// ============================================================================
// E-CyclePilot: AI-Powered E-Waste Recovery & Circularity Decision Engine
// Decision Engine Module Entrypoint (@engine/core)
// ============================================================================

import type { AssessmentResult, DeviceAssessmentResponse, EngineOptions } from './types.js';
import { EngineValidationError } from './types.js';
import { validateAssessmentInput } from './validator.js';
import { runDecisionPipeline } from './pipeline.js';

export * from './types.js';
export * from './validator.js';
export * from './safety.js';
export * from './sanitization.js';
export * from './economics.js';
export * from './pipeline.js';

/**
 * Assesses an electronic device through the six-stage circularity decision pipeline.
 * Deterministic, pure TypeScript evaluation. Never throws on invalid input;
 * returns a typed AssessmentResult union with HTTP-compatible status codes.
 */
export function assessDevice(request: unknown, options?: EngineOptions): AssessmentResult {
  const validation = validateAssessmentInput(request);
  if (!validation.valid) {
    return validation.error;
  }

  const assessment = runDecisionPipeline(validation.data, options);
  return {
    ...assessment,
    success: true,
    statusCode: 200,
  };
}

/**
 * Evaluates an electronic device through the decision pipeline.
 * Throws EngineValidationError on malformed/contradictory input, and returns
 * DeviceAssessmentResponse on success.
 */
export function evaluateDevice(
  request: unknown,
  options?: EngineOptions,
): DeviceAssessmentResponse {
  const validation = validateAssessmentInput(request);
  if (!validation.valid) {
    throw new EngineValidationError(
      validation.error.error,
      validation.error.message,
      validation.error.details,
    );
  }

  return runDecisionPipeline(validation.data, options);
}
