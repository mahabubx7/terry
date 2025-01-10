import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { OpenAPIConfig } from './lib/openapi';
import { RouteBuilder } from './lib/router';
import swaggerUi from 'swagger-ui-express';
import { apiReference } from '@scalar/express-api-reference';
import env from './config/env';
import logger from './config/logger';
import { requestLogger, errorLogger } from './lib/middleware';

const app = express();

// Basic middleware
app.use(express.json());
app.use(cors({
  origin: env.CORS_ORIGIN
}));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Request logging
app.use(requestLogger);

logger.info('🔧 Initializing API router...');

// Initialize API router with versioning
const apiRouter = RouteBuilder.buildApiRouter();
app.use('/api', apiRouter);

logger.info('📚 Generating API documentation...');

// Generate OpenAPI document
OpenAPIConfig.generateDocument().then(openApiDoc => {
  if (env.DOCS_ENABLED) {
    // Serve OpenAPI document
    app.get(`/api/docs/api.json`, (req, res) => {
      res.json(openApiDoc);
    });

    // Swagger UI
    app.use(`/api/docs/swagger`, swaggerUi.serve, swaggerUi.setup(openApiDoc, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customCss: '.swagger-ui .topbar { display: none }',
    }));

    // ReDoc UI
    app.get(`/api/docs/redoc`, (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>API Documentation</title>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
            <link href="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.css" rel="stylesheet">
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: Inter, system-ui, -apple-system, sans-serif;
              }
              :root {
                --primary-color: #2563eb;
              }
            </style>
          </head>
          <body>
            <div id="redoc"></div>
            <script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script>
            <script>
              Redoc.init(
                '/api/docs/api.json',
                {
                  hideDownloadButton: false,
                  hideLoading: false,
                  noAutoAuth: true,
                  theme: {
                    colors: {
                      primary: {
                        main: '#2563eb'
                      }
                    },
                    typography: {
                      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                      fontSize: '14px',
                      headings: {
                        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                      }
                    },
                    sidebar: {
                      width: '300px'
                    }
                  }
                },
                document.getElementById('redoc')
              );
            </script>
          </body>
        </html>
      `);
    });

    // Scalar API Reference
    app.use(`/api/docs/scalar`, apiReference({
      spec: {
        url: `/api/docs/api.json`,
      },
      configuration: {
        title: 'API Reference',
        layout: 'modern',
        logo: 'https://raw.githubusercontent.com/scalar/scalar/main/assets/logo-light.svg',
        hideInternal: false,
        defaultShowExample: true,
        expandResponses: '200,201',
        hideSidebarSearch: false,
        theme: {
          colors: {
            primary: {
              main: '#2563eb'
            }
          },
          typography: {
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            headings: {
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            }
          },
          sidebar: {
            width: '300px'
          }
        }
      }
    }));

    logger.info('📚 API Documentation:');
    logger.info(`   - Swagger UI: http://localhost:${env.PORT}/api/docs/swagger`);
    logger.info(`   - ReDoc: http://localhost:${env.PORT}/api/docs/redoc`);
    logger.info(`   - Scalar: http://localhost:${env.PORT}/api/docs/scalar`);
    logger.info(`   - OpenAPI JSON: http://localhost:${env.PORT}/api/docs/api.json`);
  }

  // Start server
  app.listen(env.PORT, () => {
    logger.info(`🚀 Server is running on port ${env.PORT}`);
  });
});

// Error handling middleware
app.use(errorLogger);
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}); 