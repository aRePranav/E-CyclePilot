// ============================================================================
// E-CyclePilot Frontend Domain Types & API Contracts
// Synchronized with backend @engine/core contracts
// ============================================================================

export const CIRCULARITY_PATHWAYS = [
  'SPECIAL_HANDLING',
  'REUSE',
  'REPAIR',
  'REFURBISHMENT',
  'COMPONENT_RECOVERY',
  'FORMAL_RECYCLING',
] as const;

export type CircularityPathway = (typeof CIRCULARITY_PATHWAYS)[number];

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

export interface ModularComponentItem {
  name: string;
  functional: boolean;
  salvageValue?: number | null;
}

export interface DeviceInfo {
  category: DeviceCategory;
  brand: string;
  model?: string;
  ageYears: number;
}

export interface PhysicalCondition {
  chassisIntegrity: ChassisIntegrity;
  screenCondition: string;
  liquidDamage: boolean;
  thermalDamage: ThermalDamage;
  chemicalHazard: ChemicalHazard;
}

export interface FunctionalStatus {
  powerState: PowerState;
  bootState: BootState;
  displayState: DisplayState;
}

export interface BatteryTelemetry {
  present: boolean;
  healthPercentage?: number | null;
  swellingState?: BatterySwellingState;
  thermalBehavior?: ThermalBehavior;
}

export interface StorageTelemetry {
  mediaType: StorageMediaType;
  sanitizationState: SanitizationState;
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

export interface DeviceAssessmentResponse {
  success?: boolean;
  statusCode?: number;
  assessmentId: string;
  timestamp: string;
  primaryPathway: CircularityPathway;
  primaryRationale: string;
  safetyAlert: SafetyAlert;
  complianceFlags: ComplianceFlags;
  eligiblePathways: CircularityPathway[];
  disqualifiedPathways: CircularityPathway[];
  disqualificationReasons?: Record<string, string | undefined>;
  pathwayComparison: PathwayComparisonItem[];
  reasonCodes: string[];
  actionChecklist: string[];
  harvestManifest?: ModularComponentItem[];
  financialSummary: FinancialSummary;
  uncertaintyWarnings: string[];
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string;
}

export interface AiExplanationSuccessResponse {
  success: true;
  explanation: string;
}

export interface AiExplanationErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string;
}

export type AiExplanationResponse = AiExplanationSuccessResponse | AiExplanationErrorResponse;
