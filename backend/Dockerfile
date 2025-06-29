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

# Copy common package source code and tsconfig before building
COPY packages/common/src ./packages/common/src
COPY packages/common/tsconfig.json ./packages/common/tsconfig.json

# Clean and build common package first
WORKDIR /app/packages/common
RUN rm -rf dist
RUN pnpm run build
WORKDIR /app

# Copy the backend source code
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/tsconfig.dts.json ./backend/tsconfig.dts.json
COPY backend/tsconfig.jest.json ./backend/tsconfig.jest.json
COPY backend/.env.example ./backend/.env.example

# Build the backend application
WORKDIR /app/backend
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm globally in runner stage
RUN npm install -g pnpm

# Copy workspace configuration files
COPY pnpm-workspace.yaml .
COPY package.json .
COPY pnpm-lock.yaml .

# Copy package.json files for relevant workspaces
COPY backend/package.json ./backend/package.json
COPY packages/common/package.json ./packages/common/package.json

# Copy built artifacts from the builder stage
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/packages/common/dist ./packages/common/dist

# Install only production dependencies for the workspace
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Set the working directory for running the app
WORKDIR /app/backend

# Expose the port the app runs on
EXPOSE 8080

# Run the application
CMD ["node", "dist/index.js"]
