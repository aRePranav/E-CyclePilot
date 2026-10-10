// ============================================================================
// INTEGRATION TEST SUITE: FASTIFY ASSESSMENT API (POST /api/v1/assess)
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { assessDevice } from '../engine/index.js';
import { validateAssessmentInput } from '../engine/validator.js';
import {
  TC_SAF_001_PAYLOAD,
  TC_USE_001_PAYLOAD,
  TC_REP_001_PAYLOAD,
  TC_CMP_003_PAYLOAD,
  TC_INV_001_PAYLOAD,
  TC_INV_002_PAYLOAD,
} from './fixtures/scenarios.js';
import { SAMPLE_SCENARIOS } from '../../../frontend/src/fixtures/sampleScenarios.js';

describe('Assessment API Integration Tests (POST /api/v1/assess)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({
      corsOrigins: ['http://localhost:5173'],
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // --------------------------------------------------------------------------
  // 1. Valid device assessment returns HTTP 200
  // --------------------------------------------------------------------------
  it('returns HTTP 200 for a valid assessment payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/assess',
      payload: TC_USE_001_PAYLOAD,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.statusCode).toBe(200);
    expect(body.assessmentId).toBeDefined();
    expect(body.primaryPathway).toBe('REUSE');
  });

  // --------------------------------------------------------------------------
  // 2. TC-SAF-001 returns SPECIAL_HANDLING
  // --------------------------------------------------------------------------
  it('TC-SAF-001 routes confirmed swollen battery to SPECIAL_HANDLING with safety alert', async () => {
    const expectedCanonical = assessDevice(TC_SAF_001_PAYLOAD);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/assess',
      payload: TC_SAF_001_PAYLOAD,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.primaryPathway).toBe('SPECIAL_HANDLING');
    expect(body.safetyAlert.active).toBe(true);
    expect(body.safetyAlert.hazardLevel).toBe('CRITICAL');
    expect(body.disqualifiedPathways).toContain('REUSE');
    expect(body.disqualifiedPathways).toContain('REPAIR');
    expect(body.reasonCodes).toContain('RULE_SAF_001_BATTERY_SWELLING_CONFIRMED');
    expect(body.reasonCodes).toContain('COMMERCIAL_VALUE_OVERRIDDEN_BY_SAFETY');

    // Canonical parity verification with direct engine output (excluding dynamic operational metadata)
    expect(body.assessmentId).toMatch(
      /^ECP-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    const { assessmentId: _bodyId1, timestamp: _bodyTs1, ...bodyDecision1 } = body;
    const {
      assessmentId: _canId1,
      timestamp: _canTs1,
      ...canDecision1
    } = JSON.parse(JSON.stringify(expectedCanonical));
    expect(bodyDecision1).toEqual(canDecision1);
  });

  // --------------------------------------------------------------------------
  // 3. TC-USE-001 returns the expected reuse result
  // --------------------------------------------------------------------------
  it('TC-USE-001 returns pristine direct REUSE result matching direct engine evaluation', async () => {
    const expectedCanonical = assessDevice(TC_USE_001_PAYLOAD);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/assess',
      payload: TC_USE_001_PAYLOAD,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.primaryPathway).toBe('REUSE');
    expect(body.reasonCodes).toContain('RULE_USE_001_FULLY_FUNCTIONAL_PRISTINE');
    expect(body.complianceFlags.dataSanitizationRequired).toBe(false);
    expect(body.disqualifiedPathways).toContain('SPECIAL_HANDLING');

    // Canonical parity verification with direct engine output (excluding dynamic operational metadata)
    expect(body.assessmentId).toMatch(
      /^ECP-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    const { assessmentId: _bodyId2, timestamp: _bodyTs2, ...bodyDecision2 } = body;
    const {
      assessmentId: _canId2,
      timestamp: _canTs2,
      ...canDecision2
    } = JSON.parse(JSON.stringify(expectedCanonical));
    expect(bodyDecision2).toEqual(canDecision2);
  });

  // --------------------------------------------------------------------------
  // 4. TC-REP-001 returns the expected repair/economic result
  // --------------------------------------------------------------------------
  it('TC-REP-001 returns REPAIR recommendation with positive economic yield', async () => {
    const expectedCanonical = assessDevice(TC_REP_001_PAYLOAD);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/assess',
      payload: TC_REP_001_PAYLOAD,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.primaryPathway).toBe('REPAIR');
    expect(body.reasonCodes).toContain('RULE_REP_001_ISOLATED_DEFECT_ECONOMICALLY_VIABLE');
    expect(body.financialSummary.status).toBe('CALCULATED');
    expect(body.financialSummary.netRepairMargin).toBe(195.0);
    expect(body.financialSummary.costRatioPercent).toBe(30.4);

    // Canonical parity verification with direct engine output (excluding dynamic operational metadata)
    expect(body.assessmentId).toMatch(
      /^ECP-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    const { assessmentId: _bodyId3, timestamp: _bodyTs3, ...bodyDecision3 } = body;
    const {
      assessmentId: _canId3,
      timestamp: _canTs3,
      ...canDecision3
    } = JSON.parse(JSON.stringify(expectedCanonical));
    expect(bodyDecision3).toEqual(canDecision3);
  });

  // --------------------------------------------------------------------------
  // 5. TC-CMP-003 retains component manifest and reports unavailable monetary yield
  // --------------------------------------------------------------------------
  it('TC-CMP-003 retains component harvest manifest and reports DATA_UNAVAILABLE monetary status', async () => {
    const expectedCanonical = assessDevice(TC_CMP_003_PAYLOAD);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/assess',
      payload: TC_CMP_003_PAYLOAD,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(body.primaryPathway).toBe('COMPONENT_RECOVERY');
    expect(body.reasonCodes).toContain('RULE_CMP_001_VALUABLE_MODULAR_COMPONENTS_HARVESTABLE');
    expect(body.harvestManifest).toHaveLength(2);
    expect(body.financialSummary.status).toBe('DATA_UNAVAILABLE');
    expect(body.financialSummary.salvageYieldTotal).toBeNull();

    // Canonical parity verification with direct engine output (excluding dynamic operational metadata)
    expect(body.assessmentId).toMatch(
      /^ECP-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    const { assessmentId: _bodyId4, timestamp: _bodyTs4, ...bodyDecision4 } = body;
    const {
      assessmentId: _canId4,
      timestamp: _canTs4,
      ...canDecision4
    } = JSON.parse(JSON.stringify(expectedCanonical));
    expect(bodyDecision4).toEqual(canDecision4);
  });

  // --------------------------------------------------------------------------
  // 6. TC-INV-001 returns HTTP 400 for an unsupported device category
  // --------------------------------------------------------------------------
  it('TC-INV-001 returns HTTP 400 BAD_REQUEST for unsupported device category', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/assess',
      payload: TC_INV_001_PAYLOAD,
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(400);
    expect(body.error).toBe('BAD_REQUEST');
    expect(body.message).toContain('MICROWAVE');
  });

  // --------------------------------------------------------------------------
  // 7. TC-INV-002 returns HTTP 400 for contradictory telemetry
  // --------------------------------------------------------------------------
  it('TC-INV-002 returns HTTP 400 LOGICAL_CONTRADICTION for contradictory power/boot telemetry', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/assess',
      payload: TC_INV_002_PAYLOAD,
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(400);
    expect(body.error).toBe('LOGICAL_CONTRADICTION');
    expect(body.message).toContain('cannot boot OS while powerState is NO_POWER');
  });

  // --------------------------------------------------------------------------
  // 8. Missing, malformed, or invalid JSON bodies are rejected safely
  // --------------------------------------------------------------------------
  describe('Input body edge-case handling', () => {
    it('rejects absent body with HTTP 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/assess',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(400);
      expect(body.message).toContain('non-null object');
    });

    it('rejects null body with HTTP 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/assess',
        headers: { 'content-type': 'application/json' },
        body: 'null',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(400);
      expect(body.message).toContain('non-null object');
    });

    it('rejects an array body with HTTP 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/assess',
        payload: [1, 2, 3],
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(400);
      expect(body.message).toContain('non-null object');
    });

    it('rejects malformed JSON syntax with HTTP 400 safely', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/assess',
        headers: { 'content-type': 'application/json' },
        body: '{"device": { "category": ',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.statusCode).toBe(400);
      expect(body.error).toBeDefined();
    });

    it('rejects empty string JSON body with HTTP 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/assess',
        headers: { 'content-type': 'application/json' },
        body: '',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.statusCode).toBe(400);
    });

    it('rejects payload exceeding 64KB body limit with HTTP 413', async () => {
      const oversizedPayload = {
        ...TC_USE_001_PAYLOAD,
        padding: 'A'.repeat(70000), // > 64KB
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/assess',
        payload: oversizedPayload,
      });

      expect(response.statusCode).toBe(413);
      const body = JSON.parse(response.payload);
      expect(body.statusCode).toBe(413);
    });
  });

  // --------------------------------------------------------------------------
  // 9. Unsupported HTTP methods are rejected appropriately
  // --------------------------------------------------------------------------
  describe('Unsupported HTTP methods', () => {
    it('rejects GET /api/v1/assess with 404', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/assess',
      });

      expect(response.statusCode).toBe(404);
    });

    it('rejects PUT /api/v1/assess with 404', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/assess',
        payload: TC_USE_001_PAYLOAD,
      });

      expect(response.statusCode).toBe(404);
    });

    it('rejects DELETE /api/v1/assess with 404', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/assess',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  // --------------------------------------------------------------------------
  // 10. The response includes no stack trace or confidential data
  // --------------------------------------------------------------------------
  describe('Information Disclosure & Security Checks', () => {
    const sensitiveTokens = [
      'at Function.',
      'at Object.',
      'node_modules',
      'at Fastify',
      'process.env',
      'password',
      'secret',
      'apiKey',
    ];

    it('ensures success response contains no stack traces or server paths', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/assess',
        payload: TC_USE_001_PAYLOAD,
      });

      expect(response.statusCode).toBe(200);
      for (const token of sensitiveTokens) {
        expect(response.payload).not.toContain(token);
      }
    });

    it('ensures error response for malformed JSON contains no stack traces or paths', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/assess',
        headers: { 'content-type': 'application/json' },
        body: '{"invalid": true',
      });

      expect(response.statusCode).toBe(400);
      for (const token of sensitiveTokens) {
        expect(response.payload).not.toContain(token);
      }
      expect(response.payload).not.toContain('D:/E-CyclePilot');
      expect(response.payload).not.toContain('d:\\E-CyclePilot');
    });

    it('ensures error response for invalid category contains no stack traces', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/assess',
        payload: TC_INV_001_PAYLOAD,
      });

      expect(response.statusCode).toBe(400);
      for (const token of sensitiveTokens) {
        expect(response.payload).not.toContain(token);
      }
    });

    it('allows requests from configured development origin with proper CORS header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/assess',
        headers: {
          origin: 'http://localhost:5173',
        },
        payload: TC_USE_001_PAYLOAD,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('blocks disallowed origin on assessment endpoint with HTTP 403 and no CORS headers', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/assess',
        headers: {
          origin: 'http://malicious-site.com',
        },
        payload: TC_USE_001_PAYLOAD,
      });

      expect(response.statusCode).toBe(403);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      const body = JSON.parse(response.payload);
      expect(body.statusCode).toBe(403);
      expect(body.error).toBe('Forbidden');
      expect(body.message).toContain('not allowed by CORS policy');
      for (const token of sensitiveTokens) {
        expect(response.payload).not.toContain(token);
      }
    });

    it('permits server-to-server requests without Origin header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/assess',
        payload: TC_USE_001_PAYLOAD,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Frontend-Backend Contract Parity: Synthetic Demo Scenarios
  // --------------------------------------------------------------------------
  describe('Frontend-Backend Contract Parity: Synthetic Demo Scenarios', () => {
    it('contains exactly six synthetic demo scenarios in the frontend fixture', () => {
      expect(SAMPLE_SCENARIOS).toHaveLength(6);
      const ids = SAMPLE_SCENARIOS.map((s) => s.id);
      expect(ids).toEqual([
        'hazardous-battery',
        'pristine-reuse',
        'viable-repair',
        'refurbishment-candidate',
        'component-recovery-unpriced',
        'formal-recycling-obsolete',
      ]);
    });

    for (const scenario of SAMPLE_SCENARIOS) {
      it(`evaluates frontend scenario "${scenario.id}" (${scenario.name}) to expected pathway "${scenario.expectedPathway}" with HTTP 200`, async () => {
        // A. Validate payload schema against backend validator
        const validation = validateAssessmentInput(scenario.payload);
        expect(validation.valid).toBe(true);

        // B. Submit to real in-process Fastify route
        const response = await app.inject({
          method: 'POST',
          url: '/api/v1/assess',
          payload: scenario.payload,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(true);
        expect(body.statusCode).toBe(200);
        expect(body.assessmentId).toBeDefined();

        // C. Check expected primary pathway
        expect(body.primaryPathway).toBe(scenario.expectedPathway);

        // D. Verify response schema compliance
        expect(body.pathwayComparison).toHaveLength(6);
        for (const item of body.pathwayComparison) {
          expect(['RECOMMENDED', 'ELIGIBLE', 'DISQUALIFIED']).toContain(item.status);
          expect(typeof item.score).toBe('number');
          expect(typeof item.rationale).toBe('string');
        }

        // The primary pathway must have status RECOMMENDED
        const recommendedItem = body.pathwayComparison.find(
          (p: { pathway: string }) => p.pathway === scenario.expectedPathway,
        );
        expect(recommendedItem?.status).toBe('RECOMMENDED');

        // E. Scenario-specific invariant assertions
        if (scenario.id === 'hazardous-battery') {
          expect(body.safetyAlert.active).toBe(true);
          expect(body.safetyAlert.hazardLevel).toBe('CRITICAL');
          expect(body.disqualifiedPathways).toEqual(
            expect.arrayContaining([
              'REUSE',
              'REPAIR',
              'REFURBISHMENT',
              'COMPONENT_RECOVERY',
              'FORMAL_RECYCLING',
            ]),
          );
        } else if (scenario.id === 'pristine-reuse') {
          expect(body.safetyAlert.active).toBe(false);
          expect(body.complianceFlags.dataSanitizationRequired).toBe(false);
        } else if (scenario.id === 'viable-repair') {
          expect(body.financialSummary.status).toBe('CALCULATED');
          expect(body.financialSummary.costRatioPercent).toBeLessThanOrEqual(70);
          expect(body.reasonCodes).toContain('RULE_REP_001_ISOLATED_DEFECT_ECONOMICALLY_VIABLE');
        } else if (scenario.id === 'refurbishment-candidate') {
          expect(body.reasonCodes).toContain('RULE_REF_001_MULTI_POINT_MAINTENANCE_REQUIRED');
          expect(body.eligiblePathways).toContain('REFURBISHMENT');
        } else if (scenario.id === 'component-recovery-unpriced') {
          expect(body.reasonCodes).toContain(
            'RULE_CMP_001_VALUABLE_MODULAR_COMPONENTS_HARVESTABLE',
          );
          expect(body.harvestManifest).toHaveLength(2);
          expect(body.financialSummary.status).toBe('DATA_UNAVAILABLE');
          expect(body.financialSummary.salvageYieldTotal).toBeNull();
        } else if (scenario.id === 'formal-recycling-obsolete') {
          expect(body.reasonCodes).toContain('RULE_REC_001_ARCHITECTURAL_OBSOLESCENCE');
          expect(body.disqualifiedPathways).toContain('REUSE');
        }
      });
    }
  });

  // --------------------------------------------------------------------------
  // Runtime Operational Metadata & Deterministic Business Engine Preservation
  // --------------------------------------------------------------------------
  describe('Runtime Operational Metadata and Deterministic Business Decisions', () => {
    // A. Unique IDs:
    it('generates unique assessment IDs (ECP-uuid) for repeated identical requests', async () => {
      const payload = TC_USE_001_PAYLOAD;

      const res1 = await app.inject({
        method: 'POST',
        url: '/api/v1/assess',
        payload,
      });
      const res2 = await app.inject({
        method: 'POST',
        url: '/api/v1/assess',
        payload,
      });

      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);

      const body1 = JSON.parse(res1.payload);
      const body2 = JSON.parse(res2.payload);

      const uuidRegex = /^ECP-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(body1.assessmentId).toMatch(uuidRegex);
      expect(body2.assessmentId).toMatch(uuidRegex);

      expect(body1.assessmentId).not.toBe(body2.assessmentId);
    });

    // B. Valid timestamps:
    it('generates a valid ISO 8601 UTC timestamp falling within the request execution window', async () => {
      const beforeTime = Date.now();

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/assess',
        payload: TC_USE_001_PAYLOAD,
      });

      const afterTime = Date.now();

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);

      expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      const parsedTs = Date.parse(body.timestamp);
      expect(Number.isNaN(parsedTs)).toBe(false);

      expect(parsedTs).toBeGreaterThanOrEqual(beforeTime - 2000);
      expect(parsedTs).toBeLessThanOrEqual(afterTime + 2000);
    });

    // C. Deterministic business decisions:
    it('preserves complete determinism of all decision fields across repeated identical requests', async () => {
      const payload = TC_REP_001_PAYLOAD;

      const res1 = await app.inject({
        method: 'POST',
        url: '/api/v1/assess',
        payload,
      });
      const res2 = await app.inject({
        method: 'POST',
        url: '/api/v1/assess',
        payload,
      });

      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);

      const body1 = JSON.parse(res1.payload);
      const body2 = JSON.parse(res2.payload);

      // Business decision fields must remain strictly identical
      expect(body1.primaryPathway).toBe(body2.primaryPathway);
      expect(body1.primaryRationale).toBe(body2.primaryRationale);
      expect(body1.safetyAlert).toEqual(body2.safetyAlert);
      expect(body1.complianceFlags).toEqual(body2.complianceFlags);
      expect(body1.eligiblePathways).toEqual(body2.eligiblePathways);
      expect(body1.disqualifiedPathways).toEqual(body2.disqualifiedPathways);
      expect(body1.disqualificationReasons).toEqual(body2.disqualificationReasons);
      expect(body1.pathwayComparison).toEqual(body2.pathwayComparison);
      expect(body1.reasonCodes).toEqual(body2.reasonCodes);
      expect(body1.actionChecklist).toEqual(body2.actionChecklist);
      expect(body1.harvestManifest).toEqual(body2.harvestManifest);
      expect(body1.financialSummary).toEqual(body2.financialSummary);

      // Excluding operational metadata (assessmentId and timestamp), payloads are completely equal
      const { assessmentId: _id1, timestamp: _ts1, ...decision1 } = body1;
      const { assessmentId: _id2, timestamp: _ts2, ...decision2 } = body2;
      expect(decision1).toEqual(decision2);
    });
  });
});
