import fastify, { FastifyError, FastifyInstance, FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health.js';
import { assessRoutes } from './routes/assess.js';
import { aiRoutes } from './routes/ai.js';

export interface AppOptions extends FastifyServerOptions {
  corsOrigins?: string[];
}

export async function buildApp(opts: AppOptions = {}): Promise<FastifyInstance> {
  const app = fastify({
    bodyLimit: opts.bodyLimit ?? 65536,
    logger: opts.logger ?? {
      level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
    },
    ...opts,
  });

  const envOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  const allowedOrigins = opts.corsOrigins ?? envOrigins;

  await app.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or fastify.inject())
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      const corsError = new Error(`Origin ${origin} not allowed by CORS policy`);
      Object.assign(corsError, { statusCode: 403 });
      callback(corsError, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.setErrorHandler((error: FastifyError | Error, request, reply) => {
    // Return clean HTTP 403 for disallowed CORS origins
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('not allowed by CORS policy')) {
      return reply.status(403).send({
        success: false,
        statusCode: 403,
        error: 'Forbidden',
        message: errorMessage,
      });
    }

    const statusCode =
      'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500;

    if (statusCode < 500) {
      return reply.status(statusCode).send({
        success: false,
        statusCode,
        error: error.name || 'Bad Request',
        message: errorMessage,
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      success: false,
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An unexpected internal error occurred.',
    });
  });

  await app.register(healthRoutes);
  await app.register(assessRoutes);
  await app.register(aiRoutes);

  return app;
}
