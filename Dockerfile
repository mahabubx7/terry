# Build stage
FROM node:20-alpine as builder

# Add build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy only the production build and package files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev && \
    npm cache clean --force

# Set environment variables
ENV NODE_ENV=production \
    PORT=3456 \
    API_PREFIX=/api \
    DOCS_ENABLED=true \
    CORS_ORIGIN=* \
    LOG_LEVEL=info \
    PRETTY_LOGGING=false

# Create non-root user
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

USER appuser

# Expose port
EXPOSE 3456

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3456/api/v1/health || exit 1

# Start the server
CMD ["node", "dist/main.js"] 