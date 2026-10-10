// ============================================================================
// E-CyclePilot: AI-Powered E-Waste Recovery & Circularity Decision Engine
// Domain Types & Contracts (@engine/core)
// ============================================================================

// ----------------------------------------------------------------------------
// 1. Circularity Pathways (Frozen Six Identifiers)
// ----------------------------------------------------------------------------
export const CIRCULARITY_PATHWAYS = [
  'SPECIAL_HANDLING',
  'REUSE',
  'REPAIR',
  'REFURBISHMENT',
  'COMPONENT_RECOVERY',
  'FORMAL_RECYCLING',
] as const;

export type CircularityPathway = (typeof CIRCULARITY_PATHWAYS)[number];

// ----------------------------------------------------------------------------
// 2. Telemetry and Physical Attributes
// ----------------------------------------------------------------------------
export const DEVICE_CATEGORIES = ['LAPTOP', 'SMARTPHONE', 'DESKTOP', 'TABLET'] as const;

export type DeviceCategory = (typeof DEVICE_CATEGORIES)[number];

export type PowerState = 'POWERS_ON' | 'INTERMITTENT' | 'NO_POWER';
export type BootState = 'OS_BOOTS' | 'POST_PASS' | 'BOOT_LOOP' | 'DEAD';
export type DisplayState =
  | 'WORKING'
  | 'CRACKED_FUNCTIONAL'
  | 'CRACKED_NO_DISPLAY'
  | 'ARTIFACTS'
  | 'NOT_APPLICABLE'
  | 'UNKNOWN';

export type BatterySwellingState = 'NONE' | 'SUSPECTED' | 'CONFIRMED_BULGING';
export type ThermalBehavior = 'NORMAL' | 'OVERHEATING';

export type StorageMediaType =
  'NVME_SSD' | 'SATA_SSD' | 'HDD' | 'EMMC_SOLDERED' | 'REMOVABLE_CARD' | 'NO_STORAGE';

export type SanitizationState =
  'VERIFIED_WIPED' | 'ENCRYPTED_LOCKED' | 'UNENCRYPTED_DATA_PRESENT' | 'DAMAGED_PHYSICALLY';

export type ThermalDamage = 'NONE' | 'BURNT' | 'SCORCHED';
export type ChemicalHazard = 'NONE' | 'LEAKING_BATTERY_ELECTROLYTE' | 'BROKEN_MERCURY_LAMP';

export type ChassisIntegrity = 'INTACT' | 'SCRATCHED' | 'WARPED' | 'CRACKED' | 'DAMAGED';

// ----------------------------------------------------------------------------
// 3. Modular Components
// ----------------------------------------------------------------------------
export interface ModularComponentItem {
  name: string;
  functional: boolean;
  salvageValue?: number | null;
}

// ----------------------------------------------------------------------------
// 4. Request Payload Contract
// ----------------------------------------------------------------------------
export interface DeviceInfo {
  category: DeviceCategory | string;
  brand: string;
  model?: string;
  ageYears: number;
}

export interface PhysicalCondition {
  chassisIntegrity: ChassisIntegrity | string;
  screenCondition: string;
  liquidDamage: boolean;
  thermalDamage: ThermalDamage | string;
  chemicalHazard: ChemicalHazard | string;
}

export interface FunctionalStatus {
  powerState: PowerState | string;
  bootState: BootState | string;
  displayState: DisplayState | string;
}

export interface BatteryTelemetry {
  present: boolean;
  healthPercentage?: number | null;
  swellingState?: BatterySwellingState | string;
  thermalBehavior?: ThermalBehavior | string;
}

export interface StorageTelemetry {
  mediaType: StorageMediaType | string;
  sanitizationState: SanitizationState | string;
}

export interface EconomicData {
  estimatedMarketValue?: number | null;
  estimatedRepairCost?: number | null;
  estimatedComponentSalvageValue?: number | null;
  scrapWeightKg?: number | null;
}

export interface DeviceAssessmentRequest {
  device: DeviceInfo;
  physicalCondition: PhysicalCondition;
  functionalStatus: FunctionalStatus;
  battery?: BatteryTelemetry;
  storage?: StorageTelemetry;
  modularComponents?: ModularComponentItem[];
  economics?: EconomicData;
}

// ----------------------------------------------------------------------------
// 5. Machine-Readable Reason Codes
// ----------------------------------------------------------------------------
export const REASON_CODES = {
  // Safety Rules (Gate 2)
  RULE_SAF_001_BATTERY_SWELLING_CONFIRMED: 'RULE_SAF_001_BATTERY_SWELLING_CONFIRMED',
  RULE_SAF_002_BATTERY_SWELLING_SUSPECTED: 'RULE_SAF_002_BATTERY_SWELLING_SUSPECTED',
  RULE_SAF_003_THERMAL_DAMAGE_DETECTED: 'RULE_SAF_003_THERMAL_DAMAGE_DETECTED',
  RULE_SAF_004_TOXIC_CHEMICAL_EXPOSURE: 'RULE_SAF_004_TOXIC_CHEMICAL_EXPOSURE',
  RULE_SAF_005_COMPOUND_HAZARDS_PRESENT: 'RULE_SAF_005_COMPOUND_HAZARDS_PRESENT',

  // Reuse Rules (Gate 4)
  RULE_USE_001_FULLY_FUNCTIONAL_PRISTINE: 'RULE_USE_001_FULLY_FUNCTIONAL_PRISTINE',

  // Repair Rules (Gate 4 & 5)
  RULE_REP_001_ISOLATED_DEFECT_ECONOMICALLY_VIABLE:
    'RULE_REP_001_ISOLATED_DEFECT_ECONOMICALLY_VIABLE',
  RULE_REP_002_REPAIR_COST_EXCEEDS_THRESHOLD: 'RULE_REP_002_REPAIR_COST_EXCEEDS_THRESHOLD',
  RULE_REP_003_ECONOMIC_FEASIBILITY_UNCONFIRMED: 'RULE_REP_003_ECONOMIC_FEASIBILITY_UNCONFIRMED',

  // Refurbishment Rules (Gate 4)
  RULE_REF_001_MULTI_POINT_MAINTENANCE_REQUIRED: 'RULE_REF_001_MULTI_POINT_MAINTENANCE_REQUIRED',
  RULE_REF_002_BATTERY_METRIC_UNKNOWN_AGE_INTERMEDIATE:
    'RULE_REF_002_BATTERY_METRIC_UNKNOWN_AGE_INTERMEDIATE',

  // Component Recovery Rules (Gate 4)
  RULE_CMP_001_VALUABLE_MODULAR_COMPONENTS_HARVESTABLE:
    'RULE_CMP_001_VALUABLE_MODULAR_COMPONENTS_HARVESTABLE',

  // Formal Recycling Rules (Gate 4)
  RULE_REC_001_ARCHITECTURAL_OBSOLESCENCE: 'RULE_REC_001_ARCHITECTURAL_OBSOLESCENCE',
  RULE_REC_002_NO_HARVESTABLE_COMPONENTS_DOWNGRADE:
    'RULE_REC_002_NO_HARVESTABLE_COMPONENTS_DOWNGRADE',
  RULE_REC_003_UNCLASSIFIED_EVALUATION_FALLBACK: 'RULE_REC_003_UNCLASSIFIED_EVALUATION_FALLBACK',

  // Secondary Decision Flags
  COMMERCIAL_VALUE_OVERRIDDEN_BY_SAFETY: 'COMMERCIAL_VALUE_OVERRIDDEN_BY_SAFETY',
  DATA_SANITIZATION_REQUIRED: 'DATA_SANITIZATION_REQUIRED',
  MISSING_ECONOMIC_DATA: 'MISSING_ECONOMIC_DATA',
  UNKNOWN_BATTERY_METRIC: 'UNKNOWN_BATTERY_METRIC',
} as const;

export type ReasonCode = (typeof REASON_CODES)[keyof typeof REASON_CODES] | string;

// ----------------------------------------------------------------------------
// 6. Response Payload Contract
// ----------------------------------------------------------------------------
export type PathwayStatus = 'RECOMMENDED' | 'ELIGIBLE' | 'DISQUALIFIED';

export interface PathwayComparisonItem {
  pathway: CircularityPathway;
  status: PathwayStatus;
  score: number;
  rationale: string;
  disqualificationReason?: string;
}

export type FinancialSummaryStatus = 'CALCULATED' | 'DATA_UNAVAILABLE';

export interface FinancialSummary {
  status: FinancialSummaryStatus;
  currency: string;
  estimatedMarketValue: number | null;
  estimatedRepairCost: number | null;
  costRatioPercent: number | null;
  netRepairMargin: number | null;
  salvageYieldTotal: number | null;
  notes: string;
}

export type HazardLevel = 'NONE' | 'WARNING' | 'CRITICAL';

export interface SafetyAlert {
  active: boolean;
  hazardLevel: HazardLevel;
  hazardsIdentified: string[];
  mandatoryContainmentInstructions: string[];
}

export interface ComplianceFlags {
  dataSanitizationRequired: boolean;
  hazardousTransportRestricted: boolean;
}

export interface DisqualificationReasons {
  REUSE?: string;
  REPAIR?: string;
  REFURBISHMENT?: string;
  COMPONENT_RECOVERY?: string;
  FORMAL_RECYCLING?: string;
  SPECIAL_HANDLING?: string;
  [key: string]: string | undefined;
}

export interface DeviceAssessmentResponse {
  assessmentId: string;
  timestamp: string;
  primaryPathway: CircularityPathway;
  primaryRationale: string;
  safetyAlert: SafetyAlert;
  complianceFlags: ComplianceFlags;
  eligiblePathways: CircularityPathway[];
  disqualifiedPathways: CircularityPathway[];
  disqualificationReasons?: DisqualificationReasons;
  pathwayComparison: PathwayComparisonItem[];
  reasonCodes: string[];
  actionChecklist: string[];
  harvestManifest?: ModularComponentItem[];
  financialSummary: FinancialSummary;
  uncertaintyWarnings: string[];
}

// ----------------------------------------------------------------------------
// 7. Configurable Engine Options Contract
// ----------------------------------------------------------------------------
export interface EngineOptions {
  /**
   * Configurable repair-cost-to-market-value threshold heuristic.
   * Default: 0.70 (70.0%).
   */
  repairCostThresholdRatio?: number;
  /**
   * Configurable device age boundary in years for obsolescence.
   * Default: 10.0 years.
   */
  obsolescenceAgeYears?: number;
  /**
   * Battery health percentage below which refresh is required.
   * Default: 80%.
   */
  batteryHealthDegradedThreshold?: number;
}

export const DEFAULT_ENGINE_OPTIONS: Required<EngineOptions> = {
  repairCostThresholdRatio: 0.7,
  obsolescenceAgeYears: 10.0,
  batteryHealthDegradedThreshold: 80,
};

// ----------------------------------------------------------------------------
// 8. Error and Result Contracts
// ----------------------------------------------------------------------------
export type EngineErrorType = 'BAD_REQUEST' | 'LOGICAL_CONTRADICTION' | string;

export interface EngineErrorResponse {
  success: false;
  statusCode: 400;
  error: EngineErrorType;
  message: string;
  details?: Record<string, unknown>;
}

export interface EngineSuccessResult extends DeviceAssessmentResponse {
  success: true;
  statusCode: 200;
}

export type AssessmentResult = EngineSuccessResult | EngineErrorResponse;

export class EngineValidationError extends Error {
  public readonly statusCode: number = 400;
  public readonly error: EngineErrorType;
  public readonly details?: Record<string, unknown>;

  constructor(error: EngineErrorType, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'EngineValidationError';
    this.error = error;
    this.details = details;
    Object.setPrototypeOf(this, EngineValidationError.prototype);
  }
}
