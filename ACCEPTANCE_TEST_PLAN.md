# ACCEPTANCE TEST PLAN: E-CYCLEPILOT AI
**Project:** E-CyclePilot AI: E-Waste Recovery & Circularity Decision Engine  
**Document Code:** ATP-ECP-001  
**Version:** 2.0.0 (Specification Lock)  
**Test Suite Target:** 100% Pass Rate in Vitest (21 of 21 Test Cases)  

---

## 1. Test Strategy & Guiding Principles

The E-CyclePilot AI test strategy enforces the core product principles:
1. **Safety Dominance:** Hazardous conditions must trigger `SPECIAL_HANDLING` regardless of economic value, device age, or operational status.
2. **Strict Determinism:** Identical input payloads must produce identical outputs, reason codes, and actions.
3. **Zero Hallucination:** Missing economic or telemetry data must produce explicit `DATA_UNAVAILABLE` indicators, never fabricated numbers.
4. **Validation Rigor:** Malformed, out-of-range, or contradictory payloads must be rejected with clean, descriptive validation errors.

---

## 2. Test Cases Overview Matrix

| Test ID | Category | Device Type | Core Test Focus | Expected Pathway / Result |
| :--- | :--- | :--- | :--- | :--- |
| **TC-SAF-001** | Safety Hazard | Modern Laptop | Confirmed swollen lithium-ion battery pouch | `SPECIAL_HANDLING` |
| **TC-SAF-002** | Safety Hazard | Tablet | Suspected swelling / popped screen chassis | `SPECIAL_HANDLING` |
| **TC-SAF-003** | Safety Hazard | Desktop PC | Severe thermal damage / burnt power socket | `SPECIAL_HANDLING` |
| **TC-SAF-004** | Safety Hazard | Legacy Laptop | Cracked mercury CCFL backlight / chemical leak | `SPECIAL_HANDLING` |
| **TC-SAF-005** | Safety Hazard | Smartphone | Compound hazard: swollen battery + cracked display | `SPECIAL_HANDLING` |
| **TC-SAF-006** | Safety Invariance| Obsolete Laptop | 10.5-year-old device with battery swelling (safety overrides age) | `SPECIAL_HANDLING` |
| **TC-USE-001** | Normal / Reuse | Ultrabook | 2-year-old pristine functional laptop, wiped drive | `REUSE` |
| **TC-USE-002** | Privacy / Reuse | Enterprise Laptop | Operational laptop with un-wiped sensitive data | `REUSE` + `dataSanitizationRequired = true` |
| **TC-REP-001** | Viable Repair | Smartphone | Cracked screen, viable repair cost (30.4% ratio $\le 70\%$) | `REPAIR` |
| **TC-REP-002** | Economic Ceiling | Budget Laptop | Broken screen, repair cost exceeds 70% market value (120%) | `COMPONENT_RECOVERY` (Downgraded) |
| **TC-REP-003** | Missing Quote | Smartphone | Broken screen, missing repair quote (Decision A) | `REPAIR` + `ECONOMIC_FEASIBILITY_UNCONFIRMED` |
| **TC-REF-001** | Refurbishment | Business Laptop | Scuffed casing, battery < 70%, functional board | `REFURBISHMENT` |
| **TC-CMP-001** | Harvest / Parts | Desktop Tower | Dead motherboard, working modular GPU/RAM/SSD with prices | `COMPONENT_RECOVERY` |
| **TC-CMP-002** | Harvest Fallback | Budget Netbook | Dead motherboard, all soldered parts, zero modular | `FORMAL_RECYCLING` (Downgraded) |
| **TC-CMP-003** | Missing Prices | Desktop Tower | Dead motherboard, working parts, missing prices (Decision C) | `COMPONENT_RECOVERY` + `DATA_UNAVAILABLE` |
| **TC-REC-001** | Formal Recycling | Legacy Desktop | 16-year-old functional Pentium 4, obsolete vintage | `FORMAL_RECYCLING` |
| **TC-MIS-001** | Missing Data | Laptop | Functional laptop, all financial fields empty | `REUSE` + `MISSING_ECONOMIC_DATA` |
| **TC-MIS-002** | Missing Telemetry| Smartphone | Working phone, battery health percentage unknown | `REFURBISHMENT` + `UNKNOWN_BATTERY_METRIC` |
| **TC-INV-001** | Schema Error | Kitchen Appliance| Unsupported device category (`MICROWAVE`) | `VALIDATION_ERROR` (HTTP 400) |
| **TC-INV-002** | Contradiction | Laptop | Contradictory input: `NO_POWER` yet `OS_BOOTS` | `VALIDATION_ERROR` (HTTP 400) |
| **TC-EDG-001** | Edge Boundary | Desktop PC | Exactly at 10.0-year obsolescence threshold (Decision D) | `FORMAL_RECYCLING` |

---

## 3. Concrete Acceptance Test Specifications

---

### TC-SAF-001: Confirmed Swollen Lithium-Ion Battery
- **Category:** Safety Precedence Gate
- **Scenario:** High-end 2-year-old gaming laptop with a visibly bulging battery lifting the keyboard deck. Resale value is high ($950), but hazard is extreme.
- **Input Payload:**
```json
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
    "estimatedMarketValue": 950.00,
    "estimatedRepairCost": 80.00
  }
}
```
- **Expected Pathway:** `SPECIAL_HANDLING`
- **Expected Primary Reason Code:** `RULE_SAF_001_BATTERY_SWELLING_CONFIRMED`
- **Expected Secondary Flags:** `COMMERCIAL_VALUE_OVERRIDDEN_BY_SAFETY`
- **Precedence & Safety Rationale:** Battery swelling indicates internal gas buildup and cell puncture risk. Fire and explosion hazard strictly vetoes commercial resale and standard repair until battery is professionally isolated and disposed of at a certified hazardous waste depot.
- **Assertion Criteria:**
  - `response.primaryPathway === "SPECIAL_HANDLING"`
  - `response.safetyAlert.active === true`
  - `response.safetyAlert.hazardLevel === "CRITICAL"`
  - `response.disqualifiedPathways` includes `"REUSE"`, `"REPAIR"`, `"REFURBISHMENT"`

---

### TC-SAF-002: Suspected Battery Swelling / Popped Chassis
- **Category:** Safety Precedence Gate
- **Scenario:** Tablet with the glass screen delaminating and popping open along the seam due to suspected pouch swelling.
- **Input Payload:**
```json
{
  "device": {
    "category": "TABLET",
    "brand": "Apple",
    "model": "iPad Air 3",
    "ageYears": 4.5
  },
  "physicalCondition": {
    "chassisIntegrity": "WARPED",
    "screenCondition": "DELAMINATING",
    "liquidDamage": false,
    "thermalDamage": "NONE",
    "chemicalHazard": "NONE"
  },
  "functionalStatus": {
    "powerState": "NO_POWER",
    "bootState": "DEAD",
    "displayState": "UNKNOWN"
  },
  "battery": {
    "present": true,
    "swellingState": "SUSPECTED",
    "thermalBehavior": "NORMAL"
  },
  "storage": {
    "mediaType": "EMMC_SOLDERED",
    "sanitizationState": "ENCRYPTED_LOCKED"
  }
}
```
- **Expected Pathway:** `SPECIAL_HANDLING`
- **Expected Primary Reason Code:** `RULE_SAF_002_BATTERY_SWELLING_SUSPECTED`
- **Precedence & Safety Rationale:** Precautionary principle: suspected battery swelling in sealed consumer devices must be treated as active hazmat until verified safe in a fireproof enclosure.
- **Assertion Criteria:**
  - `response.primaryPathway === "SPECIAL_HANDLING"`
  - `response.reasonCodes` contains `"RULE_SAF_002_BATTERY_SWELLING_SUSPECTED"`

---

### TC-SAF-003: Severe Thermal Damage / Scorch Marks
- **Category:** Safety Precedence Gate
- **Scenario:** Desktop PC with a burnt internal power supply and melted connectors from a thermal failure.
- **Input Payload:**
```json
{
  "device": {
    "category": "DESKTOP",
    "brand": "Custom",
    "model": "ATX Tower",
    "ageYears": 3.0
  },
  "physicalCondition": {
    "chassisIntegrity": "INTACT",
    "screenCondition": "NOT_APPLICABLE",
    "liquidDamage": false,
    "thermalDamage": "BURNT",
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
  "storage": {
    "mediaType": "SATA_SSD",
    "sanitizationState": "VERIFIED_WIPED"
  }
}
```
- **Expected Pathway:** `SPECIAL_HANDLING`
- **Expected Primary Reason Code:** `RULE_SAF_003_THERMAL_DAMAGE_DETECTED`
- **Precedence & Safety Rationale:** Burnt components present electrical shock, toxic fumes, and persistent short-circuit hazards.
- **Assertion Criteria:**
  - `response.primaryPathway === "SPECIAL_HANDLING"`
  - `response.safetyAlert.active === true`

---

### TC-SAF-004: Broken Mercury CCFL Backlight / Chemical Leak
- **Category:** Safety Precedence Gate
- **Scenario:** Vintage 2008 laptop with shattered CCFL tube backlight presenting mercury vapor / phosphor risk.
- **Input Payload:**
```json
{
  "device": {
    "category": "LAPTOP",
    "brand": "HP",
    "model": "Pavilion dv6000",
    "ageYears": 15.0
  },
  "physicalCondition": {
    "chassisIntegrity": "DAMAGED",
    "screenCondition": "SHATTERED",
    "liquidDamage": false,
    "thermalDamage": "NONE",
    "chemicalHazard": "BROKEN_MERCURY_LAMP"
  },
  "functionalStatus": {
    "powerState": "NO_POWER",
    "bootState": "DEAD",
    "displayState": "CRACKED_NO_DISPLAY"
  },
  "battery": {
    "present": false
  },
  "storage": {
    "mediaType": "HDD",
    "sanitizationState": "DAMAGED_PHYSICALLY"
  }
}
```
- **Expected Pathway:** `SPECIAL_HANDLING`
- **Expected Primary Reason Code:** `RULE_SAF_004_TOXIC_CHEMICAL_EXPOSURE`
- **Precedence & Safety Rationale:** Mercury exposure is an environmental and neurological toxin under WEEE and EPA guidelines; requires sealed hazmat recycling.
- **Assertion Criteria:**
  - `response.primaryPathway === "SPECIAL_HANDLING"`

---

### TC-SAF-005: Compound Hazards (Swollen Battery + Shattered Display)
- **Category:** Safety Precedence Gate
- **Scenario:** Smartphone crushed by vehicle; battery punctured/swollen and screen crushed.
- **Input Payload:**
```json
{
  "device": {
    "category": "SMARTPHONE",
    "brand": "Samsung",
    "model": "Galaxy S21",
    "ageYears": 3.0
  },
  "physicalCondition": {
    "chassisIntegrity": "DAMAGED",
    "screenCondition": "SHATTERED",
    "liquidDamage": false,
    "thermalDamage": "NONE",
    "chemicalHazard": "LEAKING_BATTERY_ELECTROLYTE"
  },
  "functionalStatus": {
    "powerState": "NO_POWER",
    "bootState": "DEAD",
    "displayState": "CRACKED_NO_DISPLAY"
  },
  "battery": {
    "present": true,
    "swellingState": "CONFIRMED_BULGING",
    "thermalBehavior": "OVERHEATING"
  },
  "storage": {
    "mediaType": "EMMC_SOLDERED",
    "sanitizationState": "DAMAGED_PHYSICALLY"
  }
}
```
- **Expected Pathway:** `SPECIAL_HANDLING`
- **Expected Primary Reason Code:** `RULE_SAF_005_COMPOUND_HAZARDS_PRESENT`
- **Assertion Criteria:**
  - `response.primaryPathway === "SPECIAL_HANDLING"`
  - `response.reasonCodes` contains `"RULE_SAF_001_BATTERY_SWELLING_CONFIRMED"` and `"RULE_SAF_004_TOXIC_CHEMICAL_EXPOSURE"`

---

### TC-SAF-006: 10-Year-Old Device with Battery Swelling (Safety Overriding Age)
- **Category:** Safety Invariance Gate
- **Scenario:** 10.5-year-old laptop meeting obsolescence age criteria, but with a confirmed bulging lithium-ion battery.
- **Input Payload:**
```json
{
  "device": {
    "category": "LAPTOP",
    "brand": "Dell",
    "model": "Latitude E6420",
    "ageYears": 10.5
  },
  "physicalCondition": {
    "chassisIntegrity": "WARPED",
    "screenCondition": "INTACT",
    "liquidDamage": false,
    "thermalDamage": "NONE",
    "chemicalHazard": "NONE"
  },
  "functionalStatus": {
    "powerState": "NO_POWER",
    "bootState": "DEAD",
    "displayState": "WORKING"
  },
  "battery": {
    "present": true,
    "swellingState": "CONFIRMED_BULGING",
    "thermalBehavior": "NORMAL"
  },
  "storage": {
    "mediaType": "SATA_SSD",
    "sanitizationState": "VERIFIED_WIPED"
  }
}
```
- **Expected Pathway:** `SPECIAL_HANDLING`
- **Expected Primary Reason Code:** `RULE_SAF_001_BATTERY_SWELLING_CONFIRMED`
- **Precedence & Safety Rationale:** Demonstrates that safety unconditionally overrides age obsolescence. Even though the unit is $>10$ years old (which would ordinarily route to `FORMAL_RECYCLING`), the bulging battery must be contained first.
- **Assertion Criteria:**
  - `response.primaryPathway === "SPECIAL_HANDLING"`
  - `response.disqualifiedPathways` contains `"FORMAL_RECYCLING"` (until hazmat cleared)

---

### TC-USE-001: Pristine Modern Operational Laptop
- **Category:** Normal Reuse
- **Scenario:** 2-year-old Dell XPS 13 corporate machine, wiped NVMe SSD, 91% battery health, flawless chassis.
- **Input Payload:**
```json
{
  "device": {
    "category": "LAPTOP",
    "brand": "Dell",
    "model": "XPS 13 9310",
    "ageYears": 2.2
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
    "healthPercentage": 91,
    "swellingState": "NONE",
    "thermalBehavior": "NORMAL"
  },
  "storage": {
    "mediaType": "NVME_SSD",
    "sanitizationState": "VERIFIED_WIPED"
  },
  "economics": {
    "estimatedMarketValue": 650.00
  }
}
```
- **Expected Pathway:** `REUSE`
- **Expected Primary Reason Code:** `RULE_USE_001_FULLY_FUNCTIONAL_PRISTINE`
- **Precedence & Safety Rationale:** Fully functional modern equipment without safety hazards has the highest environmental circularity value in direct secondary reuse.
- **Assertion Criteria:**
  - `response.primaryPathway === "REUSE"`
  - `response.eligiblePathways` contains `"REUSE"`, `"REFURBISHMENT"`

---

### TC-USE-002: Operational Laptop with Unsanitized Sensitive Data
- **Category:** Data Privacy Gate / Reuse
- **Scenario:** Enterprise laptop in perfect working condition, but contains unencrypted proprietary company data.
- **Input Payload:**
```json
{
  "device": {
    "category": "LAPTOP",
    "brand": "Lenovo",
    "model": "ThinkPad T14",
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
    "healthPercentage": 86,
    "swellingState": "NONE",
    "thermalBehavior": "NORMAL"
  },
  "storage": {
    "mediaType": "NVME_SSD",
    "sanitizationState": "UNENCRYPTED_DATA_PRESENT"
  },
  "economics": {
    "estimatedMarketValue": 520.00
  }
}
```
- **Expected Pathway:** `REUSE`
- **Expected Primary Reason Code:** `RULE_USE_001_FULLY_FUNCTIONAL_PRISTINE`
- **Expected Mandatory Blocking Flag:** `DATA_SANITIZATION_REQUIRED`
- **Precedence & Safety Rationale:** Device hardware is eligible for reuse, but transfer is blocked until NIST SP 800-88 Rev. 2 sanitization is completed. The application assesses sanitization need; it does not perform wiping or issue certificates.
- **Assertion Criteria:**
  - `response.primaryPathway === "REUSE"`
  - `response.complianceFlags.dataSanitizationRequired === true`
  - `response.actionChecklist` contains `"Perform certified storage wipe (NIST SP 800-88 Rev. 2) before handover"`

---

### TC-REP-001: Economically Viable Cracked Display on Smartphone
- **Category:** Repair Economics
- **Scenario:** 2-year-old iPhone with cracked outer glass. Digitizer and board fully functional. Repair quote $85, market value $280.
- **Input Payload:**
```json
{
  "device": {
    "category": "SMARTPHONE",
    "brand": "Apple",
    "model": "iPhone 13",
    "ageYears": 2.0
  },
  "physicalCondition": {
    "chassisIntegrity": "INTACT",
    "screenCondition": "CRACKED_FUNCTIONAL",
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
    "healthPercentage": 87,
    "swellingState": "NONE",
    "thermalBehavior": "NORMAL"
  },
  "storage": {
    "mediaType": "EMMC_SOLDERED",
    "sanitizationState": "VERIFIED_WIPED"
  },
  "economics": {
    "estimatedMarketValue": 280.00,
    "estimatedRepairCost": 85.00
  }
}
```
- **Expected Pathway:** `REPAIR`
- **Expected Primary Reason Code:** `RULE_REP_001_ISOLATED_DEFECT_ECONOMICALLY_VIABLE`
- **Precedence & Safety Rationale:** Repair cost ratio is $\frac{85}{280} = 30.4\%$ ($\le 70\%$ threshold). Repairing preserves high circular value.
- **Assertion Criteria:**
  - `response.primaryPathway === "REPAIR"`
  - `response.financialSummary.netRepairMargin === 195.00`
  - `response.financialSummary.costRatioPercent === 30.4`

---

### TC-REP-002: Economically Prohibitive Repair Cost
- **Category:** Repair Economics / Downgrade
- **Scenario:** Budget laptop with shattered screen and broken keyboard. Repair quote $240, secondary market value only $200.
- **Input Payload:**
```json
{
  "device": {
    "category": "LAPTOP",
    "brand": "Acer",
    "model": "Aspire 3",
    "ageYears": 4.0
  },
  "physicalCondition": {
    "chassisIntegrity": "DAMAGED",
    "screenCondition": "SHATTERED",
    "liquidDamage": false,
    "thermalDamage": "NONE",
    "chemicalHazard": "NONE"
  },
  "functionalStatus": {
    "powerState": "POWERS_ON",
    "bootState": "POST_PASS",
    "displayState": "CRACKED_NO_DISPLAY"
  },
  "battery": {
    "present": true,
    "healthPercentage": 65,
    "swellingState": "NONE",
    "thermalBehavior": "NORMAL"
  },
  "storage": {
    "mediaType": "SATA_SSD",
    "sanitizationState": "VERIFIED_WIPED"
  },
  "economics": {
    "estimatedMarketValue": 200.00,
    "estimatedRepairCost": 240.00,
    "estimatedComponentSalvageValue": 60.00
  }
}
```
- **Expected Pathway:** `COMPONENT_RECOVERY`
- **Expected Primary Reason Code:** `RULE_REP_002_REPAIR_COST_EXCEEDS_THRESHOLD`
- **Precedence & Safety Rationale:** Repair cost ratio is 120.0% ($> 70\%$ threshold). Whole-device repair results in net negative economics; modular components (SSD, RAM) should be salvaged instead.
- **Assertion Criteria:**
  - `response.primaryPathway === "COMPONENT_RECOVERY"`
  - `response.disqualifiedPathways` contains `"REPAIR"`
  - `response.disqualificationReasons.REPAIR` mentions `"Cost ratio 120.0% exceeds 70% ceiling"`

---

### TC-REP-003: Isolated Screen Defect with Missing Repair Quote (Closed Decision A)
- **Category:** Repair Economics / Missing Quote
- **Scenario:** Smartphone with broken screen digitizer, working logic board, but user has not obtained a repair estimate.
- **Input Payload:**
```json
{
  "device": {
    "category": "SMARTPHONE",
    "brand": "Google",
    "model": "Pixel 6",
    "ageYears": 2.5
  },
  "physicalCondition": {
    "chassisIntegrity": "INTACT",
    "screenCondition": "CRACKED_FUNCTIONAL",
    "liquidDamage": false,
    "thermalDamage": "NONE",
    "chemicalHazard": "NONE"
  },
  "functionalStatus": {
    "powerState": "POWERS_ON",
    "bootState": "OS_BOOTS",
    "displayState": "CRACKED_FUNCTIONAL"
  },
  "battery": {
    "present": true,
    "healthPercentage": 82,
    "swellingState": "NONE",
    "thermalBehavior": "NORMAL"
  },
  "storage": {
    "mediaType": "EMMC_SOLDERED",
    "sanitizationState": "VERIFIED_WIPED"
  },
  "economics": {
    "estimatedMarketValue": 190.00,
    "estimatedRepairCost": null
  }
}
```
- **Expected Pathway:** `REPAIR`
- **Expected Primary Reason Code:** `RULE_REP_003_ECONOMIC_FEASIBILITY_UNCONFIRMED`
- **Precedence & Safety Rationale:** Device remains eligible for `REPAIR` because the defect is isolated, but feasibility cannot be confirmed without a cost quote.
- **Assertion Criteria:**
  - `response.primaryPathway === "REPAIR"`
  - `response.reasonCodes` contains `"RULE_REP_003_ECONOMIC_FEASIBILITY_UNCONFIRMED"`
  - `response.financialSummary.status === "DATA_UNAVAILABLE"`
  - `response.financialSummary.netRepairMargin === null`
  - `response.actionChecklist` contains `"Obtain local repair quote to confirm economic feasibility"`

---

### TC-REF-001: Multi-Point Refurbishment Candidate
- **Category:** Refurbishment
- **Scenario:** 4-year-old business laptop. Minor chassis scuffs, healthy motherboard, battery at 68% (needs refresh), missing OS.
- **Input Payload:**
```json
{
  "device": {
    "category": "LAPTOP",
    "brand": "HP",
    "model": "EliteBook 840 G6",
    "ageYears": 4.1
  },
  "physicalCondition": {
    "chassisIntegrity": "SCRATCHED",
    "screenCondition": "INTACT",
    "liquidDamage": false,
    "thermalDamage": "NONE",
    "chemicalHazard": "NONE"
  },
  "functionalStatus": {
    "powerState": "POWERS_ON",
    "bootState": "POST_PASS",
    "displayState": "WORKING"
  },
  "battery": {
    "present": true,
    "healthPercentage": 68,
    "swellingState": "NONE",
    "thermalBehavior": "NORMAL"
  },
  "storage": {
    "mediaType": "NVME_SSD",
    "sanitizationState": "VERIFIED_WIPED"
  },
  "economics": {
    "estimatedMarketValue": 260.00
  }
}
```
- **Expected Pathway:** `REFURBISHMENT`
- **Expected Primary Reason Code:** `RULE_REF_001_MULTI_POINT_MAINTENANCE_REQUIRED`
- **Precedence & Safety Rationale:** Core electronics are sound, but sub-80% battery and cosmetic conditioning preclude direct "as-is" reuse.
- **Assertion Criteria:**
  - `response.primaryPathway === "REFURBISHMENT"`
  - `response.actionChecklist` contains `"Replace degraded battery (<70% health)"`

---

### TC-CMP-001: Dead Motherboard with High-Value Modular Components
- **Category:** Component Recovery
- **Scenario:** High-end desktop PC suffering motherboard surge failure. Motherboard dead, but modular discrete RTX GPU, DDR4 RAM, and 1TB SSD are functional with prices.
- **Input Payload:**
```json
{
  "device": {
    "category": "DESKTOP",
    "brand": "Custom",
    "model": "Gaming Rig",
    "ageYears": 3.0
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
    { "name": "Dedicated GPU (NVIDIA RTX 3060)", "functional": true, "salvageValue": 180.00 },
    { "name": "32GB DDR4 RAM Kit", "functional": true, "salvageValue": 55.00 },
    { "name": "1TB NVMe SSD", "functional": true, "salvageValue": 45.00 }
  ],
  "storage": {
    "mediaType": "NVME_SSD",
    "sanitizationState": "VERIFIED_WIPED"
  },
  "economics": {
    "estimatedMarketValue": 0.00,
    "estimatedComponentSalvageValue": 280.00
  }
}
```
- **Expected Pathway:** `COMPONENT_RECOVERY`
- **Expected Primary Reason Code:** `RULE_CMP_001_VALUABLE_MODULAR_COMPONENTS_HARVESTABLE`
- **Precedence & Safety Rationale:** Device level reuse is impossible due to dead system board, but harvesting modular parts prevents landfilling working silicon.
- **Assertion Criteria:**
  - `response.primaryPathway === "COMPONENT_RECOVERY"`
  - `response.harvestManifest.length === 3`
  - `response.financialSummary.salvageYieldTotal === 280.00`

---

### TC-CMP-002: Dead Board with Zero Modular Parts (Downgrade to Scrap)
- **Category:** Cannibalization Fallback
- **Scenario:** Low-end netbook with fried CPU/motherboard; RAM is soldered, eMMC is soldered, cracked screen, dead battery.
- **Input Payload:**
```json
{
  "device": {
    "category": "LAPTOP",
    "brand": "Lenovo",
    "model": "IdeaPad 1",
    "ageYears": 4.5
  },
  "physicalCondition": {
    "chassisIntegrity": "CRACKED",
    "screenCondition": "SHATTERED",
    "liquidDamage": false,
    "thermalDamage": "NONE",
    "chemicalHazard": "NONE"
  },
  "functionalStatus": {
    "powerState": "NO_POWER",
    "bootState": "DEAD",
    "displayState": "CRACKED_NO_DISPLAY"
  },
  "battery": {
    "present": true,
    "healthPercentage": 0,
    "swellingState": "NONE",
    "thermalBehavior": "NORMAL"
  },
  "modularComponents": [],
  "storage": {
    "mediaType": "EMMC_SOLDERED",
    "sanitizationState": "DAMAGED_PHYSICALLY"
  }
}
```
- **Expected Pathway:** `FORMAL_RECYCLING`
- **Expected Primary Reason Code:** `RULE_REC_002_NO_HARVESTABLE_COMPONENTS_DOWNGRADE`
- **Precedence & Safety Rationale:** Unrepairable device with zero modular harvestable components must be routed directly to certified mechanical recycling.
- **Assertion Criteria:**
  - `response.primaryPathway === "FORMAL_RECYCLING"`
  - `response.disqualifiedPathways` contains `"COMPONENT_RECOVERY"`

---

### TC-CMP-003: Modular Components Harvestable with Missing Salvage Prices (Closed Decision C)
- **Category:** Component Recovery / Missing Part Prices
- **Scenario:** Dead server desktop tower with working RAM and dual modular power supplies, but user has not entered market prices for the parts.
- **Input Payload:**
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
- **Expected Pathway:** `COMPONENT_RECOVERY`
- **Expected Primary Reason Code:** `RULE_CMP_001_VALUABLE_MODULAR_COMPONENTS_HARVESTABLE`
- **Precedence & Safety Rationale:** Parts are physically harvestable regardless of whether their resale prices are known. Manifest is populated, but monetary valuation must remain `DATA_UNAVAILABLE`.
- **Assertion Criteria:**
  - `response.primaryPathway === "COMPONENT_RECOVERY"`
  - `response.harvestManifest.length === 2`
  - `response.financialSummary.salvageYieldTotal === null`
  - `response.financialSummary.status === "DATA_UNAVAILABLE"`

---

### TC-REC-001: Functionally Obsolete Legacy Hardware
- **Category:** Formal Recycling
- **Scenario:** 16-year-old Pentium 4 desktop. Still boots to BIOS, but obsolete 32-bit architecture cannot support modern secure software or web standards.
- **Input Payload:**
```json
{
  "device": {
    "category": "DESKTOP",
    "brand": "Dell",
    "model": "OptiPlex GX270",
    "ageYears": 16.0
  },
  "physicalCondition": {
    "chassisIntegrity": "INTACT",
    "screenCondition": "NOT_APPLICABLE",
    "liquidDamage": false,
    "thermalDamage": "NONE",
    "chemicalHazard": "NONE"
  },
  "functionalStatus": {
    "powerState": "POWERS_ON",
    "bootState": "POST_PASS",
    "displayState": "NOT_APPLICABLE"
  },
  "battery": {
    "present": false
  },
  "storage": {
    "mediaType": "HDD",
    "sanitizationState": "VERIFIED_WIPED"
  },
  "economics": {
    "scrapWeightKg": 11.5
  }
}
```
- **Expected Pathway:** `FORMAL_RECYCLING`
- **Expected Primary Reason Code:** `RULE_REC_001_ARCHITECTURAL_OBSOLESCENCE`
- **Precedence & Safety Rationale:** Energy consumption is inefficient and architecture is obsolete. Commodity materials (steel, copper) should be recovered via formal smelters.
- **Assertion Criteria:**
  - `response.primaryPathway === "FORMAL_RECYCLING"`
  - `response.reasonCodes` contains `"RULE_REC_001_ARCHITECTURAL_OBSOLESCENCE"`

---

### TC-MIS-001: Complete Absence of Financial Data
- **Category:** Missing Telemetry / Zero Hallucination
- **Scenario:** Fully operational 3-year-old laptop submitted with zero financial estimates.
- **Input Payload:**
```json
{
  "device": {
    "category": "LAPTOP",
    "brand": "ASUS",
    "model": "ZenBook 14",
    "ageYears": 3.0
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
    "healthPercentage": 84,
    "swellingState": "NONE",
    "thermalBehavior": "NORMAL"
  },
  "storage": {
    "mediaType": "NVME_SSD",
    "sanitizationState": "VERIFIED_WIPED"
  }
}
```
- **Expected Pathway:** `REUSE`
- **Expected Primary Reason Code:** `RULE_USE_001_FULLY_FUNCTIONAL_PRISTINE`
- **Financial Status Output:** `status: "DATA_UNAVAILABLE"`
- **Assertion Criteria:**
  - `response.primaryPathway === "REUSE"`
  - `response.financialSummary.status === "DATA_UNAVAILABLE"`
  - `response.financialSummary.netRepairMargin === null`
  - Zero fabricated dollar amounts in output.

---

### TC-MIS-002: Missing Battery Health Metric
- **Category:** Missing Telemetry / Graceful Degradation
- **Scenario:** Working Android phone, but user has no diagnostics to report battery health percentage.
- **Input Payload:**
```json
{
  "device": {
    "category": "SMARTPHONE",
    "brand": "Motorola",
    "model": "Moto G Power",
    "ageYears": 3.5
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
    "healthPercentage": null,
    "swellingState": "NONE",
    "thermalBehavior": "NORMAL"
  },
  "storage": {
    "mediaType": "EMMC_SOLDERED",
    "sanitizationState": "VERIFIED_WIPED"
  }
}
```
- **Expected Pathway:** `REFURBISHMENT`
- **Expected Reason Code:** `RULE_REF_002_BATTERY_METRIC_UNKNOWN_AGE_INTERMEDIATE`
- **Assertion Criteria:**
  - `response.primaryPathway === "REFURBISHMENT"`
  - `response.uncertaintyWarnings` contains `"Battery health metric not supplied; battery audit recommended"`

---

### TC-INV-001: Schema Validation Error (Unsupported Device Category)
- **Category:** Input Validation / Schema
- **Scenario:** User payload attempts to submit `"category": "MICROWAVE"`.
- **Input Payload:**
```json
{
  "device": {
    "category": "MICROWAVE",
    "brand": "Panasonic"
  }
}
```
- **Expected Result:** HTTP 400 Bad Request
- **Expected Error Structure:**
```json
{
  "error": "BAD_REQUEST",
  "message": "Invalid device category: MICROWAVE. Supported categories: LAPTOP, SMARTPHONE, DESKTOP, TABLET."
}
```
- **Assertion Criteria:**
  - `response.statusCode === 400`
  - `response.error === "BAD_REQUEST"`

---

### TC-INV-002: Contradictory Operational Telemetry
- **Category:** Input Validation / Logical Inconsistency
- **Scenario:** Payload claims device has `powerState: "NO_POWER"` but simultaneously claims `bootState: "OS_BOOTS"`.
- **Input Payload:**
```json
{
  "device": {
    "category": "LAPTOP",
    "brand": "Dell",
    "ageYears": 2.0
  },
  "functionalStatus": {
    "powerState": "NO_POWER",
    "bootState": "OS_BOOTS",
    "displayState": "WORKING"
  }
}
```
- **Expected Result:** HTTP 400 Bad Request
- **Expected Error Structure:**
```json
{
  "error": "LOGICAL_CONTRADICTION",
  "message": "Contradictory telemetry: device cannot boot OS while powerState is NO_POWER."
}
```
- **Assertion Criteria:**
  - `response.statusCode === 400`
  - `response.error === "LOGICAL_CONTRADICTION"`

---

### TC-EDG-001: Exact Obsolescence Threshold Boundary (Decision D)
- **Category:** Edge Case / Deterministic Boundary
- **Scenario:** Desktop PC with age exactly equal to 10.0 years (the exact configured obsolescence ceiling).
- **Input Payload:**
```json
{
  "device": {
    "category": "DESKTOP",
    "brand": "Lenovo",
    "model": "ThinkCentre",
    "ageYears": 10.0
  },
  "physicalCondition": {
    "chassisIntegrity": "INTACT",
    "screenCondition": "NOT_APPLICABLE",
    "liquidDamage": false,
    "thermalDamage": "NONE",
    "chemicalHazard": "NONE"
  },
  "functionalStatus": {
    "powerState": "POWERS_ON",
    "bootState": "POST_PASS",
    "displayState": "NOT_APPLICABLE"
  },
  "battery": {
    "present": false
  },
  "storage": {
    "mediaType": "SATA_SSD",
    "sanitizationState": "VERIFIED_WIPED"
  }
}
```
- **Expected Pathway:** `FORMAL_RECYCLING`
- **Expected Reason Code:** `RULE_REC_001_ARCHITECTURAL_OBSOLESCENCE`
- **Precedence & Safety Rationale:** Validates that age $\ge 10.0$ boundary triggers `FORMAL_RECYCLING` deterministically when no higher-priority modular recovery or safety hazard is present.
- **Assertion Criteria:**
  - `response.primaryPathway === "FORMAL_RECYCLING"`
