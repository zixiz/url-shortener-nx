# URL Shorty - Full-Stack URL Shortener

URL Shorty is a comprehensive application designed to shorten long URLs into manageable, unique aliases. It features user authentication, URL management, click tracking via RabbitMQ and PostgreSQL, and a responsive React frontend. The entire application is containerized with Docker for easy setup and deployment.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started (Docker Setup)](#getting-started-docker-setup)
- [Local Development (Without Docker for Services)](#local-development-without-docker-for-services)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)

---

## Architecture Overview

The application follows a 3-service architecture:

1.  **Management Service (`apps/management-service`)**:
    - Backend API (Node.js, Express, TypeScript).
    - Handles user authentication (JWT), URL creation/listing, and statistics.
    - Primary data store: PostgreSQL.
    - Publishes new URL mappings to RabbitMQ.
    - Consumes click events from RabbitMQ to update click counts in PostgreSQL.
2.  **Redirection Service (`apps/redirect-service`)**:
    - Lightweight backend (Node.js, Express, TypeScript).
    - Handles `/{shortId}` redirections.
    - Consumes new URL mappings from RabbitMQ to cache in Redis (`shortId -> longUrl`).
    - Publishes click events to RabbitMQ.
3.  **Client App (`apps/client-app`)**:
    - Frontend application (React with Vite, MUI, Tailwind CSS, Redux Toolkit).
    - Provides UI for all user interactions.
    - Communicates with the Management Service API.

## Features

- User registration and JWT-based authentication.
- Shortening of long URLs to unique, 11-character IDs (using `nanoid`).
- Redirection from short URLs to original long URLs.
- Asynchronous click tracking for short URLs, persisted in PostgreSQL.
- Publicly accessible click statistics for any short URL.
- "My URLs" page for authenticated users to view their created links.
- "My Recent Anonymous Links" (max 5) stored in browser `localStorage` for non-authenticated users.
- Dark/Light mode with `localStorage` persistence.
- Responsive UI built with MUI and Tailwind CSS.
- Containerized with Docker for consistent environments.
- Monorepo managed with Nx.

---

## Tech Stack

- **Monorepo:** Nx
- **Frontend (`client-app`):** React (with Vite), Redux Toolkit, MUI, Tailwind CSS, Axios, `react-router-dom`
- **Backend (`management-service`, `redirect-service`):** Node.js, Express, TypeScript
- **Database:** PostgreSQL (via TypeORM in `management-service`)
- **Cache:** Redis (for `redirect-service`)
- **Message Queue:** RabbitMQ
- **Containerization:** Docker, Docker Compose
- **Unique ID Generation:** `nanoid`
- **Logging:** Winston

---

## Prerequisites

- Node.js (e.g., v22.x as used in Dockerfiles)
- npm (e.g., v10.x or v11.x)
- Docker & Docker Compose

---

## Getting Started (Docker Setup - Recommended)

This is the easiest way to get the entire application stack running.

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/zixiz/url-shortener-nx.git
    cd url-shortener-nx
    ```

2.  **Configure Environment:**

    - Copy the root example environment file: `cp .env.example .env`
    - Review and modify `url-shortener-nx/.env` if you need to change default host ports or default credentials for external services (PostgreSQL, RabbitMQ). The defaults provided should work for a clean local setup.
    - Service-specific configurations (like JWT secret, API keys for external services if any) are defined with defaults in `docker-compose.yml` but can be overridden by creating `.env` files inside each `apps/<service-name>/` directory (e.g., `apps/management-service/.env`). For this project, the defaults in `docker-compose.yml` (which reference the root `.env`) should suffice for initial startup.

3.  **Build and Run Docker Containers:**
    From the workspace root:

    ```bash
    docker-compose build
    docker-compose up -d
    ```

    This will:

    - Build Docker images for `management-service`, `redirect-service`, and `client-app`.
    - Start containers for these services plus PostgreSQL, Redis, and RabbitMQ.

4.  **Access Services:**

    - **Frontend (Client App):** `http://localhost:4200` (or `${CLIENT_APP_HOST_PORT}`)
    - **Management Service API (for direct testing):** `http://localhost:3001` (or `${MANAGEMENT_SERVICE_HOST_PORT}`)
    - **Redirect Service (for testing short URLs):** `http://localhost:3003` (or `${REDIRECT_SERVICE_HOST_PORT}`)
    - **RabbitMQ Management UI:** `http://localhost:15672` (user: `guest`, pass: `guest` by default)
    - **PostgreSQL:** Connect via pgAdmin/DBeaver to `localhost:5432` (user/pass/db from root `.env`)
    - **Redis:** Connect via `redis-cli` on `localhost:6379`

5.  **Stopping Services:**
    ```bash
    docker-compose down
    ```
    To also remove volumes (data for Postgres, Redis, RabbitMQ):
    ```bash
    docker-compose down --volumes
    ```

---

## Local Development (Without Docker for Application Services)

If you prefer to run application services directly on your host machine (e.g., for faster iteration during development) while using Docker for external dependencies:

1.  Follow steps 1 & 2 from "Getting Started (Docker Setup)" to clone and install npm dependencies.
2.  **Start External Dependencies with Docker Compose:**
    ```bash
    docker-compose up -d postgres_main redis rabbitmq
    ```
3.  **Setup Service-Specific `.env` Files:**
    - Create/Update `apps/management-service/.env`: Ensure `DATABASE_URL`, `REDIS_URL`, `RABBITMQ_URL` point to `localhost` with the host ports defined in your root `.env` (e.g., `localhost:5432` for DB, `localhost:6379` for Redis, `localhost:5672` for RabbitMQ).
    - Create/Update `apps/redirect-service/.env`: Similar, point `REDIS_URL` and `RABBITMQ_URL` to `localhost` and respective host ports.
    - Create/Update `apps/client-app/.env` (for Vite): Set `VITE_MANAGEMENT_API_URL=http://localhost:3001/api` and `VITE_APP_BASE_URL=http://localhost:3003`.
4.  **Run Each Application Service:**
    Open separate terminals for each:
    ```bash
    npx nx serve management-service
    npx nx serve redirect-service
    npx nx serve client-app
    ```

---

## API Endpoints

(Refer to the "API Endpoints Overview" section from the previous README content you liked, ensuring paths match the `management-service` setup, e.g., `/api/auth/login`, `/api/urls`, `/api/stats/:shortId`).

---

## Environment Variables

- **Root `.env` (for `docker-compose.yml`):** See `.env.example`. Defines ports, default credentials for external services, and build arguments for `client-app`.
- **`apps/management-service/.env`**: See its `.env.example`. Configures database, Redis, RabbitMQ connections (using service names when run in Docker, localhost for local dev), JWT settings, etc.
- **`apps/redirect-service/.env`**: See its `.env.example`. Configures Redis, RabbitMQ connections.
- **`apps/client-app/.env` (used by Vite for `nx serve client-app`):**
  - `VITE_MANAGEMENT_API_URL`: Base URL for the management API.
  - `VITE_APP_BASE_URL`: Base URL for generated short links.

---

## Scripts (Root `package.json`)

- `npm run dev:management`: Serves the management service locally.
- `npm run dev:redirect`: Serves the redirect service locally.
- `npm run dev:client`: Serves the client-app (Vite React frontend) locally.
- `npm run build:management`: Builds the management service for production.
- `npm run build:redirect`: Builds the redirect service for production.
- `npm run build:client`: Builds the client-app for production.
- (Add other common Nx scripts like `lint`, `test` as you implement them)
