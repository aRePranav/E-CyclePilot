# E-CyclePilot Assessment API Reference

**Endpoint:** `POST /api/v1/assess`  
**Protocol:** HTTP/1.1 or HTTP/2 over TLS / JSON  
**Service:** E-CyclePilot Core Backend (`fastify`)  

---

## 1. Overview & Operational Model

The Assessment API provides an automated, deterministic evaluation entrypoint for surplus and end-of-life electronic equipment. It accepts physical, functional, and electrical telemetry and applies an explainable 6-stage decision pipeline to recommend a single primary circularity pathway, catalog secondary eligible options, detail disqualifications, identify mandatory containment alerts, and output audit reason codes.

- **Stateless:** Every evaluation is isolated and derived strictly from the submitted request payload.
- **Deterministic:** The evaluation is powered by a pure TypeScript expert rule engine without stochastic generative AI or third-party cloud database calls.
- **Request Size Enforcement:** Fastify enforces a 64 KB maximum payload limit (`bodyLimit: 65536`) to mitigate resource exhaustion.

---

## 2. Recovery Pathways (Frozen Identifiers)

The engine maps all evaluations into exactly one primary pathway from the frozen circularity taxonomy:

1. **`SPECIAL_HANDLING`**: Hazardous materials management (swollen/bulging lithium-ion cells, thermal scorch/burn damage, chemical/electrolyte leakage). Unconditionally overrides all commercial resale or repair considerations under UN 3480 / UN 3481 hazardous transport restrictions.
2. **`REUSE`**: Direct redeployment or resale without hardware repairs. Applies to pristine, fully functional devices within the modern operational window.
3. **`REPAIR`**: Targeted restoration of an isolated modular or physical fault where estimated repair cost $\le 70\%$ of market value.
4. **`REFURBISHMENT`**: Multi-point maintenance (battery replacement for degraded runtime, cosmetic overhaul, software re-imaging) for units requiring intermediate refresh.
5. **`COMPONENT_RECOVERY`**: Harvesting working modular components (RAM, storage, GPU, modular PSU) from a non-viable or unbootable host chassis.
6. **`FORMAL_RECYCLING`**: Certified mechanical demanufacturing, shredding, and commodity material recovery for obsolete ($\ge 10.0$ years) or unrepairable devices with zero salvageable parts.

---

## 3. Status Codes & Error Semantics

| HTTP Status | Error Type / Code | Description |
| :--- | :--- | :--- |
| `200 OK` | N/A | Evaluation completed successfully. Returns full `DeviceAssessmentResponse`. |
| `400 Bad Request` | `BAD_REQUEST` | Missing required fields, unsupported device category, malformed JSON, or non-object payload. |
| `400 Bad Request` | `LOGICAL_CONTRADICTION` | Contradictory physical/functional telemetry (e.g. `powerState: NO_POWER` combined with `bootState: OS_BOOTS` or `POST_PASS`). |
| `403 Forbidden` | `Forbidden` | Request browser origin not in configured CORS allowlist. Permissive headers withheld. |
| `404 Not Found` | N/A | Unsupported HTTP methods (`GET`, `PUT`, `DELETE`, `PATCH`). |
| `413 Payload Too Large` | `FST_ERR_CTP_BODY_TOO_LARGE` | Request payload exceeds the 64 KB (`65536` bytes) payload limit. |
| `500 Internal Error` | `Internal Server Error` | Unhandled server exception. Response is sanitized; stack traces and server file paths are never disclosed. |

---

## 4. Request Contract: `DeviceAssessmentRequest`

```typescript
export interface DeviceAssessmentRequest {
  device: {
    category: 'LAPTOP' | 'SMARTPHONE' | 'DESKTOP' | 'TABLET'; // Required
    brand: string;                                            // Required
    model?: string;                                           // Optional
    ageYears: number;                                         // Required (>= 0.0)
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

---

## 5. Response Contract: `DeviceAssessmentResponse`

When successful, the API returns HTTP 200 with `success: true`, `statusCode: 200`, and the complete decision payload:

```typescript
export interface DeviceAssessmentResponse {
  success: true;
  statusCode: 200;
  assessmentId: string; // Unique runtime assessment ID: ECP-<randomUUID>
  timestamp: string;    // Runtime ISO 8601 UTC timestamp: YYYY-MM-DDTHH:mm:ss.sssZ
  primaryPathway: 'SPECIAL_HANDLING' | 'REUSE' | 'REPAIR' | 'REFURBISHMENT' | 'COMPONENT_RECOVERY' | 'FORMAL_RECYCLING';
  primaryRationale: string;
  safetyAlert: {
    active: boolean;
    hazardLevel: 'NONE' | 'WARNING' | 'CRITICAL';
    hazardsIdentified: string[];
    mandatoryContainmentInstructions: string[];
  };
  complianceFlags: {
    dataSanitizationRequired: boolean;
    hazardousTransportRestricted: boolean;
  };
  eligiblePathways: CircularityPathway[];
  disqualifiedPathways: CircularityPathway[];
  disqualificationReasons?: Record<string, string>;
  pathwayComparison: Array<{
    pathway: CircularityPathway;
    status: 'RECOMMENDED' | 'ELIGIBLE' | 'DISQUALIFIED';
    score: number;
    rationale: string;
    disqualificationReason?: string;
  }>;
  reasonCodes: string[];
  actionChecklist: string[];
  harvestManifest?: Array<{
    name: string;
    functional: boolean;
    salvageValue?: number | null;
  }>;
  financialSummary: {
    status: 'CALCULATED' | 'DATA_UNAVAILABLE';
    currency: string;
    estimatedMarketValue: number | null;
    estimatedRepairCost: number | null;
    costRatioPercent: number | null;
    netRepairMargin: number | null;
    salvageYieldTotal: number | null;
    notes: string;
  };
  uncertaintyWarnings: string[];
}
```

---

## 6. Representation of Missing Financial Data

When financial inputs (`estimatedMarketValue`, `estimatedRepairCost`, or component `salvageValue`) are missing or null:
- `financialSummary.status` is set to `"DATA_UNAVAILABLE"`.
- Monetary amounts (`netRepairMargin`, `salvageYieldTotal`, `costRatioPercent`) evaluate to `null`.
- A human-readable advisory is supplied in `financialSummary.notes` explaining that economic viability is unconfirmed pending a quote.
- The machine-readable reason code `MISSING_ECONOMIC_DATA` or `RULE_REP_003_ECONOMIC_FEASIBILITY_UNCONFIRMED` is included in `reasonCodes`.

---

## 7. Concrete Payload Examples (Synthetic Acceptance Scenarios)

### Example A: Direct Reuse (Synthetic Fixture `TC-USE-001`)
**Request:**
```http
POST /api/v1/assess HTTP/1.1
Host: localhost:3001
Content-Type: application/json

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

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

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

---

### Example B: Critical Safety Hazard Override (Synthetic Fixture `TC-SAF-001`)
**Request:**
```http
POST /api/v1/assess HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "device": {
    "category": "LAPTOP",
    "brand": "Razer",
    "model": "Blade 15",
    "ageYears": 2.0
  },
  "physicalCondition": {
    "chassisIntegrity": "WARPED",
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
    "healthPercentage": 75,
    "swellingState": "CONFIRMED_BULGING",
    "thermalBehavior": "OVERHEATING"
  },
  "storage": {
    "mediaType": "NVME_SSD",
    "sanitizationState": "VERIFIED_WIPED"
  },
  "economics": {
    "estimatedMarketValue": 950.0,
    "estimatedRepairCost": 80.0
  }
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "success": true,
  "statusCode": 200,
  "assessmentId": "ECP-f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": "2026-10-10T14:35:12.345Z",
  "primaryPathway": "SPECIAL_HANDLING",
  "primaryRationale": "Hazardous condition detected. Device requires fire suppression or hazmat containment prior to any handling or processing.",
  "safetyAlert": {
    "active": true,
    "hazardLevel": "CRITICAL",
    "hazardsIdentified": [
      "Lithium-ion battery confirmed bulging / mechanical distortion",
      "Thermal runaway risk: active overheating reported"
    ],
    "mandatoryContainmentInstructions": [
      "Quarantine unit immediately in a fire-rated, non-conductive sand bucket or LiPo safety container",
      "Do NOT connect AC power, charger, or USB peripheral",
      "Restricted under UN 3480 / UN 3481 hazardous transport regulations (ground-only, hazmat courier)"
    ]
  },
  "complianceFlags": {
    "dataSanitizationRequired": false,
    "hazardousTransportRestricted": true
  },
  "eligiblePathways": [
    "SPECIAL_HANDLING"
  ],
  "disqualifiedPathways": [
    "REUSE",
    "REPAIR",
    "REFURBISHMENT",
    "COMPONENT_RECOVERY",
    "FORMAL_RECYCLING"
  ],
  "disqualificationReasons": {
    "REUSE": "Safety hazard present; commercial reuse is prohibited under UN 3480/3481 regulations.",
    "REPAIR": "Standard repair cannot proceed while active hazmat or thermal runaway risk is uncontained.",
    "REFURBISHMENT": "Refurbishment facility cannot accept uncontained hazmat devices.",
    "COMPONENT_RECOVERY": "Component extraction prohibited until hazardous fractions are professionally decommissioned.",
    "FORMAL_RECYCLING": "Device must not be fed into standard shredding lines until hazmat containment is complete."
  },
  "pathwayComparison": [
    {
      "pathway": "SPECIAL_HANDLING",
      "status": "RECOMMENDED",
      "score": 95,
      "rationale": "Primary recommended pathway: Hazardous condition detected. Device requires fire suppression or hazmat containment prior to any handling or processing."
    },
    {
      "pathway": "REUSE",
      "status": "DISQUALIFIED",
      "score": 0,
      "rationale": "Safety hazard present; commercial reuse is prohibited under UN 3480/3481 regulations.",
      "disqualificationReason": "Safety hazard present; commercial reuse is prohibited under UN 3480/3481 regulations."
    },
    {
      "pathway": "REPAIR",
      "status": "DISQUALIFIED",
      "score": 0,
      "rationale": "Standard repair cannot proceed while active hazmat or thermal runaway risk is uncontained.",
      "disqualificationReason": "Standard repair cannot proceed while active hazmat or thermal runaway risk is uncontained."
    },
    {
      "pathway": "REFURBISHMENT",
      "status": "DISQUALIFIED",
      "score": 0,
      "rationale": "Refurbishment facility cannot accept uncontained hazmat devices.",
      "disqualificationReason": "Refurbishment facility cannot accept uncontained hazmat devices."
    },
    {
      "pathway": "COMPONENT_RECOVERY",
      "status": "DISQUALIFIED",
      "score": 0,
      "rationale": "Component extraction prohibited until hazardous fractions are professionally decommissioned.",
      "disqualificationReason": "Component extraction prohibited until hazardous fractions are professionally decommissioned."
    },
    {
      "pathway": "FORMAL_RECYCLING",
      "status": "DISQUALIFIED",
      "score": 0,
      "rationale": "Device must not be fed into standard shredding lines until hazmat containment is complete.",
      "disqualificationReason": "Device must not be fed into standard shredding lines until hazmat containment is complete."
    }
  ],
  "reasonCodes": [
    "RULE_SAF_001_BATTERY_SWELLING_CONFIRMED",
    "COMMERCIAL_VALUE_OVERRIDDEN_BY_SAFETY"
  ],
  "actionChecklist": [
    "Quarantine unit immediately in a fire-rated, non-conductive sand bucket or LiPo safety container",
    "Do NOT connect AC power, charger, or USB peripheral",
    "Restricted under UN 3480 / UN 3481 hazardous transport regulations (ground-only, hazmat courier)"
  ],
  "harvestManifest": [],
  "financialSummary": {
    "status": "CALCULATED",
    "currency": "USD",
    "estimatedMarketValue": 950,
    "estimatedRepairCost": 80,
    "costRatioPercent": 8.4,
    "netRepairMargin": 870,
    "salvageYieldTotal": null,
    "notes": "Cost ratio 8.4% is within economic ceiling."
  },
  "uncertaintyWarnings": []
}
```

---

### Example C: Logical Contradiction Input Error (Synthetic Fixture `TC-INV-002`)
**Request:**
```http
POST /api/v1/assess HTTP/1.1
Host: localhost:3001
Content-Type: application/json

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

**Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{
  "success": false,
  "statusCode": 400,
  "error": "LOGICAL_CONTRADICTION",
  "message": "Contradictory telemetry: device cannot boot OS while powerState is NO_POWER."
}
```

---

## 8. Regulatory & Technical Scope Disclaimers

1. **Assessment vs. Physical Operations:** This API generates an informational circularity assessment. It does not perform physical data sanitization, test motherboard circuitry, repair displays, harvest silicon components, or process mechanical scrap.
2. **Data Sanitization Assessment:** Flags advising data sanitization are guided by NIST SP 800-88 Rev. 2 recommendations based on storage metadata. The API does not wipe storage media, verify sanitization execution, or issue sanitization certificates.
3. **No Compliance Certification:** Returning `FORMAL_RECYCLING` or `SPECIAL_HANDLING` does not constitute an R2v3, e-Stewards, or hazardous materials transport certification. It guides handler safety and facility routing.
4. **Unverified Telemetry:** Recommendations reflect the telemetry supplied by the user/caller. The engine does not verify claims against hardware sensors or third-party registries.

---

## 9. AI Assessment Explanation (`POST /api/v1/ai/explain`)

**Endpoint:** `POST /api/v1/ai/explain`
**Model:** `gemini-3.8-flash` via official Google GenAI SDK (`@google/genai`)
**Authorization:** Server-side API key (`process.env.GEMINI_API_KEY`)

An optional companion endpoint that generates a plain-language technical explanation of a completed assessment recommendation.

> [!IMPORTANT]
> **Strict Non-Override Invariant:** Gemini acts exclusively as an *explainer*. It **never** decides, modifies, ranks, or overrides the deterministic engine's primary pathway, safety classifications, eligibility matrices, financial figures, or assessment IDs. The deterministic engine decision is authoritative and final.

### Request Payload
```json
{
  "primaryPathway": "REUSE",
  "primaryRationale": "Device is fully functional, structurally sound, and within the modern secondary deployment window.",
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
  "actionChecklist": ["Clean external surfaces and prepare unit for direct redeployment"],
  "reasonCodes": ["RULE_USE_001_FULLY_FUNCTIONAL_PRISTINE"],
  "financialSummary": {
    "status": "CALCULATED",
    "currency": "USD",
    "estimatedMarketValue": 450.0,
    "estimatedRepairCost": 0.0,
    "costRatioPercent": 0.0,
    "netRepairMargin": 450.0,
    "salvageYieldTotal": null,
    "notes": "Cost ratio 0.0% is within economic ceiling."
  },
  "assessmentId": "ECP-a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Success Response (`200 OK`)
```json
{
  "success": true,
  "explanation": "### Circularity Decision\nThe device was assigned to **REUSE** because all hardware sub-systems are fully intact and functional...\n\n### Safety & Handling Guidance\nZero active thermal, battery, or chemical hazards detected...\n\n### Operational Next Steps\n1. Perform surface sanitization...\n2. Package unit for direct redeployment."
}
```

### Error Responses
- `400 Bad Request`: Invalid pathway, malformed structure, or payload length exceeding limits.
- `413 Payload Too Large`: Body exceeds 32 KB route size limit.
- `429 Too Many Requests`: Client request rate limit exceeded (includes `Retry-After` header).
- `503 Service Unavailable`: `GEMINI_API_KEY` is not configured on the server.
- `504 Gateway Timeout`: AI provider timed out (12s threshold).
- `502 Bad Gateway`: AI provider communication failure or empty response.
