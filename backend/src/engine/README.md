# Decision Engine Module (@engine/core)

This directory is reserved for the pure, deterministic expert rule engine for **E-CyclePilot**.

### Principles:

1. **Isolated Pure Functions:** Zero transport layer (HTTP/Fastify) dependencies.
2. **Determinism:** Bitwise identical outputs for identical inputs.
3. **Safety Dominance:** Safety rules (`SPECIAL_HANDLING`) take unconditional precedence over economic valuation.
4. **Zero Fabrication:** Omitted inputs remain explicitly `DATA_UNAVAILABLE`.

_Note: Core triage rules and decision evaluation logic will be implemented in the next test-driven checkpoint._
