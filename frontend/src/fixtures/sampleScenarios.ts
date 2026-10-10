// ============================================================================
// E-CyclePilot Synthetic Sample Scenarios
// Grounded strictly in test acceptance fixtures (ATP-ECP-001)
// Labeled explicitly as synthetic assessment scenarios, not real inspections.
// ============================================================================

import type { DeviceAssessmentRequest } from '../types/assessment';

export interface SampleScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  expectedPathway: string;
  payload: DeviceAssessmentRequest;
}

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: 'hazardous-battery',
    name: 'Hazardous Device (Swollen Battery)',
    category: 'SPECIAL_HANDLING',
    description:
      'Synthetic scenario TC-SAF-001: Confirmed bulging lithium battery with overheating. Demonstrates unconditional safety precedence over economic resale.',
    expectedPathway: 'SPECIAL_HANDLING',
    payload: {
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
    },
  },
  {
    id: 'pristine-reuse',
    name: 'Pristine Device (Direct Reuse)',
    category: 'REUSE',
    description:
      'Synthetic scenario TC-USE-001: Fully functional modern laptop with healthy battery and verified wiped storage. Qualifies for direct reuse.',
    expectedPathway: 'REUSE',
    payload: {
      device: {
        category: 'LAPTOP',
        brand: 'Lenovo',
        model: 'ThinkPad T14 Gen 2',
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
        healthPercentage: 88,
        swellingState: 'NONE',
        thermalBehavior: 'NORMAL',
      },
      storage: {
        mediaType: 'NVME_SSD',
        sanitizationState: 'VERIFIED_WIPED',
      },
      economics: {
        estimatedMarketValue: 450.0,
        estimatedRepairCost: 0.0,
      },
    },
  },
  {
    id: 'viable-repair',
    name: 'Economically Viable Repair',
    category: 'REPAIR',
    description:
      'Synthetic scenario TC-REP-001: Isolated screen fracture where repair cost ($85) is 30.4% of market value ($280), well within the 70% threshold.',
    expectedPathway: 'REPAIR',
    payload: {
      device: {
        category: 'LAPTOP',
        brand: 'Dell',
        model: 'Latitude 5420',
        ageYears: 2.8,
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
        healthPercentage: 85,
        swellingState: 'NONE',
        thermalBehavior: 'NORMAL',
      },
      storage: {
        mediaType: 'NVME_SSD',
        sanitizationState: 'VERIFIED_WIPED',
      },
      economics: {
        estimatedMarketValue: 280.0,
        estimatedRepairCost: 85.0,
      },
    },
  },
  {
    id: 'refurbishment-candidate',
    name: 'Refurbishment Candidate',
    category: 'REFURBISHMENT',
    description:
      'Synthetic scenario TC-REF-001: Operational laptop requiring battery refresh (<70% health), cosmetic reconditioning, and OS imaging.',
    expectedPathway: 'REFURBISHMENT',
    payload: {
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
        estimatedMarketValue: 210.0,
        estimatedRepairCost: 0.0,
      },
    },
  },
  {
    id: 'component-recovery-unpriced',
    name: 'Component Recovery (Unpriced Parts)',
    category: 'COMPONENT_RECOVERY',
    description:
      'Synthetic scenario TC-CMP-003: Unbootable desktop board with verified working modular RAM and power supply with missing market salvage quotes.',
    expectedPathway: 'COMPONENT_RECOVERY',
    payload: {
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
    },
  },
  {
    id: 'formal-recycling-obsolete',
    name: 'Formal Recycling (Legacy Hardware)',
    category: 'FORMAL_RECYCLING',
    description:
      'Synthetic scenario TC-REC-001: 16-year-old legacy desktop exceeding the 10-year obsolescence ceiling, routed for certified mechanical recycling.',
    expectedPathway: 'FORMAL_RECYCLING',
    payload: {
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
    },
  },
];
