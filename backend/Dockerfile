# Stage 1: Builder
FROM node:20-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace setup files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy all package.json files to leverage Docker cache
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY packages/common/package.json ./packages/common/package.json

# Install all dependencies for the entire workspace
RUN pnpm install --frozen-lockfile

# Copy all source code
# Note: Consider using a .dockerignore file to exclude unnecessary files
COPY . .

# Build workspace packages
RUN pnpm run build --filter @prnews/common
RUN pnpm run build --filter @prnews/backend

# Create a production-ready deployment directory for the backend
RUN pnpm deploy --filter=@prnews/backend --prod /prod


# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Copy the deployed application from the builder stage
COPY --from=builder /prod .

# Expose the port the app runs on
EXPOSE 8080

# Run the application
# The path is relative to the deployment directory structure created by `pnpm deploy`
CMD ["node", "backend/dist/src/index.js"]
