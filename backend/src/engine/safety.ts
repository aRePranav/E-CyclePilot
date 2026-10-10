// ============================================================================
// E-CyclePilot: AI-Powered E-Waste Recovery & Circularity Decision Engine
// Stage B: Safety Precedence Gate & Hazard Evaluation
// ============================================================================

import { DeviceAssessmentRequest, REASON_CODES, SafetyAlert } from './types.js';

export interface SafetyEvaluation {
  isHazardous: boolean;
  safetyAlert: SafetyAlert;
  hazardReasonCodes: string[];
  hazardousTransportRestricted: boolean;
}

/**
 * Evaluates hardware and telemetry for critical safety hazards.
 * Safety unconditionally overrides economic value, salvage yield, and device age.
 */
export function evaluateSafety(req: DeviceAssessmentRequest): SafetyEvaluation {
  const hazardsIdentified: string[] = [];
  const containmentInstructions: string[] = [];
  const hazardReasonCodes: string[] = [];

  let hasConfirmedSwelling = false;
  let hasSuspectedSwelling = false;
  let hasThermalDamage = false;
  let hasChemicalHazard = false;

  // 1. Battery Swelling Check (UN 3480 / UN 3481)
  if (req.battery?.swellingState === 'CONFIRMED_BULGING') {
    hasConfirmedSwelling = true;
    hazardReasonCodes.push(REASON_CODES.RULE_SAF_001_BATTERY_SWELLING_CONFIRMED);
    hazardsIdentified.push(
      'Confirmed lithium-ion battery pouch swelling (fire and thermal runaway hazard)',
    );
    containmentInstructions.push(
      'Place device immediately in a fire-resistant LiPo containment bag or metal drum with dry vermiculite/sand.',
    );
  } else if (req.battery?.swellingState === 'SUSPECTED') {
    hasSuspectedSwelling = true;
    hazardReasonCodes.push(REASON_CODES.RULE_SAF_002_BATTERY_SWELLING_SUSPECTED);
    hazardsIdentified.push(
      'Suspected battery swelling causing chassis warping or seam delamination',
    );
    containmentInstructions.push(
      'Isolate device in non-flammable staging area pending professional battery assessment.',
    );
  }

  // 2. Thermal & Burn Damage Check
  if (
    req.physicalCondition?.thermalDamage === 'BURNT' ||
    req.physicalCondition?.thermalDamage === 'SCORCHED'
  ) {
    hasThermalDamage = true;
    hazardReasonCodes.push(REASON_CODES.RULE_SAF_003_THERMAL_DAMAGE_DETECTED);
    hazardsIdentified.push(
      'Severe thermal or electrical burn damage (charred chassis / melted components)',
    );
    containmentInstructions.push(
      'De-energize completely; do not connect to AC power. Inspect for persistent internal short circuits.',
    );
  }

  // 3. Chemical Leakage & Toxic Material Check (WEEE Annex VII / EPA SME)
  if (req.physicalCondition?.chemicalHazard === 'BROKEN_MERCURY_LAMP') {
    hasChemicalHazard = true;
    hazardReasonCodes.push(REASON_CODES.RULE_SAF_004_TOXIC_CHEMICAL_EXPOSURE);
    hazardsIdentified.push(
      'Broken CCFL mercury vapor backlight lamp (toxic heavy metal exposure risk)',
    );
    containmentInstructions.push(
      'Use chemical-resistant nitrile gloves and vapor mask. Seal in heavy polyethylene hazmat bag.',
    );
  } else if (req.physicalCondition?.chemicalHazard === 'LEAKING_BATTERY_ELECTROLYTE') {
    hasChemicalHazard = true;
    hazardReasonCodes.push(REASON_CODES.RULE_SAF_004_TOXIC_CHEMICAL_EXPOSURE);
    hazardsIdentified.push(
      'Corrosive battery electrolyte leakage (chemical burn and toxic fume hazard)',
    );
    containmentInstructions.push(
      'Wear nitrile protective gloves. Neutralize electrolyte with approved absorbent and seal in hazmat container.',
    );
  }

  // 4. Overheating Battery Telemetry
  if (req.battery?.thermalBehavior === 'OVERHEATING') {
    hazardsIdentified.push('Battery exhibits active thermal overheating during operation');
    containmentInstructions.push(
      'Do not attempt charging or powering on until cooled and battery is removed.',
    );
  }

  const isHazardous =
    hasConfirmedSwelling || hasSuspectedSwelling || hasThermalDamage || hasChemicalHazard;

  // 5. Compound Hazard Detection
  const distinctHazardCount = [
    hasConfirmedSwelling || hasSuspectedSwelling,
    hasThermalDamage,
    hasChemicalHazard,
  ].filter(Boolean).length;

  if (distinctHazardCount > 1) {
    hazardReasonCodes.push(REASON_CODES.RULE_SAF_005_COMPOUND_HAZARDS_PRESENT);
  }

  // 6. Commercial Value Override Flag
  if (
    isHazardous &&
    ((req.economics?.estimatedMarketValue && req.economics.estimatedMarketValue > 0) ||
      (req.device.ageYears !== undefined && req.device.ageYears <= 4.0) ||
      req.functionalStatus?.powerState === 'POWERS_ON')
  ) {
    hazardReasonCodes.push(REASON_CODES.COMMERCIAL_VALUE_OVERRIDDEN_BY_SAFETY);
  }

  // Determine hazard level
  const hazardLevel = !isHazardous
    ? 'NONE'
    : hasConfirmedSwelling || hasThermalDamage || hasChemicalHazard
      ? 'CRITICAL'
      : 'WARNING';

  return {
    isHazardous,
    safetyAlert: {
      active: isHazardous,
      hazardLevel,
      hazardsIdentified,
      mandatoryContainmentInstructions: containmentInstructions,
    },
    hazardReasonCodes,
    hazardousTransportRestricted: isHazardous,
  };
}
