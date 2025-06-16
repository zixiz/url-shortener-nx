# apps/client-app/Dockerfile

# ---- Stage 1: Build the React application ----
FROM node:22-slim AS builder
WORKDIR /app


COPY package.json package-lock.json* ./ 
COPY nx.json ./
COPY tsconfig.base.json ./

# Copy the specific application's package.json (if it has one for Nx config)
# and its tsconfig files, and Vite config.
# These paths are relative to the build context (workspace root).
COPY apps/client-app/package.json ./apps/client-app/package.json
COPY apps/client-app/tsconfig.json ./apps/client-app/tsconfig.json
COPY apps/client-app/tsconfig.app.json ./apps/client-app/tsconfig.app.json
COPY apps/client-app/vite.config.ts ./apps/client-app/vite.config.ts

# Copy the application source code and its public assets (like index.html)
COPY apps/client-app/src ./apps/client-app/src
COPY apps/client-app/index.html ./apps/client-app/index.html 
COPY apps/client-app/public ./apps/client-app/public 

# If your client-app depends on shared libraries (e.g., libs/shared)
# ensure they are copied here as well.
# COPY libs/shared ./libs/shared

# Install ALL dependencies (including devDependencies needed for Nx build)
RUN npm install 
# Or: RUN npm ci

# Set environment to disable Nx Daemon
ENV NX_DAEMON=false

# Pass VITE_ environment variables as build arguments
# These will be baked into the static JS bundle by Vite during the build.
# The values will come from docker-compose build args, which can read from the root .env
ARG VITE_MANAGEMENT_API_URL_ARG
ENV VITE_MANAGEMENT_API_URL=${VITE_MANAGEMENT_API_URL_ARG}

ARG VITE_APP_BASE_URL_ARG
ENV VITE_APP_BASE_URL=${VITE_APP_BASE_URL_ARG}

# Build the React application for production using Nx
# Nx Vite plugin typically outputs to dist/apps/client-app
RUN npx nx build client-app --configuration=production

# ---- Stage 2: Serve the static assets with Nginx ----
FROM nginx:1.25-alpine

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration (we'll create this next)
COPY apps/client-app/nginx.conf /etc/nginx/conf.d/default.conf 

# Copy built static assets from the builder stage's dist directory
# The `nx build client-app` output path is usually `dist/apps/client-app`
# Inside this directory, Vite places the final assets (index.html, js, css in an assets folder).
COPY --from=builder /app/dist/apps/client-app /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]