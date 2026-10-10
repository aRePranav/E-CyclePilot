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

## Project Disclaimers
- **Data Sanitization:** The application assesses whether media sanitization is required based on storage telemetry; it does not perform physical media wiping, validate sanitization operations, or issue certificates of destruction.
- **Economic Heuristic:** The 70% repair-cost-to-market-value ceiling is a configurable project heuristic to prevent net-negative recovery attempts. It is not an established universal standard.
- **Deterministic Rules:** Core triage decisions are produced by an auditable, deterministic expert rule engine without black-box AI overrides.
