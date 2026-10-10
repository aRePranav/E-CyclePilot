// ============================================================================
// E-CyclePilot: AI-Powered E-Waste Recovery & Circularity Decision Engine
// Stage A: Runtime Input Validation & Telemetry Consistency Checks
// ============================================================================

import { DEVICE_CATEGORIES, DeviceAssessmentRequest, EngineErrorResponse } from './types.js';

export type ValidationResult =
  { valid: true; data: DeviceAssessmentRequest } | { valid: false; error: EngineErrorResponse };

/**
 * Validates untrusted runtime input according to schema boundaries and logical invariants.
 */
export function validateAssessmentInput(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      valid: false,
      error: {
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'Request payload must be a non-null object.',
      },
    };
  }

  const raw = input as Record<string, unknown>;

  // 1. Device Metadata
  if (!raw.device || typeof raw.device !== 'object') {
    return {
      valid: false,
      error: {
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'Missing or malformed required field: device.',
      },
    };
  }

  const rawDevice = raw.device as Record<string, unknown>;

  // Device Category validation
  const category = String(rawDevice.category || '');
  if (!DEVICE_CATEGORIES.includes(category as (typeof DEVICE_CATEGORIES)[number])) {
    return {
      valid: false,
      error: {
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: `Invalid device category: ${category}. Supported categories: ${DEVICE_CATEGORIES.join(', ')}.`,
      },
    };
  }

  // Device Age validation
  if (rawDevice.ageYears !== undefined && rawDevice.ageYears !== null) {
    const age = Number(rawDevice.ageYears);
    if (isNaN(age) || age < 0) {
      return {
        valid: false,
        error: {
          success: false,
          statusCode: 400,
          error: 'BAD_REQUEST',
          message: 'Device age must be a non-negative number.',
        },
      };
    }
  }

  // 2. Functional Telemetry & Contradiction Checks
  if (raw.functionalStatus && typeof raw.functionalStatus === 'object') {
    const fnStatus = raw.functionalStatus as Record<string, unknown>;
    const powerState = String(fnStatus.powerState || '');
    const bootState = String(fnStatus.bootState || '');

    // Contradiction 1: NO_POWER yet OS_BOOTS
    if (powerState === 'NO_POWER' && bootState === 'OS_BOOTS') {
      return {
        valid: false,
        error: {
          success: false,
          statusCode: 400,
          error: 'LOGICAL_CONTRADICTION',
          message: 'Contradictory telemetry: device cannot boot OS while powerState is NO_POWER.',
        },
      };
    }

    // Contradiction 2: NO_POWER yet POST_PASS
    if (powerState === 'NO_POWER' && bootState === 'POST_PASS') {
      return {
        valid: false,
        error: {
          success: false,
          statusCode: 400,
          error: 'LOGICAL_CONTRADICTION',
          message: 'Contradictory telemetry: device cannot pass POST while powerState is NO_POWER.',
        },
      };
    }
  }

  // 3. Battery Telemetry Validation
  if (raw.battery && typeof raw.battery === 'object') {
    const rawBattery = raw.battery as Record<string, unknown>;
    if (rawBattery.healthPercentage !== undefined && rawBattery.healthPercentage !== null) {
      const hp = Number(rawBattery.healthPercentage);
      if (isNaN(hp) || hp < 0 || hp > 100) {
        return {
          valid: false,
          error: {
            success: false,
            statusCode: 400,
            error: 'BAD_REQUEST',
            message: 'Battery health percentage must be a number between 0 and 100.',
          },
        };
      }
    }
  }

  // 4. Financial Data Validation
  if (raw.economics && typeof raw.economics === 'object') {
    const rawEcon = raw.economics as Record<string, unknown>;
    if (rawEcon.estimatedMarketValue !== undefined && rawEcon.estimatedMarketValue !== null) {
      const emv = Number(rawEcon.estimatedMarketValue);
      if (isNaN(emv) || emv < 0) {
        return {
          valid: false,
          error: {
            success: false,
            statusCode: 400,
            error: 'BAD_REQUEST',
            message: 'Estimated market value cannot be negative.',
          },
        };
      }
    }

    if (rawEcon.estimatedRepairCost !== undefined && rawEcon.estimatedRepairCost !== null) {
      const erc = Number(rawEcon.estimatedRepairCost);
      if (isNaN(erc) || erc < 0) {
        return {
          valid: false,
          error: {
            success: false,
            statusCode: 400,
            error: 'BAD_REQUEST',
            message: 'Estimated repair cost cannot be negative.',
          },
        };
      }
    }
  }

  // 5. Modular Components Validation
  if (raw.modularComponents !== undefined && raw.modularComponents !== null) {
    if (!Array.isArray(raw.modularComponents)) {
      return {
        valid: false,
        error: {
          success: false,
          statusCode: 400,
          error: 'BAD_REQUEST',
          message: 'modularComponents must be an array.',
        },
      };
    }

    for (const item of raw.modularComponents) {
      if (typeof item !== 'object' || item === null) {
        return {
          valid: false,
          error: {
            success: false,
            statusCode: 400,
            error: 'BAD_REQUEST',
            message: 'Each modular component item must be an object.',
          },
        };
      }
      if (item.salvageValue !== undefined && item.salvageValue !== null) {
        const sv = Number(item.salvageValue);
        if (isNaN(sv) || sv < 0) {
          return {
            valid: false,
            error: {
              success: false,
              statusCode: 400,
              error: 'BAD_REQUEST',
              message: 'Component salvage value cannot be negative.',
            },
          };
        }
      }
    }
  }

  return {
    valid: true,
    data: input as DeviceAssessmentRequest,
  };
}
