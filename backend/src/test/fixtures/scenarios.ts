// ============================================================================
// E-CyclePilot: AI-Powered E-Waste Recovery & Circularity Decision Engine
// Acceptance Test Fixtures (ATP-ECP-001 / 21 Standardized Scenarios)
// ============================================================================

export interface ScenarioFixtureMeta {
  testId: string;
  category: string;
  deviceType: string;
  description: string;
  expectedPathway: string;
  dataType: 'SYNTHETIC_DEMO_DATA';
}

export interface ScenarioFixture<T = unknown> {
  meta: ScenarioFixtureMeta;
  payload: T;
}

// ----------------------------------------------------------------------------
// TC-SAF-001: Confirmed Swollen Lithium-Ion Battery
// ----------------------------------------------------------------------------
export const TC_SAF_001_PAYLOAD = {
  device: {
    category: 'LAPTOP',
    brand: 'Razer',
    model: 'Blade 15',
    ageYears: 2.0,
  },
  physicalCondition: {
    chassisIntegrity: 'WARPED',
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
    healthPercentage: 75,
    swellingState: 'CONFIRMED_BULGING',
    thermalBehavior: 'OVERHEATING',
  },
  storage: {
    mediaType: 'NVME_SSD',
    sanitizationState: 'VERIFIED_WIPED',
  },
  economics: {
    estimatedMarketValue: 950.0,
    estimatedRepairCost: 80.0,
  },
};

// ----------------------------------------------------------------------------
// TC-SAF-002: Suspected Battery Swelling / Popped Chassis
// ----------------------------------------------------------------------------
export const TC_SAF_002_PAYLOAD = {
  device: {
    category: 'TABLET',
    brand: 'Apple',
    model: 'iPad Air 3',
    ageYears: 4.5,
  },
  physicalCondition: {
    chassisIntegrity: 'WARPED',
    screenCondition: 'DELAMINATING',
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
    swellingState: 'SUSPECTED',
    thermalBehavior: 'NORMAL',
  },
  storage: {
    mediaType: 'EMMC_SOLDERED',
    sanitizationState: 'ENCRYPTED_LOCKED',
  },
};

// ----------------------------------------------------------------------------
// TC-SAF-003: Severe Thermal Damage / Scorch Marks
// ----------------------------------------------------------------------------
export const TC_SAF_003_PAYLOAD = {
  device: {
    category: 'DESKTOP',
    brand: 'Custom',
    model: 'ATX Tower',
    ageYears: 3.0,
  },
  physicalCondition: {
    chassisIntegrity: 'INTACT',
    screenCondition: 'NOT_APPLICABLE',
    liquidDamage: false,
    thermalDamage: 'BURNT',
    chemicalHazard: 'NONE',
  },
  functionalStatus: {
    powerState: 'NO_POWER',
    bootState: 'DEAD',
    displayState: 'NOT_APPLICABLE',
  },
  battery: {
    present: false,
  },
  storage: {
    mediaType: 'SATA_SSD',
    sanitizationState: 'VERIFIED_WIPED',
  },
};

// ----------------------------------------------------------------------------
// TC-SAF-004: Broken Mercury CCFL Backlight / Chemical Leak
// ----------------------------------------------------------------------------
export const TC_SAF_004_PAYLOAD = {
  device: {
    category: 'LAPTOP',
    brand: 'HP',
    model: 'Pavilion dv6000',
    ageYears: 15.0,
  },
  physicalCondition: {
    chassisIntegrity: 'DAMAGED',
    screenCondition: 'SHATTERED',
    liquidDamage: false,
    thermalDamage: 'NONE',
    chemicalHazard: 'BROKEN_MERCURY_LAMP',
  },
  functionalStatus: {
    powerState: 'NO_POWER',
    bootState: 'DEAD',
    displayState: 'CRACKED_NO_DISPLAY',
  },
  battery: {
    present: false,
  },
  storage: {
    mediaType: 'HDD',
    sanitizationState: 'DAMAGED_PHYSICALLY',
  },
};

// ----------------------------------------------------------------------------
// TC-SAF-005: Compound Hazards (Swollen Battery + Shattered Display)
// ----------------------------------------------------------------------------
export const TC_SAF_005_PAYLOAD = {
  device: {
    category: 'SMARTPHONE',
    brand: 'Samsung',
    model: 'Galaxy S21',
    ageYears: 3.0,
  },
  physicalCondition: {
    chassisIntegrity: 'DAMAGED',
    screenCondition: 'SHATTERED',
    liquidDamage: false,
    thermalDamage: 'NONE',
    chemicalHazard: 'LEAKING_BATTERY_ELECTROLYTE',
  },
  functionalStatus: {
    powerState: 'NO_POWER',
    bootState: 'DEAD',
    displayState: 'CRACKED_NO_DISPLAY',
  },
  battery: {
    present: true,
    swellingState: 'CONFIRMED_BULGING',
    thermalBehavior: 'OVERHEATING',
  },
  storage: {
    mediaType: 'EMMC_SOLDERED',
    sanitizationState: 'DAMAGED_PHYSICALLY',
  },
};

// ----------------------------------------------------------------------------
// TC-SAF-006: 10-Year-Old Device with Battery Swelling (Safety Overriding Age)
// ----------------------------------------------------------------------------
export const TC_SAF_006_PAYLOAD = {
  device: {
    category: 'LAPTOP',
    brand: 'Dell',
    model: 'Latitude E6420',
    ageYears: 10.5,
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
    displayState: 'WORKING',
  },
  battery: {
    present: true,
    swellingState: 'CONFIRMED_BULGING',
    thermalBehavior: 'NORMAL',
  },
  storage: {
    mediaType: 'SATA_SSD',
    sanitizationState: 'VERIFIED_WIPED',
  },
};

// ----------------------------------------------------------------------------
// TC-USE-001: Pristine Modern Operational Laptop
// ----------------------------------------------------------------------------
export const TC_USE_001_PAYLOAD = {
  device: {
    category: 'LAPTOP',
    brand: 'Dell',
    model: 'XPS 13 9310',
    ageYears: 2.2,
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
    healthPercentage: 91,
    swellingState: 'NONE',
    thermalBehavior: 'NORMAL',
  },
  storage: {
    mediaType: 'NVME_SSD',
    sanitizationState: 'VERIFIED_WIPED',
  },
  economics: {
    estimatedMarketValue: 650.0,
  },
};

// ----------------------------------------------------------------------------
// TC-USE-002: Operational Laptop with Unsanitized Sensitive Data
// ----------------------------------------------------------------------------
export const TC_USE_002_PAYLOAD = {
  device: {
    category: 'LAPTOP',
    brand: 'Lenovo',
    model: 'ThinkPad T14',
    ageYears: 2.5,
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
    healthPercentage: 86,
    swellingState: 'NONE',
    thermalBehavior: 'NORMAL',
  },
  storage: {
    mediaType: 'NVME_SSD',
    sanitizationState: 'UNENCRYPTED_DATA_PRESENT',
  },
  economics: {
    estimatedMarketValue: 520.0,
  },
};

// ----------------------------------------------------------------------------
// TC-REP-001: Economically Viable Cracked Display on Smartphone
// ----------------------------------------------------------------------------
export const TC_REP_001_PAYLOAD = {
  device: {
    category: 'SMARTPHONE',
    brand: 'Apple',
    model: 'iPhone 13',
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
    healthPercentage: 87,
    swellingState: 'NONE',
    thermalBehavior: 'NORMAL',
  },
  storage: {
    mediaType: 'EMMC_SOLDERED',
    sanitizationState: 'VERIFIED_WIPED',
  },
  economics: {
    estimatedMarketValue: 280.0,
    estimatedRepairCost: 85.0,
  },
};

// ----------------------------------------------------------------------------
// TC-REP-002: Economically Prohibitive Repair Cost
// ----------------------------------------------------------------------------
export const TC_REP_002_PAYLOAD = {
  device: {
    category: 'LAPTOP',
    brand: 'Acer',
    model: 'Aspire 3',
    ageYears: 4.0,
  },
  physicalCondition: {
    chassisIntegrity: 'DAMAGED',
    screenCondition: 'SHATTERED',
    liquidDamage: false,
    thermalDamage: 'NONE',
    chemicalHazard: 'NONE',
  },
  functionalStatus: {
    powerState: 'POWERS_ON',
    bootState: 'POST_PASS',
    displayState: 'CRACKED_NO_DISPLAY',
  },
  battery: {
    present: true,
    healthPercentage: 65,
    swellingState: 'NONE',
    thermalBehavior: 'NORMAL',
  },
  storage: {
    mediaType: 'SATA_SSD',
    sanitizationState: 'VERIFIED_WIPED',
  },
  economics: {
    estimatedMarketValue: 200.0,
    estimatedRepairCost: 240.0,
    estimatedComponentSalvageValue: 60.0,
  },
};

// ----------------------------------------------------------------------------
// TC-REP-003: Isolated Screen Defect with Missing Repair Quote (Closed Decision A)
// ----------------------------------------------------------------------------
export const TC_REP_003_PAYLOAD = {
  device: {
    category: 'SMARTPHONE',
    brand: 'Google',
    model: 'Pixel 6',
    ageYears: 2.5,
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
    displayState: 'CRACKED_FUNCTIONAL',
  },
  battery: {
    present: true,
    healthPercentage: 82,
    swellingState: 'NONE',
    thermalBehavior: 'NORMAL',
  },
  storage: {
    mediaType: 'EMMC_SOLDERED',
    sanitizationState: 'VERIFIED_WIPED',
  },
  economics: {
    estimatedMarketValue: 190.0,
    estimatedRepairCost: null,
  },
};

// ----------------------------------------------------------------------------
// TC-REF-001: Multi-Point Refurbishment Candidate
// ----------------------------------------------------------------------------
export const TC_REF_001_PAYLOAD = {
  device: {
    category: 'LAPTOP',
    brand: 'HP',
    model: 'EliteBook 840 G6',
    ageYears: 4.1,
  },
  physicalCondition: {
    chassisIntegrity: 'SCRATCHED',
    screenCondition: 'INTACT',
    liquidDamage: false,
    thermalDamage: 'NONE',
    chemicalHazard: 'NONE',
  },
  functionalStatus: {
    powerState: 'POWERS_ON',
    bootState: 'POST_PASS',
    displayState: 'WORKING',
  },
  battery: {
    present: true,
    healthPercentage: 68,
    swellingState: 'NONE',
    thermalBehavior: 'NORMAL',
  },
  storage: {
    mediaType: 'NVME_SSD',
    sanitizationState: 'VERIFIED_WIPED',
  },
  economics: {
    estimatedMarketValue: 260.0,
  },
};

// ----------------------------------------------------------------------------
// TC-CMP-001: Dead Motherboard with High-Value Modular Components
// ----------------------------------------------------------------------------
export const TC_CMP_001_PAYLOAD = {
  device: {
    category: 'DESKTOP',
    brand: 'Custom',
    model: 'Gaming Rig',
    ageYears: 3.0,
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
  battery: {
    present: false,
  },
  modularComponents: [
    {
      name: 'Dedicated GPU (NVIDIA RTX 3060)',
      functional: true,
      salvageValue: 180.0,
    },
    { name: '32GB DDR4 RAM Kit', functional: true, salvageValue: 55.0 },
    { name: '1TB NVMe SSD', functional: true, salvageValue: 45.0 },
  ],
  storage: {
    mediaType: 'NVME_SSD',
    sanitizationState: 'VERIFIED_WIPED',
  },
  economics: {
    estimatedMarketValue: 0.0,
    estimatedComponentSalvageValue: 280.0,
  },
};

// ----------------------------------------------------------------------------
// TC-CMP-002: Dead Board with Zero Modular Parts (Downgrade to Scrap)
// ----------------------------------------------------------------------------
export const TC_CMP_002_PAYLOAD = {
  device: {
    category: 'LAPTOP',
    brand: 'Lenovo',
    model: 'IdeaPad 1',
    ageYears: 4.5,
  },
  physicalCondition: {
    chassisIntegrity: 'CRACKED',
    screenCondition: 'SHATTERED',
    liquidDamage: false,
    thermalDamage: 'NONE',
    chemicalHazard: 'NONE',
  },
  functionalStatus: {
    powerState: 'NO_POWER',
    bootState: 'DEAD',
    displayState: 'CRACKED_NO_DISPLAY',
  },
  battery: {
    present: true,
    healthPercentage: 0,
    swellingState: 'NONE',
    thermalBehavior: 'NORMAL',
  },
  modularComponents: [],
  storage: {
    mediaType: 'EMMC_SOLDERED',
    sanitizationState: 'DAMAGED_PHYSICALLY',
  },
};

// ----------------------------------------------------------------------------
// TC-CMP-003: Modular Components Harvestable with Missing Salvage Prices (Decision C)
// ----------------------------------------------------------------------------
export const TC_CMP_003_PAYLOAD = {
  device: {
    category: 'DESKTOP',
    brand: 'Dell',
    model: 'PowerEdge T30',
    ageYears: 5.0,
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
  battery: {
    present: false,
  },
  modularComponents: [
    { name: '16GB DDR4 ECC RAM', functional: true },
    { name: '500W Modular PSU', functional: true },
  ],
  storage: {
    mediaType: 'NO_STORAGE',
    sanitizationState: 'VERIFIED_WIPED',
  },
};

// ----------------------------------------------------------------------------
// TC-REC-001: Functionally Obsolete Legacy Hardware
// ----------------------------------------------------------------------------
export const TC_REC_001_PAYLOAD = {
  device: {
    category: 'DESKTOP',
    brand: 'Dell',
    model: 'OptiPlex GX270',
    ageYears: 16.0,
  },
  physicalCondition: {
    chassisIntegrity: 'INTACT',
    screenCondition: 'NOT_APPLICABLE',
    liquidDamage: false,
    thermalDamage: 'NONE',
    chemicalHazard: 'NONE',
  },
  functionalStatus: {
    powerState: 'POWERS_ON',
    bootState: 'POST_PASS',
    displayState: 'NOT_APPLICABLE',
  },
  battery: {
    present: false,
  },
  storage: {
    mediaType: 'HDD',
    sanitizationState: 'VERIFIED_WIPED',
  },
  economics: {
    scrapWeightKg: 11.5,
  },
};

// ----------------------------------------------------------------------------
// TC-MIS-001: Complete Absence of Financial Data
// ----------------------------------------------------------------------------
export const TC_MIS_001_PAYLOAD = {
  device: {
    category: 'LAPTOP',
    brand: 'ASUS',
    model: 'ZenBook 14',
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
    healthPercentage: 84,
    swellingState: 'NONE',
    thermalBehavior: 'NORMAL',
  },
  storage: {
    mediaType: 'NVME_SSD',
    sanitizationState: 'VERIFIED_WIPED',
  },
};

// ----------------------------------------------------------------------------
// TC-MIS-002: Missing Battery Health Metric
// ----------------------------------------------------------------------------
export const TC_MIS_002_PAYLOAD = {
  device: {
    category: 'SMARTPHONE',
    brand: 'Motorola',
    model: 'Moto G Power',
    ageYears: 3.5,
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

// ----------------------------------------------------------------------------
// TC-INV-001: Schema Validation Error (Unsupported Device Category)
// ----------------------------------------------------------------------------
export const TC_INV_001_PAYLOAD = {
  device: {
    category: 'MICROWAVE',
    brand: 'Panasonic',
  },
};

// ----------------------------------------------------------------------------
// TC-INV-002: Contradictory Operational Telemetry
// ----------------------------------------------------------------------------
export const TC_INV_002_PAYLOAD = {
  device: {
    category: 'LAPTOP',
    brand: 'Dell',
    ageYears: 2.0,
  },
  functionalStatus: {
    powerState: 'NO_POWER',
    bootState: 'OS_BOOTS',
    displayState: 'WORKING',
  },
};

// ----------------------------------------------------------------------------
// TC-EDG-001: Exact Obsolescence Threshold Boundary (Decision D)
// ----------------------------------------------------------------------------
export const TC_EDG_001_PAYLOAD = {
  device: {
    category: 'DESKTOP',
    brand: 'Lenovo',
    model: 'ThinkCentre',
    ageYears: 10.0,
  },
  physicalCondition: {
    chassisIntegrity: 'INTACT',
    screenCondition: 'NOT_APPLICABLE',
    liquidDamage: false,
    thermalDamage: 'NONE',
    chemicalHazard: 'NONE',
  },
  functionalStatus: {
    powerState: 'POWERS_ON',
    bootState: 'POST_PASS',
    displayState: 'NOT_APPLICABLE',
  },
  battery: {
    present: false,
  },
  storage: {
    mediaType: 'SATA_SSD',
    sanitizationState: 'VERIFIED_WIPED',
  },
};
