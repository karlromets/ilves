# Ilves

This repository contains the frontend and backend services for the Ilves application.

## Project Structure

- `ilves-frontend`: React frontend
- `ilves-backend`: Node.js backend, Hono.js
- `shared/schemas`: Shared Zod schemas for type validation

## Development Setup

### Prerequisites

- Node.js
- PNPM
- Docker and Docker Compose (optional, for containerized deployment)

### Install Dependencies

```bash
# Install all dependencies for all packages
pnpm install
```

### Development

```bash
# Start both frontend and backend in development mode
pnpm dev

# Start only frontend
pnpm dev:frontend

# Start only backend
pnpm dev:backend
```

## Docker Setup

### Build and Run with Docker Compose

```bash
# Build all containers
pnpm docker:build

# Start all containers
pnpm docker:up

# Stop all containers
pnpm docker:down
```

### Docker Configuration

- `docker-compose.yml`: Defines the services (frontend, backend)
- `ilves-frontend/Dockerfile`: Frontend container configuration
- `ilves-backend/Dockerfile`: Backend container configuration
- `ilves-frontend/nginx.conf`: Nginx configuration for serving the frontend and proxying API requests

### Accessing the Application

When running with Docker Compose:

- Frontend: http://localhost
- Backend API: http://localhost/api

