# Stage 1: Builder
FROM node:20-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy pnpm-workspace.yaml, root package.json, and pnpm-lock.yaml first
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy all package.json files from workspace packages
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY packages/common/package.json ./packages/common/package.json

# Install all dependencies for the entire workspace from the root
# Use --frozen-lockfile to ensure exact dependencies from the lockfile are used
RUN pnpm install --frozen-lockfile

# Clean and build common package first
WORKDIR /app/packages/common
RUN rm -rf dist
RUN pnpm build

# Copy the backend source code
WORKDIR /app
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/tsconfig.dts.json ./backend/tsconfig.dts.json
COPY backend/tsconfig.jest.json ./backend/tsconfig.jest.json
COPY backend/jest.config.cjs ./backend/jest.config.cjs
COPY backend/.env.example ./backend/.env.example

# Copy common package source code if backend depends on it for build
COPY packages/common/src ./packages/common/src
COPY packages/common/tsconfig.json ./packages/common/tsconfig.json

# Build the backend application
WORKDIR /app/backend
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app/backend

# Copy only necessary files from the builder stage
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./package.json

# Prune development dependencies to keep the image small
RUN pnpm prune --prod

# Expose the port the app runs on
EXPOSE 8080

# Run the application
CMD ["node", "dist/index.js"]
