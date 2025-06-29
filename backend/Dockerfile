# Stage 1: Builder - Build the entire monorepo and create a deployment package
FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app

# Copy workspace setup files and all package.json files to leverage cache
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY packages/common/package.json ./packages/common/package.json

# Install all dependencies across the workspace
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build the required packages
RUN pnpm run build --filter @prnews/common
RUN pnpm run build --filter @prnews/backend

# Create a self-contained, production-ready deployment package for the backend.
# `pnpm deploy` copies only production dependencies and necessary files.
RUN pnpm deploy --filter=@prnews/backend /deploy


# Stage 2: Production - Run the deployed application
FROM node:20-alpine AS runner
WORKDIR /app

# Set the environment to production
ENV NODE_ENV=production

# Copy the deployed application from the builder stage.
# The /deploy directory contains the backend code and its production node_modules.
COPY --from=builder /deploy .

# Expose the port the app runs on
EXPOSE 8080

# The command is relative to the new WORKDIR.
# `pnpm deploy` preserves the package structure.
CMD ["node", "backend/dist/src/index.js"]
