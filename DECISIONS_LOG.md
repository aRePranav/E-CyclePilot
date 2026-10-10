# DECISIONS LOG: E-CYCLEPILOT AI
**Full Title:** E-CyclePilot AI: E-Waste Recovery & Circularity Decision Engine  
**Document Code:** DEC-ECP-001  
**Version:** 2.0.0 (Specification Lock)  
**Status:** Locked  

---

## 1. Overview & Decision Methodology

This log documents foundational architecture decisions, technical trade-offs, working assumptions, and resolved design questions for **E-CyclePilot AI**. Every entry follows an Architecture Decision Record (ADR) structure, clearly distinguishing confirmed requirements from operational assumptions.

---

## 2. Architecture Decision Records (ADRs)

### ADR-001: Deterministic Expert Rule Engine vs. LLM-First Decision Making
- **Status:** Accepted (Non-Negotiable Requirement #7)
- **Context:** The product must triage electronic devices into 6 recovery pathways with 100% reproducibility and strict adherence to safety rules.
- **Decision:** Implement the core decision engine as an isolated, pure TypeScript deterministic rule module. Do not rely on external Large Language Models (LLMs) or paid AI APIs for pathway classification or safety gating.
- **Rationale:**
  1. *Safety Compliance:* LLMs can hallucinate, experience prompt drift, or fail to enforce strict precedence in edge cases. A deterministic state machine guarantees that a swollen battery *always* triggers `SPECIAL_HANDLING`.
  2. *Auditability & Explainability:* Rule trees emit precise, traceable reason codes (e.g., `RULE_SAF_001_BATTERY_SWELLING_CONFIRMED`).
  3. *Zero Operational Cost:* Eliminates third-party API token expenses, rate limits, and network latency.
  4. *Reproducibility:* Identical inputs yield identical outputs on any machine at any time.
- **Alternatives Rejected:**
  - *LLM Prompt Triage (OpenAI/Anthropic/Gemini):* Rejected due to non-deterministic risk, latency (500–2000ms vs <20ms), and cost.
  - *Python ML Classifier (e.g., Random Forest):* Rejected due to training data requirements, black-box weights, and deployment overhead in a TypeScript-centric hackathon timeline.

---

### ADR-002: Fastify + Node.js vs. Express or Python FastAPI Backend
- **Status:** Accepted
- **Context:** The system requires a lightweight, high-performance HTTP service for schema validation, scenario serving, and decision engine execution.
- **Decision:** Use Node.js (v20 LTS) with **Fastify** and TypeScript.
- **Rationale:**
  1. *Shared Domain Logic:* Fastify runs in the same TypeScript runtime as the frontend, enabling 100% code sharing of types and the `@engine/core` package.
  2. *Built-in Schema Validation:* Fastify's native JSON Schema validation provides sub-millisecond payload validation and out-of-the-box protection against malformed payloads.
  3. *High Throughput & Low Latency:* Fastify offers superior throughput compared to Express while keeping boilerplate minimal.
- **Alternatives Rejected:**
  - *Express:* Rejected due to lack of native async schema validation and older architecture.
  - *FastAPI (Python):* Rejected because it would require duplicating TypeScript interfaces in Pydantic or splitting domain types across two languages.

---

### ADR-003: React + Vite + TypeScript Frontend with Modular Vanilla CSS
- **Status:** Accepted
- **Context:** The frontend needs to deliver an interactive, responsive, accessible triage tool deployable to Vercel within a short hackathon timeline.
- **Decision:** Use React + Vite + TypeScript with modular Vanilla CSS tokens.
- **Rationale:**
  1. *Development Velocity:* Vite provides near-instant Hot Module Replacement (HMR).
  2. *Styling Control & Zero Configuration Overhead:* Vanilla CSS with custom properties allows precise aesthetic control (custom palettes, glassmorphic cards, high-contrast hazard alerts) without build-step overhead or Tailwind configuration conflicts.
  3. *Type Safety:* Shared types between backend and frontend prevent contract mismatches.
- **Alternatives Rejected:**
  - *Next.js (App Router):* Overkill for a single-page triage calculator; higher deployment complexity.
  - *TailwindCSS:* Avoided to adhere to clean vanilla CSS practices unless explicitly requested.

---

### ADR-004: Exclusion of Persistent Database (Supabase / PostgreSQL) in Initial Release
- **Status:** Accepted (Non-Negotiable Requirement #9)
- **Context:** The application needs to process device assessments quickly and reliably during demonstrations.
- **Decision:** Keep Supabase and persistent databases out of the initial MVP architecture. The engine operates entirely in-memory and statelessly.
- **Rationale:**
  1. *Elimination of Point of Failure:* No database provisioning, connection pooling, migrations, or database secret management required.
  2. *Data Privacy by Design:* Decommissioned device metadata often includes confidential asset tags or un-wiped storage notes. Keeping assessments stateless avoids liability.
  3. *Hackathon Scope Focus:* Focus engineering effort on safety, accuracy of logic, and testing rather than CRUD scaffolding.
- **Alternatives Rejected:**
  - *Supabase / Cloud PostgreSQL:* Deferred to post-hackathon roadmap when multi-user fleet history or team collaboration features are required.

---

### ADR-005: Static Version-Controlled JSON Files for Reference Data & Scenarios
- **Status:** Accepted
- **Context:** The engine requires baseline material rates, standard component lists, and sample scenarios for demonstration.
- **Decision:** Store reference data and test fixtures as version-controlled `.json` files in the repository. All illustrative market values or scrap rates must be explicitly labeled as `SYNTHETIC_DEMO_DATA`.
- **Rationale:**
  1. *Auditability:* Changes to thresholds or scenarios are tracked via Git commits.
  2. *Honesty & Transparency:* Explicitly marking synthetic demo data ensures the team never falsely claims live secondary market scraping.
- **Alternatives Rejected:**
  - *Live E-Commerce Scraping (eBay/Swappa API):* Rejected due to API rate limits, authentication hurdles, fluctuating prices, and unreliability during hackathon judging.

---

### ADR-006: Absolute Precedence of Safety Rules Over Economic Incentives
- **Status:** Accepted (Non-Negotiable Requirement #3)
- **Context:** A device may have high secondary market resale value (e.g., $1,000 gaming laptop) but exhibit battery swelling, severe scorched casing, or toxic chemical exposure.
- **Decision:** Safety rules take absolute precedence over commercial recovery. If any critical hazard is detected, the engine forcibly routes the device to `SPECIAL_HANDLING` and disqualifies all resale or standard repair pathways.
- **Rationale:**
  1. Swollen lithium-ion cells can explode or cause thermal runaway fires during shipping or storage.
  2. Legal, environmental, and human safety must never be compromised for marginal economic gain.
- **Alternatives Rejected:**
  - *Weighted Scoring / Cost-Benefit Tradeoff:* Rejected because no financial valuation can offset the risk of fire or toxic exposure.

---

### ADR-007: Explicit Missing Data Handling vs. Interpolated / Hallucinated Averages
- **Status:** Accepted (Non-Negotiable Requirement #4 & #5)
- **Context:** Users frequently submit devices without knowing the battery health percentage, repair cost, or current resale value.
- **Decision:** Missing fields must remain explicitly missing. The engine returns `status: "DATA_UNAVAILABLE"` for financial metrics and issues an `uncertaintyWarning`.
- **Rationale:**
  1. Fabricating average repair costs or resale prices misleads users and breaks trust.
  2. Regulatory and circularity decisions must be grounded in verified facts.
- **Alternatives Rejected:**
  - *Silent Imputation of Industry Averages:* Rejected as deceptive and violating project requirements.

---

### ADR-008: Economic Feasibility Threshold Formulation (70% Configurable Heuristic)
- **Status:** Accepted
- **Context:** The engine needs a deterministic rule to decide whether a defective device should be repaired or routed to component harvesting/recycling.
- **Decision:** Adopt a configurable project heuristic: A repair is considered economically viable if $\frac{\text{Estimated Repair Cost}}{\text{Estimated Resale Value}} \le 0.70$ (70.0%). If the ratio exceeds 70.0%, the device is downgraded to `COMPONENT_RECOVERY` (if modular parts exist) or `FORMAL_RECYCLING`.
- **Rationale:**
  - The 70% repair-cost-to-market-value threshold is a configurable project heuristic adopted to prevent net-negative recovery attempts after estimated repair expenses. It is not an established universal standard, and organizations may adjust this threshold based on internal operating margins, volunteer labor, or organizational goals.
  - Equality at 70.0% is eligible.
- **Alternatives Rejected:**
  - *100% Breakeven Threshold:* Rejected because repairing a device for $200 that sells for $200 results in net financial loss after labor, packaging, and shipping.

---

### ADR-009: Separation of Generative AI as an Additive Advisory Layer (Future Scope)
- **Status:** Accepted (Non-Negotiable Requirement #8)
- **Context:** Generative AI may be desired in future phases to generate layman summaries, search repair guides, or translate reports.
- **Decision:** If GenAI is integrated later, it must act solely as an additive, downstream explanatory summarizer. It must NEVER have the authority to alter the pathway classification, override reason codes, or modify safety determinations.
- **Rationale:** Ensures core system safety and legal integrity remain deterministic, auditable, and immutable.

---

### ADR-010: Exportable Client-Side & Backend Assessment Reports
- **Status:** Accepted
- **Context:** Technicians and users need to share triage results, print work orders, or archive disposition decisions.
- **Decision:** Provide export capabilities in both structured JSON (for machine ingestion) and clean printable Markdown / HTML (for human audit trails).
- **Rationale:** Enables integration into ITAD ticketing systems without requiring database storage.

---

### ADR-011: Isolated Screen Damage Without Repair Quote (Closed Decision A)
- **Status:** Accepted
- **Context:** When a device has an isolated cracked glass screen with a working digitizer/display, but the user has not obtained a repair estimate, should it default to `REPAIR` or `REFURBISHMENT`?
- **Decision:** Classify as a `REPAIR` candidate, but explicitly tag the assessment with `RULE_REP_003_ECONOMIC_FEASIBILITY_UNCONFIRMED`, set `financialSummary.status = "DATA_UNAVAILABLE"`, and attach an action item prompting the user to obtain a repair quote before committing funds.
- **Rationale:** The physical fault is an isolated repairable component. Disqualifying repair prematurely would encourage unnecessary scrapping, but pretending the repair is economically viable without a quote would violate financial honesty.
- **Alternatives Rejected:**
  - *Defaulting to Refurbishment:* Rejected because a shattered screen requires physical component replacement, not cosmetic buffing or OS reinstallation.
  - *Halting Assessment with an Error:* Rejected because users frequently use the tool to explore if repair is worth investigating.

---

### ADR-012: Data Sanitization as Assessment Checkpoint Only (Closed Decision B)
- **Status:** Accepted
- **Context:** How should data storage sanitization (NIST SP 800-88 concepts) be handled by the software?
- **Decision:** Model data sanitization strictly as an assessment checkpoint. When non-volatile storage contains un-wiped data, the engine sets `complianceFlags.dataSanitizationRequired = true` and includes NIST SP 800-88 Rev. 2 guidance notes. The application assesses whether sanitization is required. It does not perform disk wiping, validate a sanitization operation, or issue a sanitization certificate.
- **Rationale:** Prevents false claims of compliance or security certification. Software triage identifies the need for data destruction; physical destruction must be performed by certified tools.
- **Alternatives Rejected:**
  - *Simulating disk erasure in browser:* Rejected as misleading and technically impossible for external physical drives.
  - *Omitting data privacy entirely:* Rejected because data leakage on discarded hardware is a major real-world ITAD hazard.

---

### ADR-013: Modular Component Manifest Separate from Monetary Valuation (Closed Decision C)
- **Status:** Accepted
- **Context:** When a dead device contains working modular components (e.g., RAM, GPU, SSD), but individual part resale prices are unknown, how should harvest yield be reported?
- **Decision:** Report the verified harvest manifest (`harvestManifest: ModularComponentItem[]`) containing part names and functionality status. Return `salvageYieldTotal = null` and `financialSummary.status = "DATA_UNAVAILABLE"` for monetary valuation.
- **Rationale:** Allows technicians to see what can physically be salvaged without inventing speculative part prices.
- **Alternatives Rejected:**
  - *Fabricating synthetic average component prices:* Rejected as a violation of Non-Negotiable Requirement #4.
  - *Disqualifying Component Recovery if prices are missing:* Rejected because parts can be harvested for internal bench inventory regardless of monetary resale intent.

---

### ADR-014: 10.0-Year Obsolescence Threshold Boundary & Safety Invariance (Closed Decision D)
- **Status:** Accepted
- **Context:** How should devices at the 10-year boundary be handled, and what is the relationship between age obsolescence and safety hazards?
- **Decision:** 
  1. A device with $\text{ageYears} \ge 10.0$ is classified inside the obsolescence threshold, routing to `FORMAL_RECYCLING` when no modular components are present.
  2. Safety unconditionally supersedes age obsolescence. A 10-year-old device with a swollen battery routes to `SPECIAL_HANDLING`, never directly to standard recycling.
- **Rationale:**
  - A clear boundary ($\ge 10.0$) ensures 100% determinism.
  - Swollen batteries cannot be fed into industrial shredders even if the computer is 20 years old, due to thermal fire risk.
- **Alternatives Rejected:**
  - *Strict inequality ($> 10.0$):* Rejected; $\ge 10.0$ matches standard enterprise decennial asset retirement schedules.
  - *Age overriding safety:* Rejected as dangerous and legally non-compliant.

---

## 3. Audited Regulatory References Summary

| Framework | Authority & Jurisdiction | Authoritative Primary Source Link | Project Role & Scope | Legal vs Informative Distinction |
| :--- | :--- | :--- | :--- | :--- |
| **UN 3480 / UN 3481** | UNECE / US DOT PHMSA (International / US) | [UNECE Transport](https://unece.org/transport/dangerous-goods) / [PHMSA](https://www.phmsa.dot.gov/safe-transportation-active-materials/lithium-battery-guide) | Safety gate triggers `SPECIAL_HANDLING` for swelling/thermal damage; issues non-commercial transit warnings. | Legal obligation for carriers; informative hazard alert in app. |
| **EU WEEE (2012/19/EU)** | European Parliament (EU) | [EUR-Lex 2012/19/EU](https://eur-lex.europa.eu/eli/dir/2012/19/oj) | Informs circularity priority hierarchy (Reuse > Refurbish > Recycle) and hazardous fraction removal. | Informative guidance; app does not certify facility compliance. |
| **US EPA SME Guidance** | US EPA ORCR (United States) | [US EPA Electronics](https://www.epa.gov/smm/sustainable-management-electronics) | Recommends certified downstream recyclers (R2 / e-Stewards). | Informative voluntary best practice guidance. |
| **NIST SP 800-88 Rev. 2** | NIST CSRC (United States) | [NIST SP 800-88 Rev. 2](https://csrc.nist.gov/pubs/sp/800/88/r2/final) | Informs `dataSanitizationRequired` assessment gate. The application assesses whether sanitization is required; it does not perform disk wiping, validate a sanitization operation, or issue a sanitization certificate. | Informative assessment checkpoint. |

---

## 4. Assumptions Log

| ID | Assumption Description | Impact if Invalid | Status / Verification Source |
| :--- | :--- | :--- | :--- |
| **ASM-001** | Modern laptop, smartphone, desktop, and tablet form factors represent $\ge 90\%$ of typical consumer & SME e-waste triage volume. | Other device categories (printers, servers, CRT TVs) would require extended taxonomies. | Verified for Hackathon Scope. |
| **ASM-002** | Battery health below 80% original design capacity is the standard threshold requiring battery replacement for refurbishment. | May require configurable threshold per device class. | Standard industry benchmark (Apple / Dell / Lenovo). |
| **ASM-003** | A configurable 70% repair-cost-to-market-value threshold is adopted as a project heuristic to prevent net-negative recovery. | Threshold may be adjusted per organization or device category. | Documented as configurable project heuristic in engine options. |
| **ASM-004** | Devices 10 years or older ($\ge 10.0$ years) are functionally obsolete for standard modern computing tasks. | Retro enthusiasts or industrial systems may still utilize older hardware. | Boundary condition documented in ATP-ECP-001. |
| **ASM-005** | Hosting the Fastify backend on Render's free tier and frontend on Vercel is sufficient for hackathon demonstration loads. | Free tier spin-down (cold start) latency may require informative client loading state. | Documented in SOP.md Phase 10. |

---

## 5. Resolved Questions & Locked Stances

| ID | Open Question | Locked Decision Stance | Documented Reference |
| :--- | :--- | :--- | :--- |
| **Q-001** | Should devices with cracked glass screens but fully functional digitizers default to `REPAIR` or `REFURBISHMENT` if no financial quote is provided? | **RESOLVED:** Default to `REPAIR` with reason code `RULE_REP_003_ECONOMIC_FEASIBILITY_UNCONFIRMED` and `status = "DATA_UNAVAILABLE"`. | ADR-011, TC-REP-003 |
| **Q-002** | Should certified data wiping (NIST 800-88) be modeled as an actual wiping engine or an assessment gate? | **RESOLVED:** Modeled strictly as an assessment checkpoint (`dataSanitizationRequired = true`) referencing NIST SP 800-88 Rev. 2. App explicitly disclaims wiping. | ADR-012, TC-USE-002 |
| **Q-003** | When modular components have unknown salvage values, how should harvest yield be reported? | **RESOLVED:** Report verified parts in `harvestManifest`; return monetary yield as `DATA_UNAVAILABLE` with `salvageYieldTotal = null`. | ADR-013, TC-CMP-003 |
| **Q-004** | How should the 10.0-year boundary behave and does safety override it? | **RESOLVED:** $\ge 10.0$ years triggers obsolescence (`FORMAL_RECYCLING`), but safety hazards strictly take precedence (`SPECIAL_HANDLING`). | ADR-014, TC-SAF-006, TC-EDG-001 |
