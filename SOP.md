# STANDARD OPERATING PROCEDURE (SOP)
**Project:** E-CyclePilot AI: E-Waste Recovery & Circularity Decision Engine  
**Document Code:** SOP-ECP-001  
**Version:** 2.0.0 (Specification Lock)  
**Effective Date:** Hackathon Sprint  

---

## 1. Purpose & Scope

This Standard Operating Procedure (SOP) governs the engineering lifecycle for **E-CyclePilot AI**. It defines the step-by-step methodology from domain framing and standards auditing through implementation, testing, and cloud deployment, enforcing strict determinism, human safety priority, and reproducible results.

---

## 2. Process Lifecycle Overview

```
[Phase 1: Domain & Regulatory Auditing]
                  │
                  ▼
[Phase 2: Reference Data & Scenario Fixtures]
                  │
                  ▼
[Phase 3: System Design & Contract Freezing]
                  │
                  ▼
[Phase 4: Acceptance-Driven Test Suite (21 Cases)]
                  │
                  ▼
[Phase 5: Decision Engine & Backend Implementation]
                  │
                  ▼
[Phase 6: Web Client & User Interface Development]
                  │
                  ▼
[Phase 7: Comprehensive Verification & Linting]
                  │
                  ▼
[Phase 8: GitHub Version Control & CI Setup]
                  │
                  ▼
[Phase 9: Staging & Cloud Deployment]
                  │
                  ▼
[Phase 10: Operational Audit & Acceptance Sign-Off]
```

---

## 3. Detailed Phase Protocols

### Phase 1: Domain & Regulatory Auditing
1. **Audited Regulatory References:**
   - **UN 3480 / UN 3481 (Dangerous Goods):** ([UNECE Transport Regulations](https://unece.org/transport/dangerous-goods) / [US DOT PHMSA](https://www.phmsa.dot.gov/safe-transportation-active-materials/lithium-battery-guide))  
     *Purpose:* Regulates carriage of lithium-ion cells. Prohibits air transit of damaged/defective batteries.  
     *Project Scope:* Hard safety gate. Identifies swollen or burnt cells and forces `SPECIAL_HANDLING`. Issues non-commercial transit warnings. Does not generate legal shipping documentation.
   - **EU WEEE Directive (2012/19/EU):** ([EUR-Lex 2012/19/EU](https://eur-lex.europa.eu/eli/dir/2012/19/oj))  
     *Purpose:* Sets EU e-waste recovery/recycling quotas and waste hierarchy.  
     *Project Scope:* Informative prioritization framework (`REUSE` > `REFURBISHMENT` > `FORMAL_RECYCLING`). Software does not certify facility compliance.
   - **US EPA Sustainable Management of Electronics:** ([US EPA Guidance](https://www.epa.gov/smm/sustainable-management-electronics))  
     *Purpose:* Promotes electronics circularity and R2/e-Stewards certified recycling.  
     *Project Scope:* Guidance notes directing users to certified downstream recyclers.
   - **NIST SP 800-88 Rev. 2:** ([NIST CSRC Guidelines](https://csrc.nist.gov/pubs/sp/800/88/r2/final))  
     *Purpose:* Media sanitization standards (Clear, Purge, Destroy).  
     *Project Scope:* Assessment gate ONLY. The application assesses whether sanitization is required. It does not perform disk wiping, validate a sanitization operation, or issue a sanitization certificate. Triggers blocking flag `dataSanitizationRequired = true` when un-wiped storage is detected.
2. **Safety Dominance Axiom:** Safety gates unconditionally supersede economic valuations. A high-value device with a swollen battery cannot be triaged to resale or repair.

### Phase 2: Reference Data & Scenario Fixtures
1. **Static Data Hygiene:**
   - Store baseline scrap rates and sample scenarios in `/reference-data` as versioned JSON files.
   - All files with sample market values must include the top-level metadata:
     ```json
     {
       "_meta": {
         "dataType": "SYNTHETIC_DEMO_DATA",
         "sourceDescription": "Estimated baseline figures for hackathon demonstration only. Do not use for certified financial accounting.",
         "version": "2.0.0"
       }
     }
     ```
2. **Zero Hallucination Protocol:** Never impute or invent prices, yields, or carbon metrics. Omitted fields must return `DATA_UNAVAILABLE`.

### Phase 3: System Design & Contract Freezing
1. **Frozen Pathways:** Enforce exact pathway identifiers:
   - `SPECIAL_HANDLING`
   - `REUSE`
   - `REPAIR`
   - `REFURBISHMENT`
   - `COMPONENT_RECOVERY`
   - `FORMAL_RECYCLING`
2. **Closed Decision Enforcements:**
   - *Decision A:* Damaged screen without repair quote $\rightarrow$ remains `REPAIR` candidate with `RULE_REP_003_ECONOMIC_FEASIBILITY_UNCONFIRMED`.
   - *Decision B:* Data sanitization $\rightarrow$ blocking flag `dataSanitizationRequired = true` with NIST SP 800-88 Rev. 2 guidance (assessment only; no claim of wiping).
   - *Decision C:* Missing modular part prices $\rightarrow$ report physical manifest; return `salvageYieldTotal = null` and `status = "DATA_UNAVAILABLE"`.
   - *Decision D:* Age $\ge 10.0$ years triggers obsolescence review (`FORMAL_RECYCLING`), but safety hazards strictly override age.
3. **Decoupled Engine Core:** Build `@engine/core` as a pure, zero-dependency TypeScript package.

### Phase 4: Acceptance-Driven Test Suite Implementation
1. **Test-First Methodology:** Implement the 21 concrete acceptance test cases defined in [ACCEPTANCE_TEST_PLAN.md](file:///d:/E-CyclePilot/ACCEPTANCE_TEST_PLAN.md) using Vitest.
2. **Test File Organization:**
   - `tests/unit/safety-gate.spec.ts`: Test swelling, thermal, chemical, compound hazards, and safety overriding age (TC-SAF-001 to 006).
   - `tests/unit/pathways.spec.ts`: Test reuse, refurbishment, parts recovery, recycling (TC-USE-001 to 002, TC-REF-001, TC-CMP-001 to 003, TC-REC-001).
   - `tests/unit/economics.spec.ts`: Test viable repair, prohibitive repair (>70%), missing repair quotes, and missing financial data (TC-REP-001 to 003, TC-MIS-001 to 002).
   - `tests/unit/validation.spec.ts`: Test invalid categories, logical contradictions, and edge age boundaries (TC-INV-001 to 002, TC-EDG-001).
3. **Verification Target:** 100% pass rate (21 of 21 tests).

### Phase 5: Decision Engine & Backend Implementation
1. **Functional Pipeline:** Implement pure functions:
   `validateInput()` $\rightarrow$ `evaluateSafetyGate()` $\rightarrow$ `evaluateDataSecurity()` $\rightarrow$ `evaluatePathwayEligibility()` $\rightarrow$ `calculateEconomics()` $\rightarrow$ `synthesizeExplanation()`.
2. **Economic Module (Configurable Project Heuristic):**
   - Cost Ratio: $\frac{\text{estimatedRepairCost}}{\text{estimatedMarketValue}}$.
   - Configurable Heuristic Rule: Ratio $\le 0.70 \implies$ viable. Ratio $> 0.70 \implies$ prohibitive (downgrade to `COMPONENT_RECOVERY` or `FORMAL_RECYCLING`).
3. **Fastify Server:** Lightweight HTTP API exposing `/health`, `/api/v1/scenarios`, and `/api/v1/assess` with schema validation.

### Phase 6: Web Client & User Interface Development
1. **Stack:** React 18+, Vite, TypeScript, modular Vanilla CSS.
2. **Key UI Modules:**
   - Ingestion form with validation.
   - Single-click preset scenario toolbar (21 test fixtures available).
   - High-visibility amber/red hazard banner for `SPECIAL_HANDLING`.
   - Data sanitization warning badge for un-wiped drives.
   - Side-by-side pathway comparison cards.
   - Financial breakdown or `DATA_UNAVAILABLE` badges.
   - Export buttons for Markdown and JSON reports.

### Phase 7: Comprehensive Verification & Linting
1. Static analysis: `tsc --noEmit` and ESLint with 0 warnings/errors.
2. Full automated test run: `npm test` passing all 21 test cases.

### Phase 8: GitHub Repository Setup & CI/CD Pipeline
1. Setup repository structure (`/client`, `/server`, `/packages/engine`).
2. Configure GitHub Actions workflow running lint, typecheck, and test suite on all pull requests.

### Phase 9: Staging & Cloud Deployment
1. Frontend deployed to **Vercel** as static SPA.
2. Backend deployed to **Render** as containerized Node.js service.
3. Verify CORS configuration between Vercel domain and Render API.

### Phase 10: Operational Audit & Acceptance Sign-Off
1. Execute live smoke tests against deployed endpoints.
2. Confirm 21 acceptance tests pass in continuous integration.
3. Sign-off and handover.
