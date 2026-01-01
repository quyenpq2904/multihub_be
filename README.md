# multihub_be

## Overview

### Purpose and Scope

This document provides a high-level introduction to the `multihub_be` repository, explaining its purpose, architecture, and organization. The repository is an Nx monorepo containing a microservices-based backend system built with NestJS, along with a frontend application.

### What is multihub_be

The `multihub_be` repository is a monorepo workspace managing distributed applications, specifically **Messenger** (currently available) and **SketchRoom** (coming soon). It implements a microservices architecture where independent NestJS applications operate as backend services, coordinated through an API Gateway pattern. The system supports real-time collaborative features, design management, asset handling, and user interactions through a combination of REST APIs, WebSocket connections, gRPC remote procedure calls, and event-driven messaging via Kafka.

## Repository Organization

### Nx Monorepo Structure

The repository uses [Nx](https://nx.dev) as its monorepo management tool, enabling efficient code sharing, task orchestration, and build optimization across multiple applications. The workspace is organized into two primary directories:

- `apps/`: Contains the application projects.
- `libs/`: Contains shared libraries.

The Nx workspace configuration defines plugin-based build orchestration using `@nx/webpack/plugin` for application bundling and `@nx/eslint/plugin` for code quality enforcement with module boundary rules.

### Application Projects

The workspace contains eight application projects in the `apps/` directory. The API Gateway (`api-gateway`) serves as the single entry point for client requests, routing them to appropriate backend services based on URL paths and authentication state.

Each service is configured with a unique debug port (9229-9235) for independent development and debugging.

## Technology Stack

### Core Framework and Runtime

The application stack is built on **NestJS 11.x**, a TypeScript-based Node.js framework that provides dependency injection, modular architecture, and built-in support for microservices patterns.

### Key Dependencies

- **Core**: `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`
- **Microservices & Communication**: `@nestjs/microservices`, `@grpc/grpc-js`, `kafkajs`
- **Real-time**: `socket.io`, `@nestjs/websockets`, `@socket.io/redis-adapter`
- **Database & Caching**: `typeorm`, `pg` (PostgreSQL), `ioredis` (Redis), `@nestjs/typeorm`
- **Security & Validation**: `@nestjs/jwt`, `argon2`, `class-validator`, `class-transformer`
- **Documentation**: `@nestjs/swagger`

## Architecture Patterns

### Service Communication

The system implements multiple communication patterns optimized for different use cases:

- **API Gateway**: Entry point for client requests.
- **gRPC**: Efficient inter-service communication.
- **WebSocket (Socket.IO)**: Real-time communication for features like chat and collaboration.
- **Kafka**: Event-driven messaging for asynchronous processing.

### Data Access Patterns

Data persistence is managed through **TypeORM**, providing an object-relational mapping layer over **PostgreSQL**. **Redis** serves dual purposes: caching frequently accessed data and providing pub/sub messaging for the Socket.IO adapter to enable horizontally scaled WebSocket connections.

### Security Implementation

Authentication and authorization use JWT (JSON Web Tokens) managed by `@nestjs/jwt` with a dual-token architecture: short-lived access tokens and long-lived refresh tokens. Password storage employs `argon2`, a memory-hard hashing algorithm resistant to GPU-based cracking attacks. The API Gateway validates tokens before routing requests to backend services.

## Development Tooling

### Build System

The monorepo uses **Nx** with plugin-based task orchestration. The `@nx/webpack` plugin compiles TypeScript applications to JavaScript bundles, while `@nx/eslint-plugin` enforces architectural boundaries preventing circular dependencies between applications and libraries.

### Code Quality Standards

The workspace enforces code quality through:

- **ESLint** and **typescript-eslint** for static analysis.
- **Prettier** for consistent code formatting.
- **TypeScript** for type safety.
- **Module boundary enforcement** via `@nx/eslint-plugin` to maintain service isolation.

## Deployment Model

The system deploys as containerized services orchestrated by Docker Compose. The CI/CD pipeline, implemented with GitHub Actions, triggers on semantic version tags (`v*.*.*`) and executes on a self-hosted runner.

The workflow performs:

1. Code checkout.
2. Environment variable injection.
3. Docker Compose build and deployment with `docker compose up --build -d`.

This deployment strategy enables zero-downtime updates through container orchestration and ensures consistent environments across development and production.

## Getting Started

To begin working with the repository:

1.  **Development setup**: Configure the Nx workspace and install dependencies.
2.  **Run services locally**: Use `npx nx serve <service-name>` to start individual applications.
3.  **Debug services**: Attach VS Code debugger using preconfigured launch configurations.
4.  **Build for production**: Execute `npx nx build <service-name>` to create production bundles.
