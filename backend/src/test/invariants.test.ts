// ============================================================================
// SYSTEM INVARIANT TEST SUITE: E-CYCLEPILOT DECISION ENGINE
// Validates Architectural Invariants A through J
// ============================================================================

import { describe, it, expect } from 'vitest';
import { assessDevice } from '../engine/index.js';
import { CIRCULARITY_PATHWAYS } from '../engine/types.js';
import {
  TC_SAF_001_PAYLOAD,
  TC_USE_001_PAYLOAD,
  TC_USE_002_PAYLOAD,
  TC_REP_001_PAYLOAD,
} from './fixtures/scenarios.js';

describe('Decision Engine Invariants (Invariants A through J)', () => {
  // --------------------------------------------------------------------------
  // Invariant A: Safety always overrides economic value and age
  // --------------------------------------------------------------------------
  it('Invariant A: safety hazard unconditionally overrides massive economic value ($3,500) and brand-new age (0.1 yr)', () => {
    const highValueHazardPayload = {
      device: {
        category: 'LAPTOP',
        brand: 'Apple',
        model: 'MacBook Pro M3 Max',
        ageYears: 0.1,
      },
      physicalCondition: {
        chassisIntegrity: 'WARPED',
        screenCondition: 'INTACT',
        liquidDamage: false,
        thermalDamage: 'BURNT',
        chemicalHazard: 'NONE',
      },
      functionalStatus: {
        powerState: 'POWERS_ON',
        bootState: 'OS_BOOTS',
        displayState: 'WORKING',
      },
      battery: {
        present: true,
        healthPercentage: 99,
        swellingState: 'CONFIRMED_BULGING',
        thermalBehavior: 'OVERHEATING',
      },
      storage: {
        mediaType: 'NVME_SSD',
        sanitizationState: 'VERIFIED_WIPED',
      },
      economics: {
        estimatedMarketValue: 3500.0,
        estimatedRepairCost: 150.0,
      },
    };

    const response = assessDevice(highValueHazardPayload);
    expect(response.success).toBe(true);
    if (!response.success) return;

    expect(response.primaryPathway).toBe('SPECIAL_HANDLING');
    expect(response.safetyAlert.active).toBe(true);
    expect(response.safetyAlert.hazardLevel).toBe('CRITICAL');
    expect(response.disqualifiedPathways).toContain('REUSE');
    expect(response.disqualifiedPathways).toContain('REPAIR');
    expect(response.reasonCodes).toContain('COMMERCIAL_VALUE_OVERRIDDEN_BY_SAFETY');
  });

  // --------------------------------------------------------------------------
  // Invariant B: Unknown battery condition must not silently become confirmed safe
  // --------------------------------------------------------------------------
  it('Invariant B: omitted or unknown battery metrics must trigger cautionary audit warning rather than assuming pristine state', () => {
    const unknownBatteryPayload = {
      device: {
        category: 'SMARTPHONE',
        brand: 'Samsung',
        model: 'Galaxy S20',
        ageYears: 3.0,
      },
      physicalCondition: {
        chassisIntegrity: 'INTACT',
        screenCondition: 'INTACT',
        liquidDamage: false,
        thermalDamage: 'NONE',
        chemicalHazard: 'NONE',
      },
      functionalStatus: {
        powerState: 'POWERS_ON',
        bootState: 'OS_BOOTS',
        displayState: 'WORKING',
      },
      battery: {
        present: true,
        healthPercentage: null,
        swellingState: 'NONE',
        thermalBehavior: 'NORMAL',
      },
      storage: {
        mediaType: 'EMMC_SOLDERED',
        sanitizationState: 'VERIFIED_WIPED',
      },
    };

    const response = assessDevice(unknownBatteryPayload);
    expect(response.success).toBe(true);
    if (!response.success) return;

    expect(response.primaryPathway).not.toBe('REUSE');
    expect(response.uncertaintyWarnings.length).toBeGreaterThan(0);
    expect(
      response.uncertaintyWarnings.some((w) => w.includes('battery') || w.includes('Battery')),
    ).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Invariant C: The repair threshold is a configurable project heuristic
  // Exactly 0.70 is eligible; above 0.70 is prohibitive
  // --------------------------------------------------------------------------
  describe('Invariant C: Configurable repair threshold (0.70 boundary heuristic)', () => {
    it('Invariant C.1: cost ratio of exactly 0.70 (70.0%) is ELIGIBLE for REPAIR under default options', () => {
      const boundary70Payload = {
        device: {
          category: 'SMARTPHONE',
          brand: 'OnePlus',
          model: '9 Pro',
          ageYears: 2.0,
        },
        physicalCondition: {
          chassisIntegrity: 'INTACT',
          screenCondition: 'CRACKED_FUNCTIONAL',
          liquidDamage: false,
          thermalDamage: 'NONE',
          chemicalHazard: 'NONE',
        },
        functionalStatus: {
          powerState: 'POWERS_ON',
          bootState: 'OS_BOOTS',
          displayState: 'WORKING',
        },
        battery: {
          present: true,
          healthPercentage: 85,
          swellingState: 'NONE',
          thermalBehavior: 'NORMAL',
        },
        storage: {
          mediaType: 'EMMC_SOLDERED',
          sanitizationState: 'VERIFIED_WIPED',
        },
        economics: {
          estimatedMarketValue: 100.0,
          estimatedRepairCost: 70.0, // Exactly 70%
        },
      };

      const response = assessDevice(boundary70Payload);
      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('REPAIR');
      expect(response.financialSummary.costRatioPercent).toBe(70.0);
      expect(response.eligiblePathways).toContain('REPAIR');
    });

    it('Invariant C.2: cost ratio of 0.7001 (70.1%) is PROHIBITIVE under default 0.70 heuristic and downgrades', () => {
      const boundaryExceededPayload = {
        device: {
          category: 'SMARTPHONE',
          brand: 'OnePlus',
          model: '9 Pro',
          ageYears: 2.0,
        },
        physicalCondition: {
          chassisIntegrity: 'INTACT',
          screenCondition: 'CRACKED_FUNCTIONAL',
          liquidDamage: false,
          thermalDamage: 'NONE',
          chemicalHazard: 'NONE',
        },
        functionalStatus: {
          powerState: 'POWERS_ON',
          bootState: 'OS_BOOTS',
          displayState: 'WORKING',
        },
        battery: {
          present: true,
          healthPercentage: 85,
          swellingState: 'NONE',
          thermalBehavior: 'NORMAL',
        },
        storage: {
          mediaType: 'EMMC_SOLDERED',
          sanitizationState: 'VERIFIED_WIPED',
        },
        economics: {
          estimatedMarketValue: 100.0,
          estimatedRepairCost: 70.1, // 70.1% > 70.0%
        },
      };

      const response = assessDevice(boundaryExceededPayload);
      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).not.toBe('REPAIR');
      expect(response.disqualifiedPathways).toContain('REPAIR');
      expect(response.reasonCodes).toContain('RULE_REP_002_REPAIR_COST_EXCEEDS_THRESHOLD');
    });

    it('Invariant C.3: respects custom configurable threshold (e.g., 0.50 ceiling)', () => {
      const customThresholdPayload = {
        device: {
          category: 'SMARTPHONE',
          brand: 'OnePlus',
          model: '9 Pro',
          ageYears: 2.0,
        },
        physicalCondition: {
          chassisIntegrity: 'INTACT',
          screenCondition: 'CRACKED_FUNCTIONAL',
          liquidDamage: false,
          thermalDamage: 'NONE',
          chemicalHazard: 'NONE',
        },
        functionalStatus: {
          powerState: 'POWERS_ON',
          bootState: 'OS_BOOTS',
          displayState: 'WORKING',
        },
        battery: {
          present: true,
          healthPercentage: 85,
          swellingState: 'NONE',
          thermalBehavior: 'NORMAL',
        },
        storage: {
          mediaType: 'EMMC_SOLDERED',
          sanitizationState: 'VERIFIED_WIPED',
        },
        economics: {
          estimatedMarketValue: 100.0,
          estimatedRepairCost: 55.0, // 55% would pass default 70%, but fails custom 50%
        },
      };

      const response = assessDevice(customThresholdPayload, {
        repairCostThresholdRatio: 0.5,
      });

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).not.toBe('REPAIR');
      expect(response.disqualifiedPathways).toContain('REPAIR');
    });
  });

  // --------------------------------------------------------------------------
  // Invariant D: Missing financial data must not produce fabricated figures
  // --------------------------------------------------------------------------
  it('Invariant D: missing financial numbers must produce DATA_UNAVAILABLE and null numeric fields', () => {
    const missingFinancesPayload = {
      ...TC_REP_001_PAYLOAD,
      economics: {
        estimatedMarketValue: null,
        estimatedRepairCost: null,
      },
    };

    const response = assessDevice(missingFinancesPayload);
    expect(response.success).toBe(true);
    if (!response.success) return;

    expect(response.financialSummary.status).toBe('DATA_UNAVAILABLE');
    expect(response.financialSummary.estimatedMarketValue).toBeNull();
    expect(response.financialSummary.estimatedRepairCost).toBeNull();
    expect(response.financialSummary.costRatioPercent).toBeNull();
    expect(response.financialSummary.netRepairMargin).toBeNull();
    expect(response.financialSummary.salvageYieldTotal).toBeNull();
  });

  // --------------------------------------------------------------------------
  // Invariant E: Missing salvage prices must not erase valid harvest manifest
  // --------------------------------------------------------------------------
  it('Invariant E: modular components with missing salvage prices are preserved in harvestManifest', () => {
    const modularNoPricesPayload = {
      device: {
        category: 'DESKTOP',
        brand: 'Dell',
        model: 'OptiPlex 7050',
        ageYears: 4.0,
      },
      physicalCondition: {
        chassisIntegrity: 'INTACT',
        screenCondition: 'NOT_APPLICABLE',
        liquidDamage: false,
        thermalDamage: 'NONE',
        chemicalHazard: 'NONE',
      },
      functionalStatus: {
        powerState: 'NO_POWER',
        bootState: 'DEAD',
        displayState: 'NOT_APPLICABLE',
      },
      battery: { present: false },
      modularComponents: [
        { name: '16GB DDR4 RAM', functional: true },
        { name: '512GB M.2 SSD', functional: true },
        { name: 'PCIe WiFi Card', functional: true },
      ],
      storage: {
        mediaType: 'NVME_SSD',
        sanitizationState: 'VERIFIED_WIPED',
      },
    };

    const response = assessDevice(modularNoPricesPayload);
    expect(response.success).toBe(true);
    if (!response.success) return;

    expect(response.primaryPathway).toBe('COMPONENT_RECOVERY');
    expect(response.harvestManifest).toBeDefined();
    expect(response.harvestManifest?.length).toBe(3);
    expect(response.financialSummary.status).toBe('DATA_UNAVAILABLE');
    expect(response.financialSummary.salvageYieldTotal).toBeNull();
  });

  // --------------------------------------------------------------------------
  // Invariant F: Data sanitization is an assessment requirement, not disk wiping
  // --------------------------------------------------------------------------
  it('Invariant F: engine flags data sanitization requirement without claiming it executed wiping or issuing certificate', () => {
    const response = assessDevice(TC_USE_002_PAYLOAD);
    expect(response.success).toBe(true);
    if (!response.success) return;

    expect(response.complianceFlags.dataSanitizationRequired).toBe(true);
    // Must NOT claim certificate was issued or drive was wiped by software
    const checklistStr = response.actionChecklist.join(' ');
    expect(checklistStr).toContain('NIST SP 800-88 Rev. 2');
    expect(checklistStr.toLowerCase()).not.toContain('certificate issued by engine');
  });

  // --------------------------------------------------------------------------
  // Invariant G: Strict Determinism (Identical inputs -> Identical outputs)
  // --------------------------------------------------------------------------
  it('Invariant G: identical valid inputs produce 100% identical outputs across multiple evaluations', () => {
    const run1 = assessDevice(TC_USE_001_PAYLOAD);
    const run2 = assessDevice(TC_USE_001_PAYLOAD);

    expect(run1.success).toBe(true);
    expect(run2.success).toBe(true);
    if (!run1.success || !run2.success) return;

    expect(run1.primaryPathway).toBe(run2.primaryPathway);
    expect(run1.reasonCodes).toEqual(run2.reasonCodes);
    expect(run1.eligiblePathways).toEqual(run2.eligiblePathways);
    expect(run1.disqualifiedPathways).toEqual(run2.disqualifiedPathways);
    expect(run1.financialSummary).toEqual(run2.financialSummary);
    expect(run1.complianceFlags).toEqual(run2.complianceFlags);
  });

  // --------------------------------------------------------------------------
  // Invariant H: Invalid or contradictory inputs must be rejected with HTTP 400
  // --------------------------------------------------------------------------
  it('Invariant H: contradictory or malformed telemetry is rejected with error, not converted to an ordinary recommendation', () => {
    const contradictoryPayload = {
      device: {
        category: 'LAPTOP',
        brand: 'Lenovo',
        ageYears: 2.0,
      },
      functionalStatus: {
        powerState: 'NO_POWER',
        bootState: 'OS_BOOTS', // Contradiction
        displayState: 'WORKING',
      },
    };

    const response = assessDevice(contradictoryPayload);
    expect(response.success).toBe(false);
    if (response.success) return;

    expect(response.statusCode).toBe(400);
    expect(response.error).toBe('LOGICAL_CONTRADICTION');
  });

  // --------------------------------------------------------------------------
  // Invariant I: Age alone must not override a safety hazard
  // --------------------------------------------------------------------------
  it('Invariant I: extreme age (15.0 years) cannot override a critical safety hazard (swollen battery)', () => {
    const ancientSwollenPayload = {
      device: {
        category: 'LAPTOP',
        brand: 'IBM',
        model: 'ThinkPad T60',
        ageYears: 15.0,
      },
      physicalCondition: {
        chassisIntegrity: 'WARPED',
        screenCondition: 'INTACT',
        liquidDamage: false,
        thermalDamage: 'NONE',
        chemicalHazard: 'NONE',
      },
      functionalStatus: {
        powerState: 'NO_POWER',
        bootState: 'DEAD',
        displayState: 'UNKNOWN',
      },
      battery: {
        present: true,
        swellingState: 'CONFIRMED_BULGING',
        thermalBehavior: 'NORMAL',
      },
      storage: {
        mediaType: 'HDD',
        sanitizationState: 'VERIFIED_WIPED',
      },
    };

    const response = assessDevice(ancientSwollenPayload);
    expect(response.success).toBe(true);
    if (!response.success) return;

    expect(response.primaryPathway).toBe('SPECIAL_HANDLING');
    expect(response.primaryPathway).not.toBe('FORMAL_RECYCLING');
    expect(response.disqualifiedPathways).toContain('FORMAL_RECYCLING');
  });

  // --------------------------------------------------------------------------
  // Invariant J: No pathway returned outside the six frozen identifiers
  // --------------------------------------------------------------------------
  it('Invariant J: all returned pathways strictly conform to the 6 frozen specification identifiers', () => {
    const payloads = [
      TC_SAF_001_PAYLOAD,
      TC_USE_001_PAYLOAD,
      TC_USE_002_PAYLOAD,
      TC_REP_001_PAYLOAD,
    ];

    for (const payload of payloads) {
      const response = assessDevice(payload);
      expect(response.success).toBe(true);
      if (!response.success) continue;

      expect(CIRCULARITY_PATHWAYS).toContain(response.primaryPathway);

      for (const p of response.eligiblePathways) {
        expect(CIRCULARITY_PATHWAYS).toContain(p);
      }
      for (const p of response.disqualifiedPathways) {
        expect(CIRCULARITY_PATHWAYS).toContain(p);
      }
      for (const item of response.pathwayComparison) {
        expect(CIRCULARITY_PATHWAYS).toContain(item.pathway);
      }
    }
  });
});
