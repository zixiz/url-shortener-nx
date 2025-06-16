# apps/redirect-service/Dockerfile

# ---- Builder Stage ----
FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY apps/redirect-service/package.json ./apps/redirect-service/package.json
COPY apps/redirect-service/tsconfig.json ./apps/redirect-service/tsconfig.json
COPY apps/redirect-service/tsconfig.app.json ./apps/redirect-service/tsconfig.app.json
COPY apps/redirect-service/src ./apps/redirect-service/src
# COPY libs/shared ./libs/shared # If needed

RUN npm install
ENV NX_DAEMON=false 
RUN npx nx build redirect-service --configuration=production
RUN npm prune --production

# ---- Runtime Stage ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=${REDIRECT_SERVICE_INTERNAL_PORT:-3003}

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist/apps/redirect-service ./
COPY --from=builder /app/package.json ./package.json 

EXPOSE ${PORT}
CMD ["node", "main.js"]