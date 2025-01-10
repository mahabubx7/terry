import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import glob from 'glob';
import logger from '../config/logger';
import path from 'path';

// Extend Zod with OpenAPI functionality
extendZodWithOpenApi(z);

export class OpenAPIConfig {
  private static registry: OpenAPIRegistry;
  private static readonly API_VERSION = 'v1';

  static {
    this.registry = new OpenAPIRegistry();
  }

  static getRegistry(): OpenAPIRegistry {
    return this.registry;
  }

  static async generateDocument() {
    try {
      // Find all route files
      const isDevelopment = process.env.NODE_ENV === 'development';
      const modulePattern = isDevelopment ? 'src/app/**/*.routes.ts' : 'dist/app/**/*.routes.js';
      const routeFiles = glob.sync(modulePattern);
      const modules = new Set(routeFiles.map((file: string) => 
        path.basename(path.dirname(file))
      ));

      logger.info(`📝 Generating OpenAPI documentation for ${modules.size} modules in ${isDevelopment ? 'development' : 'production'} mode`);

      // Register error schemas
      const ErrorSchema = z.object({
        message: z.string(),
        stack: z.string().optional(),
      });

      // Register ID parameter schema
      const IdParamSchema = z.object({
        id: z.string().uuid()
      });

      this.registry.register('Error', ErrorSchema);
      this.registry.register('IdParam', IdParamSchema);

      // Load all routes and their schemas
      for (const module of Array.from(modules)) {
        try {
          const moduleNameCapitalized = module.charAt(0).toUpperCase() + module.slice(1);
          const modulePath = path.resolve(process.cwd(), isDevelopment 
            ? `src/app/${module}/${module}.routes.ts`
            : `dist/app/${module}/${module}.routes.js`
          );
          
          // Clear require cache in development mode
          if (isDevelopment) {
            delete require.cache[require.resolve(modulePath)];
          }
          
          // Import routes
          const routes = isDevelopment 
            ? require(modulePath).default
            : require(modulePath);

          if (!Array.isArray(routes)) {
            throw new Error(`Module ${module} does not export routes array as default export`);
          }

          // Register routes for OpenAPI
          routes.forEach((route: RouteConfig) => {
            const { method, path: routePath, schema, summary, description, tags } = route;
            const versionedPath = `/v1/${module}${routePath}`;

            if (schema) {
              // Register the path
              this.registry.registerPath({
                method,
                path: versionedPath,
                summary: summary || `${method.toUpperCase()} ${moduleNameCapitalized}${routePath === '/' ? ' list' : ''}`,
                description: description || `${method.toUpperCase()} ${moduleNameCapitalized}${routePath === '/' ? ' list' : ''} endpoint`,
                tags: tags || [moduleNameCapitalized],
                request: schema.body ? {
                  body: {
                    content: {
                      'application/json': {
                        schema: schema.body
                      }
                    }
                  }
                } : undefined,
                parameters: routePath.includes(':id') ? [
                  {
                    in: 'path' as const,
                    name: 'id',
                    required: true,
                    description: 'Resource ID',
                    schema: { $ref: '#/components/schemas/IdParam' }
                  }
                ] : undefined,
                responses: {
                  200: {
                    description: 'Successful response',
                    content: schema.response ? {
                      'application/json': {
                        schema: schema.response
                      }
                    } : undefined
                  },
                  400: {
                    description: 'Bad request',
                    content: {
                      'application/json': {
                        schema: ErrorSchema
                      }
                    }
                  },
                  404: {
                    description: 'Not found',
                    content: {
                      'application/json': {
                        schema: ErrorSchema
                      }
                    }
                  }
                }
              });
            }
          });
          logger.info(`📖 Generated OpenAPI specs for ${moduleNameCapitalized} module`);
        } catch (error: any) {
          logger.error(`❌ Failed to load routes for module ${module}:`, isDevelopment ? error : error.message);
        }
      }

      const generator = new OpenApiGeneratorV3(this.registry.definitions);

      const doc = generator.generateDocument({
        openapi: '3.0.0',
        info: {
          version: this.API_VERSION,
          title: 'API Reference',
          description: 'API documentation with OpenAPI specification',
          contact: {
            name: 'API Support',
            email: 'support@example.com'
          }
        },
        servers: [
          {
            url: '/api',
            description: 'API Server'
          }
        ],
        tags: Array.from(modules).map(module => ({
          name: module.charAt(0).toUpperCase() + module.slice(1),
          description: `${module.charAt(0).toUpperCase() + module.slice(1)} management endpoints`
        }))
      });

      logger.info('✨ OpenAPI documentation generated successfully');
      return doc;
    } catch (error) {
      logger.error('❌ Failed to generate OpenAPI documentation:', error);
      throw error;
    }
  }
}

export type RouteConfig = {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  path: string;
  handler: Function;
  schema?: {
    body?: z.ZodType<any>;
    response?: z.ZodType<any>;
    query?: z.ZodType<any>;
    params?: z.ZodType<any>;
  };
  summary?: string;
  description?: string;
  tags?: string[];
};

export type ModuleRoutes = RouteConfig[]; 