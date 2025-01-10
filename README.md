# Express.js OpenAPI Framework

A batteries-included Express.js framework with automatic OpenAPI documentation generation, request/response validation, and API versioning.

## Features

- 🚀 Express.js based REST API framework
- 📚 Automatic OpenAPI/Swagger documentation generation
- ✅ Request/Response validation using Zod
- 🔄 Auto-loading of route modules
- 🛡️ Built-in security with Helmet
- 🌐 CORS support
- 🎯 TypeScript support
- 🔢 Built-in API versioning (v1)
- 📖 Multiple API documentation UIs (Swagger, ReDoc, Scalar)
- 🔥 Hot-reload in development
- 🏭 Production-ready build setup

## Project Structure

```
src/
├── app/                    # Application modules
│   ├── users/             # User module example
│   │   ├── users.routes.ts # Route definitions
│   │   └── users.schema.ts # Zod schemas
│   ├── todos/             # Todo module example
│   │   ├── todos.routes.ts
│   │   └── todos.schema.ts
│   └── health/            # Health check module
│       ├── health.routes.ts
│       └── health.schema.ts
├── lib/                   # Framework core
│   ├── openapi.ts        # OpenAPI configuration
│   └── router.ts         # Route builder
├── config/               # Configuration
│   ├── env.ts           # Environment variables
│   └── logger.ts        # Logging configuration
└── index.ts             # Application entry point
```

## Module Structure

Each module should follow this structure:

1. `*.routes.ts` - Route definitions with handlers
```typescript
import { ModuleRoutes } from '../../lib/openapi';
import { MySchema } from './my.schema';

const routes: ModuleRoutes = [
  {
    method: 'get',
    path: '/',
    schema: {
      response: MySchema,
    },
    handler: async (req, res) => {
      // Your handler logic
      return { data: 'example' };
    },
    summary: 'List items',
    description: 'Get a list of items',
    tags: ['MyModule']
  }
];

module.exports = routes;
module.exports.default = routes;
```

2. `*.schema.ts` - Zod schemas for validation
```typescript
import { z } from 'zod';

export const MySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
}).openapi('MySchema');
```

## Environment Modes

### Development Mode
- Uses TypeScript files directly
- Hot-reload enabled
- Detailed error logging
- Pretty-printed logs
- Source maps enabled

```bash
npm run dev
```

### Production Mode
- Uses compiled JavaScript
- Optimized for performance
- Minimal error logging
- JSON formatted logs
- No source maps

```bash
npm run build
npm run start:prod
```

## API Documentation

The framework automatically generates OpenAPI documentation from your route definitions and schemas. Access the documentation at:

- Swagger UI: `http://localhost:3456/api/docs/swagger`
- ReDoc: `http://localhost:3456/api/docs/redoc`
- Scalar: `http://localhost:3456/api/docs/scalar`
- OpenAPI JSON: `http://localhost:3456/api/docs/api.json`

## Docker Support

### Production
```bash
docker compose build api
docker compose up api
```

### Development with Hot-Reload
```bash
docker compose --profile dev up api-dev
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3456
NODE_ENV=development

# API
API_PREFIX=/api

# Documentation
DOCS_ENABLED=true

# Security
CORS_ORIGIN=*
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=debug
PRETTY_LOGGING=true
```

## Scripts

- `npm run dev`: Start development server with hot-reload
- `npm run build`: Build for production
- `npm run start:prod`: Start production server
- `npm run lint`: Run linter
- `npm run format`: Format code
- `npm run clean`: Clean build directory

## Adding a New Module

1. Create a new directory under `src/app/`
2. Create two files:
   - `<module>.schema.ts`: Define your Zod schemas
   - `<module>.routes.ts`: Define your routes

The framework will automatically:
- Load your routes
- Generate OpenAPI documentation
- Add validation
- Mount endpoints under `/api/v1/<module>`

## Error Handling

The framework includes built-in error handling for:
- Validation errors (400)
- Not found errors (404)
- Internal server errors (500)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

ISC 