// ============================================================================
// E-CyclePilot: AI-Powered E-Waste Recovery & Circularity Decision Engine
// Stage D & G: Pathway Decision Pipeline & Assessment Synthesizer
// ============================================================================

import {
  CIRCULARITY_PATHWAYS,
  CircularityPathway,
  DeviceAssessmentRequest,
  DeviceAssessmentResponse,
  DisqualificationReasons,
  EngineOptions,
  PathwayComparisonItem,
  REASON_CODES,
} from './types.js';
import { evaluateSafety } from './safety.js';
import { evaluateSanitization } from './sanitization.js';
import { evaluateEconomics } from './economics.js';

/**
 * Deterministically synthesizes an assessment response for a valid request payload.
 */
export function runDecisionPipeline(
  req: DeviceAssessmentRequest,
  options?: EngineOptions,
): DeviceAssessmentResponse {
  const obsolescenceCeiling = options?.obsolescenceAgeYears ?? 10.0;
  const batteryHealthThreshold = options?.batteryHealthDegradedThreshold ?? 80;
  const configuredThresholdRatio = options?.repairCostThresholdRatio ?? 0.7;

  // 1. Stage B: Safety Evaluation
  const safety = evaluateSafety(req);

  // 2. Stage C: Sanitization Evaluation
  const sanitization = evaluateSanitization(req);

  // 3. Stage E & F: Economics & Harvest Evaluation
  const economics = evaluateEconomics(req, options);

  const reasonCodes: string[] = [];
  const actionChecklist: string[] = [];
  const uncertaintyWarnings: string[] = [];
  const eligiblePathways: CircularityPathway[] = [];
  const disqualifiedPathways: CircularityPathway[] = [];
  const disqualificationReasons: DisqualificationReasons = {};

  let primaryPathway: CircularityPathway;
  let primaryRationale: string;

  // --------------------------------------------------------------------------
  // PATHWAY SELECTION
  // --------------------------------------------------------------------------

  if (safety.isHazardous) {
    // Stage B Safety Dominance Gate
    primaryPathway = 'SPECIAL_HANDLING';
    primaryRationale =
      'Hazardous condition detected. Device requires fire suppression or hazmat containment prior to any handling or processing.';

    reasonCodes.push(...safety.hazardReasonCodes);
    eligiblePathways.push('SPECIAL_HANDLING');

    // All standard recovery routes are strictly disqualified
    disqualifiedPathways.push(
      'REUSE',
      'REPAIR',
      'REFURBISHMENT',
      'COMPONENT_RECOVERY',
      'FORMAL_RECYCLING',
    );

    disqualificationReasons.REUSE =
      'Safety hazard present; commercial reuse is prohibited under UN 3480/3481 regulations.';
    disqualificationReasons.REPAIR =
      'Standard repair cannot proceed while active hazmat or thermal runaway risk is uncontained.';
    disqualificationReasons.REFURBISHMENT =
      'Refurbishment facility cannot accept uncontained hazmat devices.';
    disqualificationReasons.COMPONENT_RECOVERY =
      'Component extraction prohibited until hazardous fractions are professionally decommissioned.';
    disqualificationReasons.FORMAL_RECYCLING =
      'Device must not be fed into standard shredding lines until hazmat containment is complete.';

    actionChecklist.push(...safety.safetyAlert.mandatoryContainmentInstructions);
  } else if (req.device.ageYears !== undefined && req.device.ageYears >= obsolescenceCeiling) {
    // Architectural Obsolescence Gate (>= 10.0 years)
    primaryPathway = 'FORMAL_RECYCLING';
    primaryRationale = `Device age (${req.device.ageYears.toFixed(1)} years) meets or exceeds the ${obsolescenceCeiling.toFixed(1)}-year architectural obsolescence threshold. Recommended for certified mechanical recycling and material recovery.`;

    reasonCodes.push(REASON_CODES.RULE_REC_001_ARCHITECTURAL_OBSOLESCENCE);
    eligiblePathways.push('FORMAL_RECYCLING');

    disqualifiedPathways.push('REUSE', 'REPAIR', 'REFURBISHMENT', 'SPECIAL_HANDLING');
    disqualificationReasons.REUSE = `Hardware architecture exceeds the ${obsolescenceCeiling.toFixed(1)}-year obsolescence ceiling.`;
    disqualificationReasons.REPAIR = 'Obsolete platform does not justify repair expenditure.';
    disqualificationReasons.REFURBISHMENT =
      'Outdated architecture cannot support modern operating software.';
    disqualificationReasons.SPECIAL_HANDLING = 'No active hazardous materials detected.';

    actionChecklist.push(
      'Deliver to an R2v3 or e-Stewards accredited recycling facility for closed-loop commodity recovery',
    );
  } else {
    // Functional Telemetry & Physical Defect Assessment
    const isNoPower = req.functionalStatus?.powerState === 'NO_POWER';
    const isDead = req.functionalStatus?.bootState === 'DEAD';
    const isUnbootable = isNoPower || isDead;

    const screenCondition = String(req.physicalCondition?.screenCondition || '');
    const displayState = String(req.functionalStatus?.displayState || '');

    const hasScreenDefect =
      screenCondition === 'CRACKED_FUNCTIONAL' ||
      screenCondition === 'SHATTERED' ||
      screenCondition === 'DELAMINATING' ||
      displayState === 'CRACKED_FUNCTIONAL' ||
      displayState === 'CRACKED_NO_DISPLAY';

    const hasModularComponents = economics.harvestManifest.length > 0;
    const hasSalvageEstimate =
      req.economics?.estimatedComponentSalvageValue !== undefined &&
      req.economics.estimatedComponentSalvageValue !== null &&
      req.economics.estimatedComponentSalvageValue > 0;

    if (isUnbootable) {
      // System Board Dead / Non-Functional
      if (hasModularComponents) {
        primaryPathway = 'COMPONENT_RECOVERY';
        primaryRationale =
          'Mainboard is non-functional, but verified working modular subcomponents can be salvaged to prevent unnecessary silicon waste.';

        reasonCodes.push(REASON_CODES.RULE_CMP_001_VALUABLE_MODULAR_COMPONENTS_HARVESTABLE);
        eligiblePathways.push('COMPONENT_RECOVERY', 'FORMAL_RECYCLING');
        disqualifiedPathways.push('REUSE', 'REPAIR', 'REFURBISHMENT', 'SPECIAL_HANDLING');

        disqualificationReasons.REUSE = 'Device cannot power on or boot.';
        disqualificationReasons.REPAIR =
          'Catastrophic motherboard failure precludes economic repair.';
        disqualificationReasons.REFURBISHMENT = 'Core logic board is non-functional.';
        disqualificationReasons.SPECIAL_HANDLING = 'No active hazardous materials detected.';

        actionChecklist.push(
          'Extract verified functional modular components and log into bench inventory',
        );
        actionChecklist.push('Route remaining stripped carcass to certified mechanical recycling');
      } else {
        primaryPathway = 'FORMAL_RECYCLING';
        primaryRationale =
          'Device board is unbootable with zero modular components available for salvage. Directing to certified formal recycling.';

        reasonCodes.push(REASON_CODES.RULE_REC_002_NO_HARVESTABLE_COMPONENTS_DOWNGRADE);
        eligiblePathways.push('FORMAL_RECYCLING');
        disqualifiedPathways.push(
          'COMPONENT_RECOVERY',
          'REUSE',
          'REPAIR',
          'REFURBISHMENT',
          'SPECIAL_HANDLING',
        );

        disqualificationReasons.COMPONENT_RECOVERY =
          'Zero functional modular components present for parts harvesting.';
        disqualificationReasons.REUSE = 'System board cannot power on or boot.';
        disqualificationReasons.REPAIR = 'System board is non-functional.';
        disqualificationReasons.REFURBISHMENT = 'Core board cannot pass POST diagnostic.';
        disqualificationReasons.SPECIAL_HANDLING = 'No active hazardous materials detected.';

        actionChecklist.push(
          'Deliver to an R2v3 or e-Stewards accredited recycling facility for closed-loop commodity recovery',
        );
      }
    } else if (hasScreenDefect) {
      // Screen Defect on Operational Board
      if (economics.isRepairViable === true) {
        // Viable repair (cost ratio <= threshold)
        primaryPathway = 'REPAIR';
        primaryRationale = `Isolated display defect is economically viable to restore (${economics.financialSummary.costRatioPercent}% of market value, within ${(configuredThresholdRatio * 100).toFixed(0)}% threshold).`;

        reasonCodes.push(REASON_CODES.RULE_REP_001_ISOLATED_DEFECT_ECONOMICALLY_VIABLE);
        eligiblePathways.push('REPAIR', 'REFURBISHMENT');
        disqualifiedPathways.push('REUSE', 'SPECIAL_HANDLING');

        disqualificationReasons.REUSE = 'Display defect prevents immediate direct deployment.';
        disqualificationReasons.SPECIAL_HANDLING = 'No active hazardous materials detected.';

        actionChecklist.push('Procure replacement display panel and execute component repair');
      } else if (economics.isRepairViable === false) {
        // Repair cost exceeds threshold (> 70%) -> Downgrade
        reasonCodes.push(REASON_CODES.RULE_REP_002_REPAIR_COST_EXCEEDS_THRESHOLD);
        disqualifiedPathways.push('REPAIR', 'REUSE', 'SPECIAL_HANDLING');

        disqualificationReasons.REPAIR = `Cost ratio ${economics.financialSummary.costRatioPercent}% exceeds ${(configuredThresholdRatio * 100).toFixed(0)}% ceiling`;
        disqualificationReasons.REUSE = 'Display defect prevents immediate deployment.';
        disqualificationReasons.SPECIAL_HANDLING = 'No active hazardous materials detected.';

        if (hasModularComponents || hasSalvageEstimate) {
          primaryPathway = 'COMPONENT_RECOVERY';
          primaryRationale = `Repair cost (${economics.financialSummary.costRatioPercent}%) exceeds the ${(configuredThresholdRatio * 100).toFixed(0)}% economic ceiling. Downgrading to component recovery to salvage modular parts.`;
          eligiblePathways.push('COMPONENT_RECOVERY', 'FORMAL_RECYCLING');
          actionChecklist.push('Extract salvageable modular components prior to carcass recycling');
        } else {
          primaryPathway = 'FORMAL_RECYCLING';
          primaryRationale = `Repair cost (${economics.financialSummary.costRatioPercent}%) exceeds the ${(configuredThresholdRatio * 100).toFixed(0)}% economic ceiling with no modular parts to salvage. Routing to formal recycling.`;
          eligiblePathways.push('FORMAL_RECYCLING');
          actionChecklist.push('Deliver to an R2v3 or e-Stewards accredited recycling facility');
        }
      } else {
        // Repair quote missing (Closed Decision A)
        primaryPathway = 'REPAIR';
        primaryRationale =
          'Device exhibits an isolated repairable display fault. Economic feasibility remains unconfirmed until a repair quote is obtained.';

        reasonCodes.push(REASON_CODES.RULE_REP_003_ECONOMIC_FEASIBILITY_UNCONFIRMED);
        eligiblePathways.push('REPAIR', 'REFURBISHMENT');
        disqualifiedPathways.push('REUSE', 'SPECIAL_HANDLING');

        disqualificationReasons.REUSE = 'Display defect requires repair prior to reuse.';
        disqualificationReasons.SPECIAL_HANDLING = 'No active hazardous materials detected.';

        actionChecklist.push(
          'Obtain local repair quote to confirm economic feasibility before committing funds',
        );
      }
    } else {
      // Board powers on, display intact
      const batteryPresent = req.battery?.present !== false;
      const batteryHealth = req.battery?.healthPercentage;

      const isBatteryUnknown =
        batteryPresent && (batteryHealth === null || batteryHealth === undefined);

      const isBatteryDegraded =
        batteryPresent &&
        typeof batteryHealth === 'number' &&
        batteryHealth < batteryHealthThreshold;

      const isChassisScratched =
        req.physicalCondition?.chassisIntegrity === 'SCRATCHED' ||
        req.physicalCondition?.chassisIntegrity === 'DAMAGED';

      const isPostPassOnly = req.functionalStatus?.bootState === 'POST_PASS';

      if (isBatteryUnknown || isBatteryDegraded || isChassisScratched || isPostPassOnly) {
        // Refurbishment Candidate
        primaryPathway = 'REFURBISHMENT';
        primaryRationale =
          'Core electronics are healthy, but unit requires battery refresh, cosmetic overhaul, or software re-imaging prior to redeployment.';

        if (isBatteryUnknown) {
          reasonCodes.push(
            REASON_CODES.RULE_REF_002_BATTERY_METRIC_UNKNOWN_AGE_INTERMEDIATE,
            REASON_CODES.UNKNOWN_BATTERY_METRIC,
          );
          uncertaintyWarnings.push('Battery health metric not supplied; battery audit recommended');
          actionChecklist.push(
            'Run full hardware battery cycle diagnostic to determine health percentage',
          );
        } else {
          reasonCodes.push(REASON_CODES.RULE_REF_001_MULTI_POINT_MAINTENANCE_REQUIRED);
          if (isBatteryDegraded) {
            actionChecklist.push(
              'Replace degraded battery (<70% health) to restore portable runtime',
            );
          }
        }

        eligiblePathways.push('REFURBISHMENT', 'REUSE');
        disqualifiedPathways.push('SPECIAL_HANDLING');
        disqualificationReasons.SPECIAL_HANDLING = 'No active hazardous materials detected.';
      } else {
        // Pristine Direct Reuse
        primaryPathway = 'REUSE';
        primaryRationale =
          'Device is fully functional, structurally sound, and within the modern secondary deployment window. Immediate reuse affirmed.';

        reasonCodes.push(REASON_CODES.RULE_USE_001_FULLY_FUNCTIONAL_PRISTINE);
        eligiblePathways.push('REUSE', 'REFURBISHMENT');
        disqualifiedPathways.push('SPECIAL_HANDLING');
        disqualificationReasons.SPECIAL_HANDLING = 'No active hazardous materials detected.';

        actionChecklist.push(
          'Clean external surfaces and prepare unit for direct redeployment or donation',
        );
      }
    }
  }

  // Append Sanitization Check and Flags
  if (sanitization.dataSanitizationRequired) {
    reasonCodes.push(...sanitization.sanitizationReasonCodes);
    actionChecklist.push(...sanitization.sanitizationActionChecklist);
  }

  // Append Missing Economic Data Flag
  if (economics.missingEconomicData) {
    reasonCodes.push(REASON_CODES.MISSING_ECONOMIC_DATA);
  }

  // Deduplicate Reason Codes & Action Items deterministically
  const finalReasonCodes = Array.from(new Set(reasonCodes));
  const finalActionChecklist = Array.from(new Set(actionChecklist));
  const finalEligiblePathways = Array.from(new Set(eligiblePathways));
  const finalDisqualifiedPathways = Array.from(new Set(disqualifiedPathways));

  // Synthesize Deterministic Pathway Comparison Matrix
  const pathwayComparison: PathwayComparisonItem[] = CIRCULARITY_PATHWAYS.map((p) => {
    if (p === primaryPathway) {
      return {
        pathway: p,
        status: 'RECOMMENDED',
        score: 95,
        rationale: `Primary recommended pathway: ${primaryRationale}`,
      };
    }
    if (finalEligiblePathways.includes(p)) {
      return {
        pathway: p,
        status: 'ELIGIBLE',
        score: 75,
        rationale: `Viable secondary alternative based on current telemetry.`,
      };
    }
    return {
      pathway: p,
      status: 'DISQUALIFIED',
      score: 0,
      rationale:
        disqualificationReasons[p] ||
        'Does not meet mandatory eligibility criteria for this pathway.',
      disqualificationReason: disqualificationReasons[p],
    };
  });

  return {
    assessmentId: 'ECP-ASSESSMENT-DETERMINISTIC',
    timestamp: '2026-10-10T00:00:00.000Z',
    primaryPathway,
    primaryRationale,
    safetyAlert: safety.safetyAlert,
    complianceFlags: {
      dataSanitizationRequired: sanitization.dataSanitizationRequired,
      hazardousTransportRestricted: safety.hazardousTransportRestricted,
    },
    eligiblePathways: finalEligiblePathways,
    disqualifiedPathways: finalDisqualifiedPathways,
    disqualificationReasons,
    pathwayComparison,
    reasonCodes: finalReasonCodes,
    actionChecklist: finalActionChecklist,
    harvestManifest: economics.harvestManifest,
    financialSummary: economics.financialSummary,
    uncertaintyWarnings,
  };
}
