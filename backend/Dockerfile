# Stage 1: Builder
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

# Stage 2: Production - Debugging
# This stage will not run the app, but will list files to debug the module issue.
FROM node:20-alpine AS runner
WORKDIR /app

# Copy the entire built application from the builder stage
COPY --from=builder /app .

# Expose the port the app runs on
EXPOSE 8080

# DEBUGGING ENTRYPOINT: List directory contents to verify file presence.
# This will override the default command and ensure our debug script runs.
ENTRYPOINT ["sh", "-c", "echo '--- ls -l /app ---' && ls -l /app && echo '--- ls -l /app/node_modules ---' && ls -l /app/node_modules && echo '--- ls -l /app/node_modules/@hono ---' && ls -l /app/node_modules/@hono && echo '--- find /app/node_modules -name \"node-server\" ---' && find /app/node_modules -name \"node-server\" && exit 1"]
