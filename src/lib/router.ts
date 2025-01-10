import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import path from 'path';
import logger from '../config/logger';
import glob from 'glob';
import { fileURLToPath } from 'url';
import { z } from 'zod';

type RouteMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'connect' | 'trace' | 'patch' | 'all';
type RouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

interface Route {
  method: RouteMethod;
  path: string;
  handler: RouteHandler;
  schema?: {
    response?: z.ZodType<any>;
    body?: z.ZodType<any>;
    query?: z.ZodType<any>;
    params?: z.ZodType<any>;
  };
}

export class RouteBuilder {
  private static readonly API_VERSION = 'v1';
  private static readonly isDevelopment = process.env.NODE_ENV === 'development';

  static buildApiRouter(): Router {
    const apiRouter = Router();
    
    try {
      // Mount module routers under versioned API prefix
      const modulePattern = this.isDevelopment ? 'src/app/**/*.routes.ts' : 'dist/app/**/*.routes.js';
      const moduleFiles = glob.sync(modulePattern);
      logger.info(`🔍 Found ${moduleFiles.length} route modules in ${this.isDevelopment ? 'development' : 'production'} mode`);
      
      const versionRouter = Router();
      
      moduleFiles.forEach((file: string) => {
        try {
          const moduleName = path.basename(path.dirname(file));
          const modulePath = path.resolve(process.cwd(), file);

          // Clear require cache in development mode
          if (this.isDevelopment) {
            delete require.cache[require.resolve(modulePath)];
          }
          
          // Import routes
          const routes = this.isDevelopment 
            ? require(modulePath).default  // Development: ES modules with default export
            : require(modulePath);         // Production: CommonJS modules
            
          if (!Array.isArray(routes)) {
            throw new Error(`Module ${moduleName} does not export routes array as default export`);
          }
          
          const moduleRouter = this.registerRoutes(routes, moduleName);
          versionRouter.use(`/${moduleName}`, moduleRouter);
          logger.info(`✅ Mounted ${moduleName} module at /v1/${moduleName}`);
        } catch (error) {
          logger.error(`❌ Failed to load module: ${file}`, error);
          if (this.isDevelopment) {
            logger.error('Error details:', error);
          }
        }
      });

      // Mount version router under /v1
      apiRouter.use(`/${this.API_VERSION}`, versionRouter);
      logger.info(`🚀 API Router initialized with version ${this.API_VERSION} in ${this.isDevelopment ? 'development' : 'production'} mode`);

      return apiRouter;
    } catch (error) {
      logger.error('❌ Failed to build API router:', error);
      throw error;
    }
  }

  private static registerRoutes(routes: Route[], moduleName: string): Router {
    const router = Router();
    
    routes.forEach(route => {
      const { method, path, handler, schema } = route;
      const routeHandler: RequestHandler = async (req, res, next) => {
        try {
          // Validate request parameters if schemas are provided
          if (schema?.body) {
            req.body = await schema.body.parseAsync(req.body);
          }
          if (schema?.query) {
            req.query = await schema.query.parseAsync(req.query);
          }
          if (schema?.params) {
            req.params = await schema.params.parseAsync(req.params);
          }

          // Execute handler
          const result = await handler(req, res, next);

          // If response has already been sent, return
          if (res.headersSent) {
            return;
          }

          // Validate and transform response if schema is provided
          if (schema?.response && result !== undefined) {
            try {
              const validatedResponse = await schema.response.parseAsync(result);
              res.json(validatedResponse);
              return;
            } catch (error) {
              if (error instanceof z.ZodError) {
                logger.error(`Response validation failed for ${method.toUpperCase()} ${path}:`, error.errors);
                res.status(422).json({
                  message: 'Response validation failed',
                  errors: error.errors
                });
                return;
              }
              throw error;
            }
          }

          // Send raw result if no response schema
          res.json(result);
          return;
        } catch (error) {
          if (error instanceof z.ZodError) {
            res.status(400).json({
              message: 'Validation error',
              errors: error.errors
            });
            return;
          }
          next(error);
        }
      };

      (router as any)[method](path, routeHandler);
      logger.info(`📍 Registered ${method.toUpperCase()} ${path} for ${moduleName}`);
    });
    
    return router;
  }
} 