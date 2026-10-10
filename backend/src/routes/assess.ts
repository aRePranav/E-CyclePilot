import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { assessDevice } from '../engine/index.js';
import type { DeviceAssessmentRequest } from '../engine/types.js';

export const assessRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post<{
    Body: DeviceAssessmentRequest;
  }>('/api/v1/assess', async (request, reply) => {
    const result = assessDevice(request.body);

    if (!result.success) {
      return reply.status(result.statusCode).send(result);
    }

    return reply.status(200).send(result);
  });
};
