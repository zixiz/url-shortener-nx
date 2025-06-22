# ---- Stage 1: Build the React application ----
FROM node:22-slim AS builder
WORKDIR /app


COPY package.json package-lock.json* ./ 
COPY nx.json ./
COPY tsconfig.base.json ./

COPY apps/client-app/package.json ./apps/client-app/package.json
COPY apps/client-app/tsconfig.json ./apps/client-app/tsconfig.json
COPY apps/client-app/tsconfig.app.json ./apps/client-app/tsconfig.app.json
COPY apps/client-app/vite.config.ts ./apps/client-app/vite.config.ts


COPY apps/client-app/src ./apps/client-app/src
COPY apps/client-app/index.html ./apps/client-app/index.html 
COPY apps/client-app/public ./apps/client-app/public 


RUN npm install 

ENV NX_DAEMON=false

ARG VITE_MANAGEMENT_API_URL_ARG
ENV VITE_MANAGEMENT_API_URL=${VITE_MANAGEMENT_API_URL_ARG}

ARG VITE_APP_BASE_URL_ARG
ENV VITE_APP_BASE_URL=${VITE_APP_BASE_URL_ARG}

RUN npx nx build client-app --configuration=production

# ---- Stage 2: Serve the static assets with Nginx ----
FROM nginx:1.25-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY apps/client-app/nginx.conf /etc/nginx/conf.d/default.conf 
COPY --from=builder /app/dist/apps/client-app /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]