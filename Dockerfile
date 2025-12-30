# Multi-stage build for minimal production image with static export
# Supports multi-platform builds: linux/amd64, linux/arm64

# Stage 1: Builder
FROM --platform=$BUILDPLATFORM node:25-alpine AS builder

# Build arguments for multi-platform support
ARG BUILDPLATFORM
ARG TARGETPLATFORM
ARG TARGETOS
ARG TARGETARCH

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build static export
RUN npm run build

# Stage 2: Production runtime (serve static files)
FROM --platform=$TARGETPLATFORM node:25-alpine

WORKDIR /app

# Install serve package globally for static file serving
RUN npm install -g serve@latest

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy static export output from builder
COPY --from=builder --chown=nextjs:nodejs /app/out ./out

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start static file server
CMD ["serve", "out", "-p", "3000", "-s"]
