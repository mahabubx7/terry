import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import logger from '../config/logger';
import glob from 'glob';
import { fileURLToPath } from 'url';

type RouteMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'connect' | 'trace' | 'patch' | 'all';
type RouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

interface Route {
  method: RouteMethod;
  path: string;
  handler: RouteHandler;
  schema?: {
    response?: any;
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
      const { method, path, handler } = route;
      router[method](path, async (req: Request, res: Response, next: NextFunction) => {
        try {
          const result = await handler(req, res, next);
          // If the response has already been sent (e.g., via res.json or res.send), return
          if (res.headersSent) {
            return;
          }
          // Otherwise, send the result
          res.json(result);
        } catch (error) {
          next(error);
        }
      });
      logger.info(`📍 Registered ${method.toUpperCase()} ${path} for ${moduleName}`);
    });
    
    return router;
  }
} 