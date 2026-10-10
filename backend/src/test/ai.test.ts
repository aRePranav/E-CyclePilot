// ============================================================================
// INTEGRATION TEST SUITE: AI EXPLANATION API (POST /api/v1/ai/explain)
// ============================================================================

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import {
  setGeminiProvider,
  resetGeminiProvider,
  GeminiTimeoutError,
  GeminiEmptyResponseError,
} from '../ai/gemini.js';
import { aiRateLimiter } from '../ai/rateLimiter.js';
import type { ExplainAssessmentRequest } from '../ai/types.js';

describe('AI Explanation API Integration Tests (POST /api/v1/ai/explain)', () => {
  let app: FastifyInstance;

  const validPayload: ExplainAssessmentRequest = {
    primaryPathway: 'REUSE',
    primaryRationale:
      'Device is fully functional, structurally intact, and within viable economic age.',
    safetyAlert: {
      active: false,
      hazardLevel: 'NONE',
      hazardsIdentified: [],
      mandatoryContainmentInstructions: [],
    },
    complianceFlags: {
      dataSanitizationRequired: false,
      hazardousTransportRestricted: false,
    },
    actionChecklist: ['Clean exterior and prepare unit for direct redeployment'],
    reasonCodes: ['RULE_USE_001_FULLY_FUNCTIONAL_PRISTINE'],
    assessmentId: 'ECP-TEST-REUSE-001',
    financialSummary: {
      status: 'CALCULATED',
      currency: 'USD',
      estimatedMarketValue: 450.0,
      estimatedRepairCost: 0.0,
      costRatioPercent: 0.0,
      netRepairMargin: 450.0,
      salvageYieldTotal: null,
      notes: 'High margin direct reuse',
    },
  };

  beforeAll(async () => {
    app = await buildApp({
      corsOrigins: ['http://localhost:5173'],
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    aiRateLimiter.reset();
    resetGeminiProvider();
  });

  // --------------------------------------------------------------------------
  // 1. Successful Explanation Response
  // --------------------------------------------------------------------------
  it('returns HTTP 200 with generated explanation using mocked provider', async () => {
    const mockExplanation =
      '### Circularity Decision\n' +
      'The device was routed to **REUSE** because diagnostics confirmed all subsystems are operational.\n\n' +
      '### Safety & Handling Guidance\n' +
      'No hazardous battery distortion was detected.\n\n' +
      '### Operational Next Steps\n' +
      '1. Perform final visual audit.\n' +
      '2. Sanitize and package for secondary deployment.';

    setGeminiProvider({
      generateExplanation: async (data) => {
        expect(data.primaryPathway).toBe('REUSE');
        return mockExplanation;
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/explain',
      payload: validPayload,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.explanation).toBe(mockExplanation);
  });

  // --------------------------------------------------------------------------
  // 2. Missing API Key Returns HTTP 503
  // --------------------------------------------------------------------------
  it('returns HTTP 503 SERVICE_UNAVAILABLE when GEMINI_API_KEY is not configured', async () => {
    const savedKey = process.env.GEMINI_API_KEY;
    try {
      delete process.env.GEMINI_API_KEY;
      resetGeminiProvider(); // Uses RealGoogleGeminiProvider which checks env

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/explain',
        payload: validPayload,
      });

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(503);
      expect(body.error).toBe('SERVICE_UNAVAILABLE');
      expect(body.message).toContain('API key not configured');
    } finally {
      if (savedKey !== undefined) {
        process.env.GEMINI_API_KEY = savedKey;
      }
    }
  });

  // --------------------------------------------------------------------------
  // 3. Provider Timeout Returns HTTP 504
  // --------------------------------------------------------------------------
  it('returns HTTP 504 GATEWAY_TIMEOUT on provider timeout', async () => {
    setGeminiProvider({
      generateExplanation: async () => {
        throw new GeminiTimeoutError('Gemini provider timed out after 12 seconds.');
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/explain',
      payload: validPayload,
    });

    expect(response.statusCode).toBe(504);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(504);
    expect(body.error).toBe('GATEWAY_TIMEOUT');
    expect(body.message).toContain('timed out');
  });

  // --------------------------------------------------------------------------
  // 4. Provider Empty Response Returns HTTP 502
  // --------------------------------------------------------------------------
  it('returns HTTP 502 BAD_GATEWAY on empty output from provider', async () => {
    setGeminiProvider({
      generateExplanation: async () => {
        throw new GeminiEmptyResponseError('Empty explanation response.');
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/explain',
      payload: validPayload,
    });

    expect(response.statusCode).toBe(502);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(502);
    expect(body.error).toBe('BAD_GATEWAY');
    expect(body.message).toContain('empty response');
  });

  // --------------------------------------------------------------------------
  // 5. Provider Unexpected Error Returns Sanitized HTTP 502
  // --------------------------------------------------------------------------
  it('returns sanitized HTTP 502 without leaking provider internal errors or stack traces', async () => {
    setGeminiProvider({
      generateExplanation: async () => {
        throw new Error(
          'INTERNAL_CREDENTIAL_LEAK_SECRET_12345: Network socket reset at ip 10.0.0.1',
        );
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/explain',
      payload: validPayload,
    });

    expect(response.statusCode).toBe(502);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(502);
    expect(body.error).toBe('PROVIDER_ERROR');
    expect(body.message).not.toContain('INTERNAL_CREDENTIAL_LEAK');
    expect(body.message).toContain('AI explanation service');
  });

  // --------------------------------------------------------------------------
  // 6. Invalid Request Validation (HTTP 400)
  // --------------------------------------------------------------------------
  describe('Input validation', () => {
    it('rejects null body with HTTP 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/explain',
        headers: { 'content-type': 'application/json' },
        payload: 'null',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error).toBe('BAD_REQUEST');
    });

    it('rejects non-frozen or invalid primary pathway with HTTP 400', async () => {
      const invalid = { ...validPayload, primaryPathway: 'ARBITRARY_PATHWAY' };
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/explain',
        payload: invalid,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error).toBe('INVALID_PATHWAY');
      expect(body.message).toContain('six frozen pathways');
    });

    it('rejects empty primary rationale with HTTP 400', async () => {
      const invalid = { ...validPayload, primaryRationale: '   ' };
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/explain',
        payload: invalid,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error).toBe('INVALID_RATIONALE');
    });

    it('rejects invalid safetyAlert structure with HTTP 400', async () => {
      const invalid = { ...validPayload, safetyAlert: 'INVALID' };
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/explain',
        payload: invalid,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error).toBe('INVALID_SAFETY_ALERT');
    });
  });

  // --------------------------------------------------------------------------
  // 7. Oversized Request Body (HTTP 413)
  // --------------------------------------------------------------------------
  it('rejects payload exceeding body limit with HTTP 413', async () => {
    const hugeString = 'X'.repeat(40_000); // Exceeds 32 KB limit
    const hugePayload = {
      ...validPayload,
      primaryRationale: hugeString,
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/explain',
      payload: hugePayload,
    });

    expect(response.statusCode).toBe(413);
  });

  // --------------------------------------------------------------------------
  // 8. Rate Limiting (HTTP 429)
  // --------------------------------------------------------------------------
  it('enforces rate limiting and returns HTTP 429 when client threshold is exceeded', async () => {
    // Configure rate limiter to low threshold for deterministic testing
    aiRateLimiter.configure({ maxRequests: 2, windowMs: 60_000 });

    setGeminiProvider({
      generateExplanation: async () => 'Explanation test',
    });

    // Request 1: OK
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/explain',
      payload: validPayload,
    });
    expect(res1.statusCode).toBe(200);

    // Request 2: OK
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/explain',
      payload: validPayload,
    });
    expect(res2.statusCode).toBe(200);

    // Request 3: Rate limited
    const res3 = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/explain',
      payload: validPayload,
    });
    expect(res3.statusCode).toBe(429);
    const body3 = JSON.parse(res3.payload);
    expect(body3.success).toBe(false);
    expect(body3.statusCode).toBe(429);
    expect(body3.error).toBe('TOO_MANY_REQUESTS');
    expect(res3.headers['retry-after']).toBeDefined();
  });
});
