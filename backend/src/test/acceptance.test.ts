// ============================================================================
// ACCEPTANCE TEST SUITE: E-CYCLEPILOT DECISION ENGINE
// Based on: ACCEPTANCE_TEST_PLAN.md (ATP-ECP-001 / Version 2.0.0)
// Target: 21 Standardized Scenarios (TC-SAF-001 through TC-EDG-001)
// ============================================================================

import { describe, it, expect } from 'vitest';
import { assessDevice } from '../engine/index.js';
import {
  TC_SAF_001_PAYLOAD,
  TC_SAF_002_PAYLOAD,
  TC_SAF_003_PAYLOAD,
  TC_SAF_004_PAYLOAD,
  TC_SAF_005_PAYLOAD,
  TC_SAF_006_PAYLOAD,
  TC_USE_001_PAYLOAD,
  TC_USE_002_PAYLOAD,
  TC_REP_001_PAYLOAD,
  TC_REP_002_PAYLOAD,
  TC_REP_003_PAYLOAD,
  TC_REF_001_PAYLOAD,
  TC_CMP_001_PAYLOAD,
  TC_CMP_002_PAYLOAD,
  TC_CMP_003_PAYLOAD,
  TC_REC_001_PAYLOAD,
  TC_MIS_001_PAYLOAD,
  TC_MIS_002_PAYLOAD,
  TC_INV_001_PAYLOAD,
  TC_INV_002_PAYLOAD,
  TC_EDG_001_PAYLOAD,
} from './fixtures/scenarios.js';

describe('Acceptance Test Plan (ATP-ECP-001): 21 Acceptance Scenarios', () => {
  // ==========================================================================
  // Category 1: Safety Hazard & Precedence Gate (TC-SAF-001 .. TC-SAF-006)
  // ==========================================================================
  describe('Safety Precedence Gate (TC-SAF-001 .. TC-SAF-006)', () => {
    it('TC-SAF-001: routes confirmed swollen lithium-ion battery to SPECIAL_HANDLING despite high economic value', () => {
      const response = assessDevice(TC_SAF_001_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('SPECIAL_HANDLING');
      expect(response.safetyAlert.active).toBe(true);
      expect(response.safetyAlert.hazardLevel).toBe('CRITICAL');
      expect(response.disqualifiedPathways).toContain('REUSE');
      expect(response.disqualifiedPathways).toContain('REPAIR');
      expect(response.disqualifiedPathways).toContain('REFURBISHMENT');
      expect(response.reasonCodes).toContain('RULE_SAF_001_BATTERY_SWELLING_CONFIRMED');
      expect(response.reasonCodes).toContain('COMMERCIAL_VALUE_OVERRIDDEN_BY_SAFETY');
    });

    it('TC-SAF-002: routes suspected battery swelling / delaminating screen to SPECIAL_HANDLING', () => {
      const response = assessDevice(TC_SAF_002_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('SPECIAL_HANDLING');
      expect(response.safetyAlert.active).toBe(true);
      expect(response.reasonCodes).toContain('RULE_SAF_002_BATTERY_SWELLING_SUSPECTED');
    });

    it('TC-SAF-003: routes severe thermal burn damage to SPECIAL_HANDLING', () => {
      const response = assessDevice(TC_SAF_003_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('SPECIAL_HANDLING');
      expect(response.safetyAlert.active).toBe(true);
      expect(response.reasonCodes).toContain('RULE_SAF_003_THERMAL_DAMAGE_DETECTED');
    });

    it('TC-SAF-004: routes broken mercury CCFL backlight to SPECIAL_HANDLING', () => {
      const response = assessDevice(TC_SAF_004_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('SPECIAL_HANDLING');
      expect(response.safetyAlert.active).toBe(true);
      expect(response.reasonCodes).toContain('RULE_SAF_004_TOXIC_CHEMICAL_EXPOSURE');
    });

    it('TC-SAF-005: routes compound hazard (swelling + chemical leakage) to SPECIAL_HANDLING', () => {
      const response = assessDevice(TC_SAF_005_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('SPECIAL_HANDLING');
      expect(response.safetyAlert.active).toBe(true);
      expect(response.reasonCodes).toContain('RULE_SAF_001_BATTERY_SWELLING_CONFIRMED');
      expect(response.reasonCodes).toContain('RULE_SAF_004_TOXIC_CHEMICAL_EXPOSURE');
    });

    it('TC-SAF-006: safety unconditionally overrides age obsolescence for 10.5-year-old device with swollen battery', () => {
      const response = assessDevice(TC_SAF_006_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('SPECIAL_HANDLING');
      expect(response.safetyAlert.active).toBe(true);
      expect(response.reasonCodes).toContain('RULE_SAF_001_BATTERY_SWELLING_CONFIRMED');
      expect(response.disqualifiedPathways).toContain('FORMAL_RECYCLING');
    });
  });

  // ==========================================================================
  // Category 2: Direct Reuse & Data Sanitization Gates (TC-USE-001 .. TC-USE-002)
  // ==========================================================================
  describe('Reuse & Data Sanitization Gates (TC-USE-001 .. TC-USE-002)', () => {
    it('TC-USE-001: routes pristine operational modern laptop with wiped drive to REUSE', () => {
      const response = assessDevice(TC_USE_001_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('REUSE');
      expect(response.eligiblePathways).toContain('REUSE');
      expect(response.eligiblePathways).toContain('REFURBISHMENT');
      expect(response.reasonCodes).toContain('RULE_USE_001_FULLY_FUNCTIONAL_PRISTINE');
      expect(response.complianceFlags.dataSanitizationRequired).toBe(false);
      expect(response.safetyAlert.active).toBe(false);
    });

    it('TC-USE-002: routes working laptop with unencrypted data to REUSE with mandatory dataSanitizationRequired flag', () => {
      const response = assessDevice(TC_USE_002_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('REUSE');
      expect(response.complianceFlags.dataSanitizationRequired).toBe(true);
      expect(response.reasonCodes).toContain('RULE_USE_001_FULLY_FUNCTIONAL_PRISTINE');
      expect(response.reasonCodes).toContain('DATA_SANITIZATION_REQUIRED');
      expect(response.actionChecklist.some((item) => item.includes('NIST SP 800-88 Rev. 2'))).toBe(
        true,
      );
    });
  });

  // ==========================================================================
  // Category 3: Repair Economics & Boundary Thresholds (TC-REP-001 .. TC-REP-003)
  // ==========================================================================
  describe('Repair Economics (TC-REP-001 .. TC-REP-003)', () => {
    it('TC-REP-001: routes economically viable screen repair (cost ratio 30.4% <= 70%) to REPAIR', () => {
      const response = assessDevice(TC_REP_001_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('REPAIR');
      expect(response.reasonCodes).toContain('RULE_REP_001_ISOLATED_DEFECT_ECONOMICALLY_VIABLE');
      expect(response.financialSummary.status).toBe('CALCULATED');
      expect(response.financialSummary.estimatedMarketValue).toBe(280.0);
      expect(response.financialSummary.estimatedRepairCost).toBe(85.0);
      expect(response.financialSummary.netRepairMargin).toBe(195.0);
      expect(response.financialSummary.costRatioPercent).toBe(30.4);
    });

    it('TC-REP-002: downgrades prohibitive repair (cost ratio 120% > 70%) to COMPONENT_RECOVERY', () => {
      const response = assessDevice(TC_REP_002_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('COMPONENT_RECOVERY');
      expect(response.disqualifiedPathways).toContain('REPAIR');
      expect(response.reasonCodes).toContain('RULE_REP_002_REPAIR_COST_EXCEEDS_THRESHOLD');
      expect(response.financialSummary.costRatioPercent).toBe(120.0);
      expect(response.financialSummary.netRepairMargin).toBe(-40.0);
      if (response.disqualificationReasons?.REPAIR) {
        expect(response.disqualificationReasons.REPAIR).toContain('exceeds 70% ceiling');
      }
    });

    it('TC-REP-003: isolated defect with missing quote remains REPAIR candidate with unconfirmed status (Decision A)', () => {
      const response = assessDevice(TC_REP_003_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('REPAIR');
      expect(response.reasonCodes).toContain('RULE_REP_003_ECONOMIC_FEASIBILITY_UNCONFIRMED');
      expect(response.financialSummary.status).toBe('DATA_UNAVAILABLE');
      expect(response.financialSummary.netRepairMargin).toBeNull();
      expect(response.financialSummary.costRatioPercent).toBeNull();
      expect(
        response.actionChecklist.some((item) => item.includes('Obtain local repair quote')),
      ).toBe(true);
    });
  });

  // ==========================================================================
  // Category 4: Refurbishment (TC-REF-001)
  // ==========================================================================
  describe('Refurbishment (TC-REF-001)', () => {
    it('TC-REF-001: routes scuffed laptop with degraded battery (<70%) to REFURBISHMENT', () => {
      const response = assessDevice(TC_REF_001_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('REFURBISHMENT');
      expect(response.reasonCodes).toContain('RULE_REF_001_MULTI_POINT_MAINTENANCE_REQUIRED');
      expect(
        response.actionChecklist.some(
          (item) => item.includes('battery') && item.includes('health'),
        ),
      ).toBe(true);
    });
  });

  // ==========================================================================
  // Category 5: Component Recovery & Missing Prices (TC-CMP-001 .. TC-CMP-003)
  // ==========================================================================
  describe('Component Recovery (TC-CMP-001 .. TC-CMP-003)', () => {
    it('TC-CMP-001: dead motherboard with modular GPU/RAM/SSD routes to COMPONENT_RECOVERY with salvage sum', () => {
      const response = assessDevice(TC_CMP_001_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('COMPONENT_RECOVERY');
      expect(response.reasonCodes).toContain(
        'RULE_CMP_001_VALUABLE_MODULAR_COMPONENTS_HARVESTABLE',
      );
      expect(response.harvestManifest).toBeDefined();
      expect(response.harvestManifest?.length).toBe(3);
      expect(response.financialSummary.salvageYieldTotal).toBe(280.0);
    });

    it('TC-CMP-002: dead board with zero modular parts downgrades to FORMAL_RECYCLING', () => {
      const response = assessDevice(TC_CMP_002_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('FORMAL_RECYCLING');
      expect(response.disqualifiedPathways).toContain('COMPONENT_RECOVERY');
      expect(response.reasonCodes).toContain('RULE_REC_002_NO_HARVESTABLE_COMPONENTS_DOWNGRADE');
    });

    it('TC-CMP-003: dead board with working modular parts but missing prices populates manifest with DATA_UNAVAILABLE (Decision C)', () => {
      const response = assessDevice(TC_CMP_003_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('COMPONENT_RECOVERY');
      expect(response.reasonCodes).toContain(
        'RULE_CMP_001_VALUABLE_MODULAR_COMPONENTS_HARVESTABLE',
      );
      expect(response.harvestManifest).toBeDefined();
      expect(response.harvestManifest?.length).toBe(2);
      expect(response.financialSummary.status).toBe('DATA_UNAVAILABLE');
      expect(response.financialSummary.salvageYieldTotal).toBeNull();
    });
  });

  // ==========================================================================
  // Category 6: Formal Recycling (TC-REC-001)
  // ==========================================================================
  describe('Formal Recycling (TC-REC-001)', () => {
    it('TC-REC-001: routes 16-year-old obsolete Pentium 4 hardware to FORMAL_RECYCLING', () => {
      const response = assessDevice(TC_REC_001_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('FORMAL_RECYCLING');
      expect(response.reasonCodes).toContain('RULE_REC_001_ARCHITECTURAL_OBSOLESCENCE');
      expect(response.safetyAlert.active).toBe(false);
    });
  });

  // ==========================================================================
  // Category 7: Missing Data & Telemetry (TC-MIS-001 .. TC-MIS-002)
  // ==========================================================================
  describe('Missing Data & Telemetry (TC-MIS-001 .. TC-MIS-002)', () => {
    it('TC-MIS-001: missing all financial fields retains REUSE without hallucinating dollar figures', () => {
      const response = assessDevice(TC_MIS_001_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('REUSE');
      expect(response.reasonCodes).toContain('RULE_USE_001_FULLY_FUNCTIONAL_PRISTINE');
      expect(response.financialSummary.status).toBe('DATA_UNAVAILABLE');
      expect(response.financialSummary.estimatedMarketValue).toBeNull();
      expect(response.financialSummary.estimatedRepairCost).toBeNull();
      expect(response.financialSummary.netRepairMargin).toBeNull();
      expect(response.financialSummary.costRatioPercent).toBeNull();
      expect(response.reasonCodes).toContain('MISSING_ECONOMIC_DATA');
    });

    it('TC-MIS-002: missing battery health metric routes to REFURBISHMENT with diagnostic warning', () => {
      const response = assessDevice(TC_MIS_002_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('REFURBISHMENT');
      expect(response.reasonCodes).toContain(
        'RULE_REF_002_BATTERY_METRIC_UNKNOWN_AGE_INTERMEDIATE',
      );
      expect(response.reasonCodes).toContain('UNKNOWN_BATTERY_METRIC');
      expect(
        response.uncertaintyWarnings.some((w) => w.includes('Battery health metric not supplied')),
      ).toBe(true);
    });
  });

  // ==========================================================================
  // Category 8: Invalid & Contradictory Inputs (TC-INV-001 .. TC-INV-002)
  // ==========================================================================
  describe('Input Validation & Error Handling (TC-INV-001 .. TC-INV-002)', () => {
    it('TC-INV-001: rejects unsupported device category with HTTP 400 BAD_REQUEST', () => {
      const response = assessDevice(TC_INV_001_PAYLOAD);

      expect(response.success).toBe(false);
      if (response.success) return;

      expect(response.statusCode).toBe(400);
      expect(response.error).toBe('BAD_REQUEST');
      expect(response.message).toContain('MICROWAVE');
    });

    it('TC-INV-002: rejects contradictory telemetry (NO_POWER yet OS_BOOTS) with HTTP 400 LOGICAL_CONTRADICTION', () => {
      const response = assessDevice(TC_INV_002_PAYLOAD);

      expect(response.success).toBe(false);
      if (response.success) return;

      expect(response.statusCode).toBe(400);
      expect(response.error).toBe('LOGICAL_CONTRADICTION');
      expect(response.message).toContain('cannot boot OS while powerState is NO_POWER');
    });
  });

  // ==========================================================================
  // Category 9: Exact Boundary Edge Case (TC-EDG-001)
  // ==========================================================================
  describe('Boundary Edge Cases (TC-EDG-001)', () => {
    it('TC-EDG-001: exactly 10.0 years of age triggers FORMAL_RECYCLING obsolescence boundary (Decision D)', () => {
      const response = assessDevice(TC_EDG_001_PAYLOAD);

      expect(response.success).toBe(true);
      if (!response.success) return;

      expect(response.primaryPathway).toBe('FORMAL_RECYCLING');
      expect(response.reasonCodes).toContain('RULE_REC_001_ARCHITECTURAL_OBSOLESCENCE');
    });
  });
});
