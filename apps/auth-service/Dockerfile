# Stage 1: Builder
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json .npmrc ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm nx build auth-service

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/dist/apps/auth-service/package*.json ./

# Install production dependencies
RUN npm install --omit=dev
RUN npm install pg

COPY --from=builder /app/dist/apps/auth-service/ .

CMD ["node", "main.js"]

