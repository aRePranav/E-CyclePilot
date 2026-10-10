# E-CyclePilot

**AI-Powered E-Waste Recovery & Circularity Decision Engine**  
*Give Every Device a Smarter Second Life.*

E-CyclePilot is an open, deterministic decision engine designed to evaluate surplus and end-of-life electronic devices. It maps physical, functional, and electrical telemetry to one of six circularity pathways using strict safety precedence, explainable reason codes, and transparent disclosure of missing evidence.

---

## Circularity Pathways

1. **`SPECIAL_HANDLING`**: Hazardous materials management (swollen batteries, thermal damage, mercury/chemical leaks). *Unconditionally overrides economic resale.*
2. **`REUSE`**: Direct redeployment or resale without physical repair.
3. **`REPAIR`**: Targeted restoration of an isolated modular or physical fault where repair cost $\le 70\%$ of market value.
4. **`REFURBISHMENT`**: Multi-point maintenance (battery replacement, OS re-imaging, cosmetic refresh).
5. **`COMPONENT_RECOVERY`**: Harvesting working modular components (RAM, storage, GPU) from a non-viable host chassis.
6. **`FORMAL_RECYCLING`**: Certified mechanical demanufacturing, shredding, and commodity material recovery for obsolete or unrepairable devices.

---

## Repository Structure

```
D:/E-CyclePilot/
├── .gitignore
├── README.md
├── PROJECT_SPEC.md          # Complete product specification
├── SOP.md                   # Standard operating procedures
├── ACCEPTANCE_TEST_PLAN.md  # 21 acceptance test specifications
├── ARCHITECTURE.md          # Architecture and contract specifications
├── DECISIONS_LOG.md         # Architecture decision records (ADRs)
├── frontend/                # React + Vite + TypeScript web client
└── backend/                 # Node.js + Fastify + TypeScript API service
```

---

## Quickstart

### Prerequisites
- Node.js (v20+ recommended, tested on v24)
- npm (v10+)

### Backend Setup
```bash
cd backend
npm install
npm run build
npm test
npm run dev
```
The backend API runs at `http://localhost:3001`. Health probe: `GET http://localhost:3001/api/v1/health`.

### Frontend Setup
```bash
cd frontend
npm install
npm run build
npm test
npm run dev
```
The frontend client runs at `http://localhost:5173`.

---

## Assessment API Contract

### Overview
- **HTTP Method & Path:** `POST /api/v1/assess`
- **Content-Type:** `application/json`
- **Body Limit:** 64 KB (enforced via Fastify `bodyLimit: 65536`)
- **State Semantics:** Stateless, deterministic evaluation. No background database or LLM invocation.

### Supported Recovery Pathways (Frozen Six Identifiers)
1. `SPECIAL_HANDLING` — Hazardous physical or electrochemical condition requiring immediate containment.
2. `REUSE` — Direct redeployment or resale without hardware repairs.
3. `REPAIR` — Restoration of an isolated defect where estimated repair cost $\le 70\%$ of market value.
4. `REFURBISHMENT` — Multi-point maintenance (battery replacement, cosmetic overhaul, software re-imaging).
5. `COMPONENT_RECOVERY` — Harvesting functional modular subassemblies from an unbootable chassis.
6. `FORMAL_RECYCLING` — Demanufacturing, mechanical shredding, and certified material recovery for obsolete or unrepairable devices.

### Status Codes
| Status Code | Reason | Description |
| :--- | :--- | :--- |
| `200 OK` | Valid Assessment | Payload evaluated successfully through the deterministic 6-stage pipeline. |
| `400 Bad Request` | Validation Failure | Missing required fields, invalid category, or `LOGICAL_CONTRADICTION` (e.g. `NO_POWER` yet `OS_BOOTS`). |
| `403 Forbidden` | Disallowed Origin | Request browser origin not in configured CORS allowlist. Permissive headers withheld. |
| `404 Not Found` | Method Not Allowed | Route not registered for unsupported HTTP methods (e.g. `GET`, `PUT`, `DELETE`). |
| `413 Payload Too Large` | Limit Exceeded | Payload exceeds the 64 KB body limit. |
| `500 Internal Error` | Server Exception | Internal errors return sanitized messages with zero stack traces or file paths leaked. |

### Request Body Schema (`DeviceAssessmentRequest`)
```typescript
interface DeviceAssessmentRequest {
  device: {
    category: 'LAPTOP' | 'SMARTPHONE' | 'DESKTOP' | 'TABLET'; // Required
    brand: string;                                            // Required
    model?: string;
    ageYears: number;                                         // Required (non-negative)
  };
  physicalCondition: {
    chassisIntegrity: 'INTACT' | 'SCRATCHED' | 'WARPED' | 'CRACKED' | 'DAMAGED';
    screenCondition: string;                                  // 'INTACT', 'CRACKED_FUNCTIONAL', etc.
    liquidDamage: boolean;
    thermalDamage: 'NONE' | 'BURNT' | 'SCORCHED';
    chemicalHazard: 'NONE' | 'LEAKING_BATTERY_ELECTROLYTE' | 'BROKEN_MERCURY_LAMP';
  };
  functionalStatus: {
    powerState: 'POWERS_ON' | 'INTERMITTENT' | 'NO_POWER';
    bootState: 'OS_BOOTS' | 'POST_PASS' | 'BOOT_LOOP' | 'DEAD';
    displayState: 'WORKING' | 'CRACKED_FUNCTIONAL' | 'CRACKED_NO_DISPLAY' | 'ARTIFACTS' | 'NOT_APPLICABLE' | 'UNKNOWN';
  };
  battery?: {
    present: boolean;
    healthPercentage?: number | null;                         // 0-100 or null
    swellingState?: 'NONE' | 'SUSPECTED' | 'CONFIRMED_BULGING';
    thermalBehavior?: 'NORMAL' | 'OVERHEATING';
  };
  storage?: {
    mediaType: 'NVME_SSD' | 'SATA_SSD' | 'HDD' | 'EMMC_SOLDERED' | 'REMOVABLE_CARD' | 'NO_STORAGE';
    sanitizationState: 'VERIFIED_WIPED' | 'ENCRYPTED_LOCKED' | 'UNENCRYPTED_DATA_PRESENT' | 'DAMAGED_PHYSICALLY';
  };
  modularComponents?: Array<{
    name: string;
    functional: boolean;
    salvageValue?: number | null;
  }>;
  economics?: {
    estimatedMarketValue?: number | null;
    estimatedRepairCost?: number | null;
    estimatedComponentSalvageValue?: number | null;
    scrapWeightKg?: number | null;
  };
}
```

### Representation of Missing Financial Data
When financial inputs (`estimatedMarketValue`, `estimatedRepairCost`, or component `salvageValue`) are absent or null:
- `financialSummary.status` is set to `"DATA_UNAVAILABLE"`.
- Monetary amounts (`netRepairMargin`, `salvageYieldTotal`, `costRatioPercent`) evaluate to `null`.
- A human-readable advisory is supplied in `financialSummary.notes` explaining that economic viability is unconfirmed pending a quote.
- The machine-readable reason code `MISSING_ECONOMIC_DATA` or `RULE_REP_003_ECONOMIC_FEASIBILITY_UNCONFIRMED` is included in `reasonCodes`.

### Example 1: Valid Direct Reuse (Derived from Synthetic Fixture `TC-USE-001`)
**Request:** `POST /api/v1/assess`
```json
{
  "device": {
    "category": "LAPTOP",
    "brand": "Lenovo",
    "model": "ThinkPad T14 Gen 2",
    "ageYears": 2.5
  },
  "physicalCondition": {
    "chassisIntegrity": "INTACT",
    "screenCondition": "INTACT",
    "liquidDamage": false,
    "thermalDamage": "NONE",
    "chemicalHazard": "NONE"
  },
  "functionalStatus": {
    "powerState": "POWERS_ON",
    "bootState": "OS_BOOTS",
    "displayState": "WORKING"
  },
  "battery": {
    "present": true,
    "healthPercentage": 88,
    "swellingState": "NONE",
    "thermalBehavior": "NORMAL"
  },
  "storage": {
    "mediaType": "NVME_SSD",
    "sanitizationState": "VERIFIED_WIPED"
  },
  "economics": {
    "estimatedMarketValue": 450.0,
    "estimatedRepairCost": 0.0
  }
}
```
**Response:** `HTTP 200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "assessmentId": "ECP-a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-10-10T14:32:00.000Z",
  "primaryPathway": "REUSE",
  "primaryRationale": "Device is fully functional, structurally sound, and within the modern secondary deployment window. Immediate reuse affirmed.",
  "safetyAlert": {
    "active": false,
    "hazardLevel": "NONE",
    "hazardsIdentified": [],
    "mandatoryContainmentInstructions": []
  },
  "complianceFlags": {
    "dataSanitizationRequired": false,
    "hazardousTransportRestricted": false
  },
  "eligiblePathways": [
    "REUSE",
    "REFURBISHMENT"
  ],
  "disqualifiedPathways": [
    "SPECIAL_HANDLING"
  ],
  "disqualificationReasons": {
    "SPECIAL_HANDLING": "No active hazardous materials detected."
  },
  "pathwayComparison": [
    {
      "pathway": "SPECIAL_HANDLING",
      "status": "DISQUALIFIED",
      "score": 0,
      "rationale": "No active hazardous materials detected.",
      "disqualificationReason": "No active hazardous materials detected."
    },
    {
      "pathway": "REUSE",
      "status": "RECOMMENDED",
      "score": 95,
      "rationale": "Primary recommended pathway: Device is fully functional, structurally sound, and within the modern secondary deployment window. Immediate reuse affirmed."
    },
    {
      "pathway": "REPAIR",
      "status": "DISQUALIFIED",
      "score": 0,
      "rationale": "Does not meet mandatory eligibility criteria for this pathway."
    },
    {
      "pathway": "REFURBISHMENT",
      "status": "ELIGIBLE",
      "score": 75,
      "rationale": "Viable secondary alternative based on current telemetry."
    },
    {
      "pathway": "COMPONENT_RECOVERY",
      "status": "DISQUALIFIED",
      "score": 0,
      "rationale": "Does not meet mandatory eligibility criteria for this pathway."
    },
    {
      "pathway": "FORMAL_RECYCLING",
      "status": "DISQUALIFIED",
      "score": 0,
      "rationale": "Does not meet mandatory eligibility criteria for this pathway."
    }
  ],
  "reasonCodes": [
    "RULE_USE_001_FULLY_FUNCTIONAL_PRISTINE"
  ],
  "actionChecklist": [
    "Clean external surfaces and prepare unit for direct redeployment or donation"
  ],
  "harvestManifest": [],
  "financialSummary": {
    "status": "CALCULATED",
    "currency": "USD",
    "estimatedMarketValue": 450,
    "estimatedRepairCost": 0,
    "costRatioPercent": 0,
    "netRepairMargin": 450,
    "salvageYieldTotal": null,
    "notes": "Cost ratio 0.0% is within economic ceiling."
  },
  "uncertaintyWarnings": []
}
```

### Example 2: Component Recovery with Missing Prices (Derived from Synthetic Fixture `TC-CMP-003`)
**Request:** `POST /api/v1/assess`
```json
{
  "device": {
    "category": "DESKTOP",
    "brand": "Dell",
    "model": "PowerEdge T30",
    "ageYears": 5.0
  },
  "physicalCondition": {
    "chassisIntegrity": "INTACT",
    "screenCondition": "NOT_APPLICABLE",
    "liquidDamage": false,
    "thermalDamage": "NONE",
    "chemicalHazard": "NONE"
  },
  "functionalStatus": {
    "powerState": "NO_POWER",
    "bootState": "DEAD",
    "displayState": "NOT_APPLICABLE"
  },
  "battery": {
    "present": false
  },
  "modularComponents": [
    { "name": "16GB DDR4 ECC RAM", "functional": true },
    { "name": "500W Modular PSU", "functional": true }
  ],
  "storage": {
    "mediaType": "NO_STORAGE",
    "sanitizationState": "VERIFIED_WIPED"
  }
}
```
**Response:** `HTTP 200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "assessmentId": "ECP-f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": "2026-10-10T14:35:12.345Z",
  "primaryPathway": "COMPONENT_RECOVERY",
  "primaryRationale": "Mainboard is non-functional, but verified working modular subcomponents can be salvaged to prevent unnecessary silicon waste.",
  "safetyAlert": {
    "active": false,
    "hazardLevel": "NONE",
    "hazardsIdentified": [],
    "mandatoryContainmentInstructions": []
  },
  "complianceFlags": {
    "dataSanitizationRequired": false,
    "hazardousTransportRestricted": false
  },
  "eligiblePathways": [
    "COMPONENT_RECOVERY",
    "FORMAL_RECYCLING"
  ],
  "disqualifiedPathways": [
    "REUSE",
    "REPAIR",
    "REFURBISHMENT",
    "SPECIAL_HANDLING"
  ],
  "disqualificationReasons": {
    "REUSE": "Device cannot power on or boot.",
    "REPAIR": "Catastrophic motherboard failure precludes economic repair.",
    "REFURBISHMENT": "Core logic board is non-functional.",
    "SPECIAL_HANDLING": "No active hazardous materials detected."
  },
  "pathwayComparison": [
    {
      "pathway": "SPECIAL_HANDLING",
      "status": "DISQUALIFIED",
      "score": 0,
      "rationale": "No active hazardous materials detected.",
      "disqualificationReason": "No active hazardous materials detected."
    },
    {
      "pathway": "REUSE",
      "status": "DISQUALIFIED",
      "score": 0,
      "rationale": "Device cannot power on or boot.",
      "disqualificationReason": "Device cannot power on or boot."
    },
    {
      "pathway": "REPAIR",
      "status": "DISQUALIFIED",
      "score": 0,
      "rationale": "Catastrophic motherboard failure precludes economic repair.",
      "disqualificationReason": "Catastrophic motherboard failure precludes economic repair."
    },
    {
      "pathway": "REFURBISHMENT",
      "status": "DISQUALIFIED",
      "score": 0,
      "rationale": "Core logic board is non-functional.",
      "disqualificationReason": "Core logic board is non-functional."
    },
    {
      "pathway": "COMPONENT_RECOVERY",
      "status": "RECOMMENDED",
      "score": 95,
      "rationale": "Primary recommended pathway: Mainboard is non-functional, but verified working modular subcomponents can be salvaged to prevent unnecessary silicon waste."
    },
    {
      "pathway": "FORMAL_RECYCLING",
      "status": "ELIGIBLE",
      "score": 75,
      "rationale": "Viable secondary alternative based on current telemetry."
    }
  ],
  "reasonCodes": [
    "RULE_CMP_001_VALUABLE_MODULAR_COMPONENTS_HARVESTABLE",
    "MISSING_ECONOMIC_DATA"
  ],
  "actionChecklist": [
    "Extract verified functional modular components and log into bench inventory",
    "Route remaining stripped carcass to certified mechanical recycling"
  ],
  "harvestManifest": [
    { "name": "16GB DDR4 ECC RAM", "functional": true },
    { "name": "500W Modular PSU", "functional": true }
  ],
  "financialSummary": {
    "status": "DATA_UNAVAILABLE",
    "currency": "USD",
    "estimatedMarketValue": null,
    "estimatedRepairCost": null,
    "costRatioPercent": null,
    "netRepairMargin": null,
    "salvageYieldTotal": null,
    "notes": "Economic data missing; financial feasibility undetermined."
  },
  "uncertaintyWarnings": []
}
```

### Example 3: Validation Error Response (Derived from Synthetic Fixture `TC-INV-001`)
**Request:** `POST /api/v1/assess`
```json
{
  "device": {
    "category": "MICROWAVE",
    "brand": "Toshiba",
    "ageYears": 1.0
  },
  "physicalCondition": {
    "chassisIntegrity": "INTACT",
    "screenCondition": "INTACT",
    "liquidDamage": false,
    "thermalDamage": "NONE",
    "chemicalHazard": "NONE"
  },
  "functionalStatus": {
    "powerState": "POWERS_ON",
    "bootState": "OS_BOOTS",
    "displayState": "WORKING"
  }
}
```
**Response:** `HTTP 400 Bad Request`
```json
{
  "success": false,
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Invalid device category: MICROWAVE. Supported categories: LAPTOP, SMARTPHONE, DESKTOP, TABLET."
}
```

### Example 4: Logical Contradiction Error (Derived from Synthetic Fixture `TC-INV-002`)
**Request:** `POST /api/v1/assess`
```json
{
  "device": {
    "category": "LAPTOP",
    "brand": "Dell",
    "ageYears": 2.0
  },
  "physicalCondition": {
    "chassisIntegrity": "INTACT",
    "screenCondition": "INTACT",
    "liquidDamage": false,
    "thermalDamage": "NONE",
    "chemicalHazard": "NONE"
  },
  "functionalStatus": {
    "powerState": "NO_POWER",
    "bootState": "OS_BOOTS",
    "displayState": "NOT_APPLICABLE"
  }
}
```
**Response:** `HTTP 400 Bad Request`
```json
{
  "success": false,
  "statusCode": 400,
  "error": "LOGICAL_CONTRADICTION",
  "message": "Contradictory telemetry: device cannot boot OS while powerState is NO_POWER."
}
```

---

## Google Gemini AI Explanation Integration

E-CyclePilot integrates Google's official `@google/genai` SDK and the stable `gemini-3.8-flash` model to provide optional, plain-language technical explanations for completed assessments.

- **Endpoint:** `POST /api/v1/ai/explain`
- **Environment Variable:** `GEMINI_API_KEY` (configured securely on the backend; never exposed to the frontend)
- **Role:** Gemini acts strictly as an **explainer** of the deterministic recommendation, translating technical reason codes, safety alerts, and checklists into accessible technician guidance.
- **Strict Non-Override Invariant:** Gemini never decides, modifies, ranks, or overrides the primary circularity pathway, safety alerts, eligibility determinations, or financial metrics.

---

## Important System Disclaimers & Operational Distinctions

- **Informative Assessment vs. Physical Operations:** An assessment produced by E-CyclePilot is an informative decision recommendation derived deterministically from user-provided physical, functional, and electrical telemetry. It does not perform physical media wiping, hardware repairs, board rework, or mechanical recycling.
- **Data Sanitization Assessment:** The application evaluates whether media sanitization is advised under NIST SP 800-88 Rev. 2 guidance based on user-supplied storage telemetry. It does not execute disk erasure, validate sanitization completion, or generate certificates of data destruction.
- **No Regulatory Certification:** The engine does not issue R2v3, e-Stewards, or UN 3480 transport compliance certificates. Compliance flags serve as operational hazard warnings to prevent unlawful handling.
- **Telemetry Verification:** The engine relies on user-provided telemetry without assuming physical or remote sensor verification.
- **Economic Heuristic:** The 70% repair-cost-to-market-value ceiling is a configurable decision heuristic to prevent net-negative circularity actions, not a legally mandated threshold.

