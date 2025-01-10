import { z } from 'zod';

export const HealthCheckResponse = z.object({
  status: z.enum(['ok', 'error']).default('ok'),
  timestamp: z.string().datetime(),
  version: z.string(),
  uptime: z.number(),
  memory: z.object({
    used: z.number(),
    total: z.number(),
  }),
}).openapi('HealthCheck'); 