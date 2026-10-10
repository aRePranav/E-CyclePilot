// ============================================================================
// E-CyclePilot: AI-Powered E-Waste Recovery & Circularity Decision Engine
// Stage C: Data Sanitization Gate (NIST SP 800-88 Rev. 2 Assessment)
// ============================================================================

import { DeviceAssessmentRequest, REASON_CODES } from './types.js';

export interface SanitizationEvaluation {
  dataSanitizationRequired: boolean;
  sanitizationReasonCodes: string[];
  sanitizationActionChecklist: string[];
}

/**
 * Assesses non-volatile media presence and sanitization status.
 *
 * IMPORTANT BOUNDARY: The application assesses whether sanitization is required.
 * It does not perform disk wiping, validate a sanitization operation, or issue
 * a sanitization certificate.
 */
export function evaluateSanitization(req: DeviceAssessmentRequest): SanitizationEvaluation {
  const sanitizationReasonCodes: string[] = [];
  const sanitizationActionChecklist: string[] = [];

  const mediaType = req.storage?.mediaType;
  const sanitizationState = req.storage?.sanitizationState;

  // If no storage exists or media is already verified wiped, sanitization is not required
  if (
    mediaType === 'NO_STORAGE' ||
    sanitizationState === 'VERIFIED_WIPED' ||
    sanitizationState === 'DAMAGED_PHYSICALLY'
  ) {
    return {
      dataSanitizationRequired: false,
      sanitizationReasonCodes,
      sanitizationActionChecklist,
    };
  }

  // If unencrypted sensitive data is detected on active non-volatile storage
  if (sanitizationState === 'UNENCRYPTED_DATA_PRESENT') {
    sanitizationReasonCodes.push(REASON_CODES.DATA_SANITIZATION_REQUIRED);
    sanitizationActionChecklist.push(
      'Perform certified storage wipe (NIST SP 800-88 Rev. 2) before handover',
    );

    return {
      dataSanitizationRequired: true,
      sanitizationReasonCodes,
      sanitizationActionChecklist,
    };
  }

  // Encrypted locked drive on secondary deployment
  if (sanitizationState === 'ENCRYPTED_LOCKED') {
    sanitizationActionChecklist.push(
      'Verify encryption keys are purged or re-initialize volume per NIST SP 800-88 Rev. 2 Clear guidelines prior to reuse.',
    );
  }

  return {
    dataSanitizationRequired: false,
    sanitizationReasonCodes,
    sanitizationActionChecklist,
  };
}
