import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
config();

// Environment variables schema
const envSchema = z.object({
  // Server
  PORT: z.string().default('3456'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // API
  API_PREFIX: z.string().default('/api'),

  // Documentation
  DOCS_ENABLED: z.string().transform(val => val === 'true').default('true'),

  // Security
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('15'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  PRETTY_LOGGING: z.string().transform(val => val === 'true').default('true'),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

export default env; 