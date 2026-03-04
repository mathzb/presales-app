# Multi-stage build for production

# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (include dev deps for build)
# Install all deps for build (dev deps are needed by Vite)
# Do NOT set NODE_ENV=production in the builder stage or devDeps (vite) won't be installed
RUN npm ci

# Copy source code
COPY . .

# Build the application
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
# The VITE_* ARGs are available during this RUN; Vite will inline them at build time
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 8080

# Health check (inside container)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
