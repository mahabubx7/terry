import { z } from 'zod';

export const HealthCheckResponse = z.object({
  status: z.enum(['ok', 'error']),
  timestamp: z.string().datetime(),
  version: z.string(),
  uptime: z.number().positive(),
  memory: z.object({
    used: z.number().int().positive(),
    total: z.number().int().positive(),
  }),
}).openapi('HealthCheckResponse'); 