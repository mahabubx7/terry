import { Request, Response } from 'express';
import { ModuleRoutes } from '../../lib/openapi';
import { HealthCheckResponse } from './health.schema';
import os from 'os';

const routes: ModuleRoutes = [
  {
    method: 'get',
    path: '/',
    schema: {
      response: HealthCheckResponse,
    },
    handler: async (req: Request, res: Response) => {
      const used = process.memoryUsage();
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        memory: {
          used: Math.round(used.heapUsed / 1024 / 1024),
          total: Math.round(os.totalmem() / 1024 / 1024),
        },
      };
    },
    summary: 'Health Check',
    description: 'Get application health status',
    tags: ['Health'],
  }
];

module.exports = routes;
module.exports.default = routes; 