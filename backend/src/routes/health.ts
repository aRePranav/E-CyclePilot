import { FastifyInstance, FastifyPluginAsync } from 'fastify';

export interface HealthResponse {
  status: 'ok';
  application: string;
  version: string;
}

export const healthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get<{ Reply: HealthResponse }>('/api/v1/health', async (_request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      application: 'E-CyclePilot',
      version: '0.1.0',
    });
  });
};
