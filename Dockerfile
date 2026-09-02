FROM node:20-alpine AS base

# Install OpenSSL and dependencies required by Prisma engine on Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy dependency specifications and Prisma schema first for layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js production bundle
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Make entrypoint script executable
RUN chmod +x /app/docker-entrypoint.sh

# Expose BuddyAi application port
EXPOSE 3005

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3005/api/auth/session || exit 1

ENTRYPOINT ["/bin/sh", "/app/docker-entrypoint.sh"]
