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
RUN pnpm nx build api-gateway

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/dist/apps/api-gateway/package*.json ./

# Install production dependencies
RUN npm install --omit=dev

COPY --from=builder /app/dist/apps/api-gateway/ .

CMD ["node", "main.js"]

