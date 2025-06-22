# ---- Builder Stage ----
FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json* ./ 

COPY nx.json ./
COPY tsconfig.base.json ./

COPY apps/management-service/package.json ./apps/management-service/package.json
COPY apps/management-service/tsconfig.json ./apps/management-service/tsconfig.json
COPY apps/management-service/tsconfig.app.json ./apps/management-service/tsconfig.app.json

COPY apps/management-service/src ./apps/management-service/src

# RUN npm ci
RUN npm install

ENV NX_DAEMON=false

RUN npx nx build management-service --configuration=production

RUN npm prune --production

# ---- Runtime Stage ----
FROM node:22-alpine AS runtime

# Set environment variables
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist/apps/management-service ./
EXPOSE ${PORT}

CMD ["node", "main.js"]