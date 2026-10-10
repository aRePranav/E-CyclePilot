// ============================================================================
// E-CyclePilot: AI Assessment Explanation Input Validator
// ============================================================================

import { CIRCULARITY_PATHWAYS, type CircularityPathway } from '../engine/types.js';
import type { ExplainAssessmentRequest } from './types.js';

export interface ValidationResult {
  valid: boolean;
  data?: ExplainAssessmentRequest;
  error?: {
    statusCode: number;
    error: string;
    message: string;
  };
}

const VALID_HAZARD_LEVELS = new Set(['NONE', 'WARNING', 'CRITICAL']);

export function validateExplainRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      valid: false,
      error: {
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'Request body must be a non-null JSON object.',
      },
    };
  }

  const raw = body as Record<string, unknown>;

  // 1. primaryPathway
  if (
    typeof raw.primaryPathway !== 'string' ||
    !CIRCULARITY_PATHWAYS.includes(raw.primaryPathway as CircularityPathway)
  ) {
    return {
      valid: false,
      error: {
        statusCode: 400,
        error: 'INVALID_PATHWAY',
        message: `primaryPathway must be one of the six frozen pathways: ${CIRCULARITY_PATHWAYS.join(', ')}.`,
      },
    };
  }

  // 2. primaryRationale
  if (typeof raw.primaryRationale !== 'string' || raw.primaryRationale.trim().length === 0) {
    return {
      valid: false,
      error: {
        statusCode: 400,
        error: 'INVALID_RATIONALE',
        message: 'primaryRationale must be a non-empty string.',
      },
    };
  }
  if (raw.primaryRationale.length > 2000) {
    return {
      valid: false,
      error: {
        statusCode: 400,
        error: 'RATIONALE_TOO_LONG',
        message: 'primaryRationale exceeds maximum permitted length of 2000 characters.',
      },
    };
  }

  // 3. safetyAlert
  if (!raw.safetyAlert || typeof raw.safetyAlert !== 'object' || Array.isArray(raw.safetyAlert)) {
    return {
      valid: false,
      error: {
        statusCode: 400,
        error: 'INVALID_SAFETY_ALERT',
        message: 'safetyAlert must be an object containing active and hazardLevel.',
      },
    };
  }
  const sa = raw.safetyAlert as Record<string, unknown>;
  if (typeof sa.active !== 'boolean') {
    return {
      valid: false,
      error: {
        statusCode: 400,
        error: 'INVALID_SAFETY_ALERT',
        message: 'safetyAlert.active must be a boolean.',
      },
    };
  }
  if (typeof sa.hazardLevel !== 'string' || !VALID_HAZARD_LEVELS.has(sa.hazardLevel)) {
    return {
      valid: false,
      error: {
        statusCode: 400,
        error: 'INVALID_SAFETY_ALERT',
        message: 'safetyAlert.hazardLevel must be NONE, WARNING, or CRITICAL.',
      },
    };
  }

  // 4. complianceFlags
  if (
    !raw.complianceFlags ||
    typeof raw.complianceFlags !== 'object' ||
    Array.isArray(raw.complianceFlags)
  ) {
    return {
      valid: false,
      error: {
        statusCode: 400,
        error: 'INVALID_COMPLIANCE_FLAGS',
        message: 'complianceFlags must be an object containing dataSanitizationRequired.',
      },
    };
  }
  const cf = raw.complianceFlags as Record<string, unknown>;
  if (typeof cf.dataSanitizationRequired !== 'boolean') {
    return {
      valid: false,
      error: {
        statusCode: 400,
        error: 'INVALID_COMPLIANCE_FLAGS',
        message: 'complianceFlags.dataSanitizationRequired must be a boolean.',
      },
    };
  }

  // 5. actionChecklist (optional array of strings)
  let actionChecklist: string[] | undefined;
  if (raw.actionChecklist !== undefined) {
    if (!Array.isArray(raw.actionChecklist)) {
      return {
        valid: false,
        error: {
          statusCode: 400,
          error: 'INVALID_ACTION_CHECKLIST',
          message: 'actionChecklist must be an array of strings if provided.',
        },
      };
    }
    if (raw.actionChecklist.length > 50) {
      return {
        valid: false,
        error: {
          statusCode: 400,
          error: 'ACTION_CHECKLIST_TOO_LARGE',
          message: 'actionChecklist cannot exceed 50 items.',
        },
      };
    }
    actionChecklist = raw.actionChecklist.map((item) => String(item).slice(0, 500));
  }

  // 6. reasonCodes (optional array of strings)
  let reasonCodes: string[] | undefined;
  if (raw.reasonCodes !== undefined) {
    if (!Array.isArray(raw.reasonCodes)) {
      return {
        valid: false,
        error: {
          statusCode: 400,
          error: 'INVALID_REASON_CODES',
          message: 'reasonCodes must be an array of strings if provided.',
        },
      };
    }
    if (raw.reasonCodes.length > 50) {
      return {
        valid: false,
        error: {
          statusCode: 400,
          error: 'REASON_CODES_TOO_LARGE',
          message: 'reasonCodes cannot exceed 50 items.',
        },
      };
    }
    reasonCodes = raw.reasonCodes.map((rc) => String(rc).slice(0, 100));
  }

  const validatedData: ExplainAssessmentRequest = {
    primaryPathway: raw.primaryPathway as CircularityPathway,
    primaryRationale: raw.primaryRationale.trim(),
    safetyAlert: {
      active: sa.active,
      hazardLevel: sa.hazardLevel as 'NONE' | 'WARNING' | 'CRITICAL',
      hazardsIdentified: Array.isArray(sa.hazardsIdentified)
        ? sa.hazardsIdentified.map((h) => String(h).slice(0, 300))
        : [],
      mandatoryContainmentInstructions: Array.isArray(sa.mandatoryContainmentInstructions)
        ? sa.mandatoryContainmentInstructions.map((i) => String(i).slice(0, 300))
        : [],
    },
    complianceFlags: {
      dataSanitizationRequired: cf.dataSanitizationRequired,
      hazardousTransportRestricted: Boolean(cf.hazardousTransportRestricted),
    },
    actionChecklist,
    reasonCodes,
    assessmentId: typeof raw.assessmentId === 'string' ? raw.assessmentId.slice(0, 100) : undefined,
    financialSummary:
      raw.financialSummary && typeof raw.financialSummary === 'object'
        ? (raw.financialSummary as ExplainAssessmentRequest['financialSummary'])
        : undefined,
  };

  return {
    valid: true,
    data: validatedData,
  };
}
