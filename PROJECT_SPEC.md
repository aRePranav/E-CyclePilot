# PROJECT SPECIFICATION: E-CYCLEPILOT AI
**Full Title:** E-CyclePilot AI: E-Waste Recovery & Circularity Decision Engine  
**Document Version:** 2.0.0 (Specification Lock)  
**Status:** Locked Specification  
**Target Delivery Window:** Hackathon MVP  

---

## 1. Executive Summary & Problem Statement

### 1.1 The Global E-Waste Challenge
Global electronic waste (e-waste) generation exceeds 60 million metric tons annually, with less than 23% documented as formally collected and recycled. Discarded electronics contain hazardous substances (lithium, lead, mercury, brominated flame retardants) alongside critical raw materials (gold, silver, copper, cobalt, palladium). 

### 1.2 The Triage Bottleneck
Current e-waste triage at consumer, small business, and IT Asset Disposition (ITAD) intake points suffers from three systemic vulnerabilities:
1. **Safety Risks Overlooked:** Swollen lithium-ion batteries, punctured cells, and compromised high-voltage circuits are frequently mishandled or transported improperly in search of resale profit.
2. **Arbitrary Down-Cycling:** Functional or easily repairable devices are prematurely shredded or dumped into bulk scrap streams due to lack of accessible diagnostic frameworks.
3. **Black-Box or Hallucinatory Estimates:** Generic disposal tools often fabricate resale values, invented carbon offset metrics, or unverified recovery yields, creating liabilities and regulatory non-compliance.

### 1.3 The E-CyclePilot AI Solution
**E-CyclePilot AI** is an open, auditable, deterministic decision engine that evaluates surplus or end-of-life electronic devices. It maps input telemetry to one of six explicit circularity pathways using strict safety precedence, explainable reason codes, and honest disclosure of missing evidence.

---

## 2. Regulatory & Technical Reference Audit

To prevent false claims of certification or compliance, all regulatory and standards-related references are audited below:

| Standard / Framework | Jurisdiction & Authority | Primary Source URL | Actual Purpose | Project Usage & Boundaries | Legal Obligation vs Informative Guidance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UN 3480 / UN 3481 (Dangerous Goods)** | International (ICAO, ICAO-TI, IMDG, US DOT PHMSA 49 CFR § 173.185) | [UNECE Transport](https://unece.org/transport/dangerous-goods) / [US DOT PHMSA](https://www.phmsa.dot.gov/safe-transportation-active-materials/lithium-battery-guide) | Regulates the safe packaging, labeling, and carriage of lithium-ion cells/batteries, specifically prohibiting carriage of damaged/defective batteries by air. | **Hard Engine Gate:** Detects swollen or thermally damaged cells and forces `SPECIAL_HANDLING`. Issues warnings prohibiting standard parcel shipping. *Boundary: Software flag only; does not generate certified hazmat shipping manifests.* | **Legal Obligation** for physical transport operators; **Informative Safety Alert** within software. |
| **EU WEEE Directive (2012/19/EU)** | European Union (European Parliament & Council) | [EUR-Lex Directive 2012/19/EU](https://eur-lex.europa.eu/eli/dir/2012/19/oj) | Establishes EU-wide collection, recovery, and recycling targets for electrical waste; enforces the circular waste hierarchy. | **Conceptual Taxonomy:** Defines priority ordering (Reuse > Refurbish > Recycle) and mandates extraction of hazardous fractions (mercury lamps, electrolytes). *Boundary: Does not certify WEEE compliance for physical treatment facilities.* | **Informative Guidance** for triage decision prioritization; software does not track EU member state statutory quotas. |
| **US EPA Sustainable Management of Electronics (SME)** | United States (EPA Office of Resource Conservation and Recovery) | [US EPA Electronics Circularity](https://www.epa.gov/smm/sustainable-management-electronics) | Promotes circular electronics management and encourages use of third-party accredited recyclers (R2 / e-Stewards). | **Disposal Recommendation Guidance:** Advises users to route non-reusable devices to certified R2v3 or e-Stewards recyclers. *Boundary: Does not audit or accredit recycling facilities.* | **Informative Best Practice Guidance.** |
| **NIST SP 800-88 Rev. 2** | United States (NIST Computer Security Resource Center) | [NIST SP 800-88 Rev. 2](https://csrc.nist.gov/pubs/sp/800/88/r2/final) | Guidelines for media sanitization (Clear, Purge, Destroy) for federal and commercial data protection. | **Assessment Gate Flag:** Ingests storage sanitization state. If un-wiped data exists, sets blocking flag `dataSanitizationRequired = true` prior to reuse/resale. *Boundary: The application assesses whether sanitization is required; it does not perform disk wiping, validate a sanitization operation, or issue a sanitization certificate.* | **Informative Assessment Checkpoint.** Software acts strictly as a compliance reminder. |

---

## 3. Target Users & Stakeholders

| User Persona | Context & Environment | Primary Need | Critical Constraint |
| :--- | :--- | :--- | :--- |
| **P1: Device Owner / Consumer** | Home or small office; disposing of old laptops, phones, tablets. | Clear, safe recommendation: should I fix it, sell it, recycle it, or take it to a hazmat drop-off? | Zero technical jargon; unambiguous hazard alerts (e.g., swollen battery warnings). |
| **P2: IT Administrator / ITAD Coordinator** | SME or educational institution managing fleet refresh (50–500 devices). | Structured triage to separate fleet into reuse, refurbishment, parts harvesting, or certified scrap. | Needs batch-compatible logic, audit logs, and data sanitization verification gates. |
| **P3: Repair & Refurbishment Technician** | Community repair cafe, independent repair shop, or secondary refurbisher. | Rapid feasibility screening: repair economic viability, modular harvesting yield, salvage potential. | Cannot rely on invented replacement part prices; requires transparent formulas. |
| **P4: Environmental Auditor / Compliance Officer** | Regulatory body, circular economy analyst, or ESG reporting team. | Auditable trail of why a device was categorized for shredding vs. circular reuse. | Must be 100% deterministic and reproducible; no black-box AI hallucinations. |

---

## 4. Product Goals & Measurable Success Criteria

### 4.1 Core Objectives
1. **Deterministic Pathway Triage:** Automatically categorize any supported electronic device into exactly one primary pathway and zero or more secondary viable fallback pathways.
2. **Safety Dominance:** Guarantee that any safety hazard (chemical, thermal, physical, electrical) permanently and irrevocably overrides commercial or economic incentives.
3. **Auditable Explainability:** Provide exact reason codes and human-readable rationales explaining why a pathway was chosen and why alternatives were disqualified.
4. **Transparent Economics:** Calculate net recovery value *only* when explicit user inputs or verified synthetic baseline reference data exist; explicitly flag missing data as `DATA_UNAVAILABLE` rather than guessing.
5. **Zero-API Dependency Baseline:** Deliver a fully operational decision engine requiring zero external paid AI model calls, functioning entirely through in-memory, deterministic logic.

### 4.2 Measurable Success Criteria
- **Acceptance Test Conformance:** 100% pass rate across the 21 defined acceptance test cases in `ACCEPTANCE_TEST_PLAN.md`.
- **Decision Reproducibility:** 100% bitwise parity for identical input payloads across different runs and platforms.
- **Latency:** Core decision engine execution latency under 20 milliseconds per assessment request on standard hardware.
- **Safety Enforcement:** 0 false-negative safety clearances (any battery swelling or critical hazard must trigger the `SPECIAL_HANDLING` pathway without exception).
- **Data Integrity:** 0 invented/hallucinated economic figures, salvage prices, carbon savings, or confidence percentages.

---

## 5. Frozen Circularity Pathways Taxonomy

The decision engine routes devices into one of six frozen circularity pathways:

```
[Device Intake Telemetry]
           │
           ▼
   [SAFETY GATE] ──────(Hazard Detected)──────► 1. SPECIAL_HANDLING
           │
      (Safe)
           ▼
[DATA SANITIZATION CHECK]
           │
           ▼
 [OPERATIONAL & PHYSICAL EVALUATION]
           │
           ├──► 2. REUSE (Direct secondary life; as-is or wiped)
           │
           ├──► 3. REPAIR (Single/minor failure; economic fix viable)
           │
           ├──► 4. REFURBISHMENT (Multi-point overhaul, cosmetic/battery refresh)
           │
           ├──► 5. COMPONENT_RECOVERY (Cannibalize modular working parts)
           │
           └──► 6. FORMAL_RECYCLING (Certified material shredding & smelting)
```

### Pathway Specifications:

| Pathway Identifier | Definition & Intent | Mandatory Eligibility Requirements | Supporting Evidence Required | Exclusions & Disqualification Rules |
| :--- | :--- | :--- | :--- | :--- |
| **`SPECIAL_HANDLING`** | Hazardous materials management requiring containment, fire suppression precautions, or chemical hazmat disposal before any processing. | Presence of active hazard: confirmed or suspected battery swelling, thermal burn damage, or chemical leakage (mercury, electrolyte). | `battery.swellingState in ['CONFIRMED_BULGING', 'SUSPECTED']`, `thermalDamage in ['BURNT', 'SCORCHED']`, or `chemicalHazard != 'NONE'`. | **Overrides all other pathways.** Disqualifies `REUSE`, `REPAIR`, `REFURBISHMENT`, `COMPONENT_RECOVERY`, and standard shredding until hazmat remediation occurs. |
| **`REUSE`** | Immediate redeployment, direct resale, or donation without physical hardware repair. | Device is safe, powers on, boots OS, display is intact, battery health $\ge 80\%$, age $\le 4.0$ years, and minor/no chassis wear. | `powerState == 'POWERS_ON'`, `bootState == 'OS_BOOTS'`, `displayState == 'WORKING'`, `battery.healthPercentage >= 80`. | Disqualified if any hardware fault exists, battery health $< 80\%$, or storage data is un-wiped (requires wipe before transfer). |
| **`REPAIR`** | Targeted restoration of an isolated modular or physical fault (e.g. cracked display, failed keyboard, bad charging port). | Device is safe, powers on, has single isolated failure, and cost ratio $\le 70.0\%$ of estimated resale value (or repair quote unconfirmed). | Single sub-system defect; `estimatedRepairCost / estimatedMarketValue <= 0.70` (when financials provided). | Disqualified if multiple catastrophic faults exist, mainboard dead, or cost ratio $> 70.0\%$. |
| **`REFURBISHMENT`** | Comprehensive multi-point restoration (battery replacement, OS re-imaging, thermal repasting, cosmetic reconditioning). | Device is safe, mainboard powers on and passes POST, but battery is degraded ($< 80\%$) or unit requires cosmetic/software refresh. | `powerState == 'POWERS_ON'`, `bootState in ['OS_BOOTS', 'POST_PASS']`, degraded battery or minor chassis wear. | Disqualified if repair costs exceed economic ceiling or mainboard is dead. |
| **`COMPONENT_RECOVERY`** | Extraction of working, modular sub-components (RAM, SSD, GPU, display panel, modular PSU) from a host carcass. | Host device is unrepairable or uneconomic to fix, but contains verified functional modular subcomponents. | `modularComponents` array has $\ge 1$ item with `functional == true`. | Disqualified if device is intact and viable for higher-tier reuse/repair, or if device carcass has 0 modular working parts. |
| **`FORMAL_RECYCLING`** | Certified mechanical demanufacturing, shredding, and high-temperature smelting for commodity material recovery (metals, plastics). | Device is safe (no active hazmat), but non-repairable, non-functional, obsolete ($\text{age} \ge 10.0$ years), or has no harvestable parts. | Non-functional board with no salvageable parts, obsolete architecture, or severe structural wreckage. | Disqualified if device has uncontained battery fire/chemical hazard (`SPECIAL_HANDLING` applies). |

### Handling Conflicting Evidence and Unclassifiable Cases:
1. **Contradictory Telemetry:** Payloads exhibiting direct physical contradictions (e.g., `powerState: "NO_POWER"` combined with `bootState: "OS_BOOTS"`) are rejected at the API validation layer with HTTP 400 (`LOGICAL_CONTRADICTION`).
2. **Ambiguous or Unclassifiable Evidence:** If a device has safe hardware, powers on, but cannot be classified into `REUSE` or `REPAIR` due to missing diagnostic fields, the engine gracefully routes to `FORMAL_RECYCLING` as the safe default fallback, attaching the reason code `RULE_REC_003_UNCLASSIFIED_EVALUATION_FALLBACK` and logging an uncertainty warning.

---

## 6. Financial Calculations & Economic Feasibility

### 6.1 The 70% Repair Viability Threshold Formula
Economic feasibility of repair is calculated strictly according to the following formula:

$$\text{Cost Ratio} = \frac{\text{Estimated Repair Cost}}{\text{Estimated Resale Value}}$$

$$\text{Net Repair Margin} = \text{Estimated Resale Value} - \text{Estimated Repair Cost}$$

- **Numerator:** `estimatedRepairCost` (currency units, e.g. USD). Must be $\ge 0$.
- **Denominator:** `estimatedMarketValue` (currency units, e.g. USD). Must be $> 0$.
- **Required Inputs & Units:** Both inputs must be provided by the user or sourced from verified reference fixtures in identical currency.
- **Boundary Behavior:** Equality at 70.0% is **eligible**:
  - If $\text{Cost Ratio} \le 0.70$ ($70.0\%$), repair is economically viable (`REPAIR` pathway affirmed).
  - If $\text{Cost Ratio} > 0.70$ ($> 70.0\%$), repair is economically prohibitive.
- **Resulting Pathway upon Disqualification:** If $\text{Cost Ratio} > 0.70$, the device is downgraded to:
  - `COMPONENT_RECOVERY` if modular harvestable components exist.
  - `FORMAL_RECYCLING` if no modular harvestable components exist.
- **Configurable Project Heuristic:** The 70% repair-cost-to-market-value threshold is a configurable project heuristic adopted to prevent net-negative recovery attempts after estimated repair expenses. It is not an established universal standard, and organizations may adjust this threshold based on internal operating margins, volunteer labor, or organizational goals.

### 6.2 Missing Financial Data Rules
- If either `estimatedRepairCost` or `estimatedMarketValue` is omitted or null:
  - System sets `financialSummary.status = "DATA_UNAVAILABLE"`.
  - System sets `costRatioPercent = null` and `netRepairMargin = null`.
  - Under no circumstances does the engine invent or hallucinate market prices, repair costs, carbon savings, or salvage yields.

---

## 7. Closed Operational Decisions

### Decision A: Damaged Screen Without a Repair Quote
- **Locked Stance:** A device with an isolated screen fracture and working digitizer remains classified as a `REPAIR` candidate.
- **Engine Behavior:** The engine assigns primary pathway `REPAIR`, attaches the reason code `RULE_REP_003_ECONOMIC_FEASIBILITY_UNCONFIRMED`, sets `financialSummary.status = "DATA_UNAVAILABLE"`, and adds an action item: *"Obtain local repair quote to verify cost does not exceed 70% of resale value."*

### Decision B: Data Sanitization Gate Scope
- **Locked Stance:** Data sanitization is strictly an assessment gate.
- **Engine Behavior:** If non-volatile storage contains un-wiped data, the engine sets `complianceFlags.dataSanitizationRequired = true` and includes NIST SP 800-88 Rev. 2 guidance notes. The application assesses whether sanitization is required. It does not perform disk wiping, validate a sanitization operation, or issue a sanitization certificate.

### Decision C: Modular Parts Harvesting with Missing Salvage Prices
- **Locked Stance:** Harvest manifest is reported independently of monetary valuation.
- **Engine Behavior:** The engine populates `harvestManifest` with all verified working components. If component prices are missing, `financialSummary.salvageYieldTotal = null` and `financialSummary.status = "DATA_UNAVAILABLE"`.

### Decision D: 10.0-Year Obsolescence Boundary & Safety Invariance
- **Locked Stance:** Device age $\ge 10.0$ years is classified as within the obsolescence threshold.
- **Boundary Rule:** A device with $\text{ageYears} = 10.0$ triggers obsolescence evaluation (`FORMAL_RECYCLING`).
- **Safety Invariant:** Age obsolescence **never** overrides safety. A 10-year-old device with a swollen battery is routed to `SPECIAL_HANDLING`, not standard recycling.

---

## 8. Functional Requirements Summary

- **FR-INT-01 to FR-INT-06:** Ingestion of device telemetry (categories: `LAPTOP`, `SMARTPHONE`, `DESKTOP`, `TABLET`), physical state, functional state, battery behavior, and storage media.
- **FR-SAF-01 to FR-SAF-04:** Unconditional safety precedence gating for swelling, thermal burns, and chemical hazards.
- **FR-SEC-01 to FR-SEC-02:** Data sanitization compliance checkpointing (NIST SP 800-88 Rev. 2).
- **FR-EVL-01 to FR-EVL-06:** Evaluation and ranking across all 6 circularity pathways.
- **FR-ECO-01 to FR-ECO-02:** 70% viability heuristic calculation and strict `DATA_UNAVAILABLE` missing data enforcement.
- **FR-EXP-01 to FR-EXP-02:** Traceable Reason Code synthesis and structured action checklist generation.
- **FR-REP-01 to FR-REP-02:** Preset scenario library and Markdown/JSON report export.

---

## 9. Non-Functional Requirements

- **NFR-DET-01:** Strict determinism; bitwise identical output for identical input payloads.
- **NFR-PRF-01:** Evaluation latency $< 20\text{ms}$ in-memory; $< 50\text{ms}$ HTTP API response.
- **NFR-SEC-01:** Zero storage of customer PII; 100% stateless in-memory execution.
- **NFR-MNT-01:** Isolated pure TypeScript core engine package with zero external network or runtime dependencies.

---

## 10. Verification & Acceptance Target

- **100% pass rate** across all 21 defined test cases in [ACCEPTANCE_TEST_PLAN.md](file:///d:/E-CyclePilot/ACCEPTANCE_TEST_PLAN.md).
