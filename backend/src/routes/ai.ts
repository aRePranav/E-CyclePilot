// ============================================================================
// E-CyclePilot: AI Assessment Explanation Route (POST /api/v1/ai/explain)
// ============================================================================

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { validateExplainRequest } from '../ai/validator.js';
import { aiRateLimiter } from '../ai/rateLimiter.js';
import {
  getGeminiProvider,
  GeminiConfigurationError,
  GeminiEmptyResponseError,
  GeminiTimeoutError,
} from '../ai/gemini.js';

export const aiRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post(
    '/api/v1/ai/explain',
    {
      bodyLimit: 32_768, // 32 KB maximum payload size
    },
    async (request, reply) => {
      // 1. Rate Limiting Check
      const clientIp = request.ip || request.socket.remoteAddress || 'unknown';
      const rateCheck = aiRateLimiter.check(clientIp);

      if (!rateCheck.allowed) {
        reply.header('Retry-After', String(rateCheck.retryAfterSeconds));
        return reply.status(429).send({
          success: false,
          statusCode: 429,
          error: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Please wait ${rateCheck.retryAfterSeconds} seconds before requesting another AI explanation.`,
        });
      }

      // 2. Input Validation
      const validation = validateExplainRequest(request.body);
      if (!validation.valid || !validation.data) {
        const err = validation.error!;
        return reply.status(err.statusCode).send({
          success: false,
          statusCode: err.statusCode,
          error: err.error,
          message: err.message,
        });
      }

      // 3. Generate Explanation via Gemini Provider
      try {
        const provider = getGeminiProvider();
        const explanation = await provider.generateExplanation(validation.data);

        return reply.status(200).send({
          success: true,
          explanation,
        });
      } catch (err: unknown) {
        if (err instanceof GeminiConfigurationError) {
          return reply.status(503).send({
            success: false,
            statusCode: 503,
            error: 'SERVICE_UNAVAILABLE',
            message:
              'AI explanation service is currently unavailable (API key not configured). The assessment decision remains fully valid.',
          });
        }

        if (err instanceof GeminiTimeoutError) {
          return reply.status(504).send({
            success: false,
            statusCode: 504,
            error: 'GATEWAY_TIMEOUT',
            message:
              'AI explanation provider timed out. The assessment decision remains fully valid.',
          });
        }

        if (err instanceof GeminiEmptyResponseError) {
          return reply.status(502).send({
            success: false,
            statusCode: 502,
            error: 'BAD_GATEWAY',
            message: 'AI explanation provider returned an empty response. Please try again.',
          });
        }

        // Generic Provider / Network Failure (sanitized: never leak stack traces or internal keys)
        return reply.status(502).send({
          success: false,
          statusCode: 502,
          error: 'PROVIDER_ERROR',
          message:
            'An error occurred while contacting the AI explanation service. The assessment decision remains fully valid.',
        });
      }
    },
  );
};
