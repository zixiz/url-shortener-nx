# apps/management-service/Dockerfile

# ---- Builder Stage ----
# Use a Node.js version that matches your development environment or project requirements.
# node:22-slim is a good balance for a builder.
FROM node:22-slim AS builder
WORKDIR /app

# Copy root package files, nx.json, and base tsconfig first
# This allows Docker to cache the 'npm install' layer if these don't change often.
COPY package.json package-lock.json* ./ 
# If you use npm ci, ensure package-lock.json is preferred:
# COPY package.json package-lock.json ./ 
COPY nx.json ./
COPY tsconfig.base.json ./

# Copy the specific application's package.json (if it exists and has unique deps/scripts for Nx)
# and its tsconfig files.
COPY apps/management-service/package.json ./apps/management-service/package.json
COPY apps/management-service/tsconfig.json ./apps/management-service/tsconfig.json
COPY apps/management-service/tsconfig.app.json ./apps/management-service/tsconfig.app.json

# Copy the application source code
COPY apps/management-service/src ./apps/management-service/src

# If your management-service depends on shared libraries (e.g., libs/shared)
# you need to copy them too so Nx can resolve them during the build.
# Ensure the path is relative to the WORKDIR /app (workspace root)
# Example:
# COPY libs/shared ./libs/shared

# Install ALL dependencies (including devDependencies needed for Nx build)
# Using npm ci is generally recommended for CI/Docker for reproducible builds from lockfile
RUN npm ci
# If not using npm ci, then:
# RUN npm install

# Set environment to disable Nx Daemon, which can be problematic in CI/Docker
ENV NX_DAEMON=false

# Build the specific application for production
# Nx reads the outputPath from apps/management-service/package.json
# which should be "dist/apps/management-service"
RUN npx nx build management-service --configuration=production

# After the build, prune devDependencies from the node_modules in this builder stage.
# This makes the node_modules copied to the runtime stage smaller.
RUN npm prune --production

# ---- Runtime Stage ----
# Use a smaller Node.js image like alpine for the runtime.
FROM node:22-alpine AS runtime

# Set environment variables
ENV NODE_ENV=production
# PORT will be set by docker-compose using the value from the root .env file
# (e.g., MANAGEMENT_SERVICE_INTERNAL_PORT)
# ENV PORT=3001 # Default if not overridden

WORKDIR /app

# Copy the pruned production node_modules from the builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy the built application from the builder stage.
# This copies the contents of /app/dist/apps/management-service from builder
# into /app in the runtime stage.
COPY --from=builder /app/dist/apps/management-service ./

# (Optional but good practice) Copy the root package.json if your app needs it at runtime
# for metadata or if start scripts are complex. For a simple `node main.js`,
# and if main.js has `#!/usr/bin/env node`, it might not be strictly needed
# if all dependencies are correctly found in node_modules.
# However, the `type: "module"` from the *built* package.json (copied from dist above)
# is what tells Node how to run main.js if it's ESM.
# If the built output (dist/apps/management-service) does not contain its own package.json
# with "type": "module", then you might need to copy the source one or create one.
# Your esbuild config (format: "esm") should handle generating a package.json with type:module in dist.

# Expose the port the app runs on (as defined by ENV PORT)
EXPOSE ${PORT}

# Command to run the application.
# Assumes main.js is now at /app/main.js due to the COPY from dist.
CMD ["node", "main.js"]