# URL Shortener NX

A fullstack monorepo project for a scalable URL shortener, built with Nx. It features a modern web frontend, backend microservices, authentication, and integrations with Redis and RabbitMQ.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## Project Structure

```
apps/
  management-service/   # Backend management API (Node.js, Express)
  redirect-service/     # Redirect microservice (Node.js, Express)
  web-app/              # Frontend (React, Next.js, Tailwind, Redux)
  web-app-e2e/          # End-to-end tests (Playwright)
libs/
  shared/               # Shared code and types
```

- **management-service**: Handles user management, URL creation, stats, and authentication APIs.
- **redirect-service**: Handles fast URL redirection and click tracking.
- **web-app**: Modern frontend for users to register, login, manage URLs, and view stats.

---

## Features

- URL shortening and redirection
- User registration and authentication
- Management dashboard for URLs and stats
- Click tracking and analytics
- Modern UI with dark/light mode
- Scalable microservice architecture
- Redis caching
- RabbitMQ for event/message passing

---

## Tech Stack

- **Monorepo:** Nx
- **Frontend:** React, Next.js, Redux, MUI, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** (Add your DB, e.g., PostgreSQL, MongoDB)
- **Cache:** Redis
- **Messaging:** RabbitMQ

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Redis
- RabbitMQ
- (Optional) Docker

### Installation

1. Clone the repository:
   ```powershell
   git clone <your-repo-url>
   cd url-shortener-nx
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Copy and configure environment variables for each service (see `.env.example` or service docs).
4. Start Redis and RabbitMQ (locally or via Docker):
   ```powershell
   docker-compose up -d
   ```
5. Run the development servers:
   ```powershell
   npx nx serve management-service
   npx nx serve redirect-service
   npx nx serve web-app
   ```

---

## Usage

- Access the web app at [http://localhost:4200](http://localhost:4200) (or your configured port).
- Register/login, create short URLs, and view stats.
- Use API endpoints (see code/docs in `apps/management-service/src/routes/`).

---

## Development

- Add new apps/libs with Nx:
  ```powershell
  npx nx generate @nx/node:app my-new-service
  ```
- Lint, format, and test code with Nx commands.
- Use shared code from `libs/shared`.

---

## Contributing

1. Fork the repo and create your branch.
2. Make your changes and add tests.
3. Submit a pull request.

---

## License

MIT

---

## Credits

Created by Shahar and contributors.
