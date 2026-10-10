import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

describe('Health Endpoint (GET /api/v1/health)', () => {
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

  it('starts without error and responds to GET /api/v1/health with HTTP 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body).toEqual({
      status: 'ok',
      application: 'E-CyclePilot',
      version: '0.1.0',
    });
  });

  it('handles CORS correctly for allowed development origin', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
      headers: {
        origin: 'http://localhost:5173',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('blocks disallowed origin via CORS policy with clean HTTP 403', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
      headers: {
        origin: 'http://malicious-site.com',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    const body = JSON.parse(response.payload);
    expect(body.statusCode).toBe(403);
    expect(body.error).toBe('Forbidden');
    expect(body.message).toContain('not allowed by CORS policy');
    expect(response.payload).not.toContain('node_modules');
    expect(response.payload).not.toContain('stack');
  });
});
