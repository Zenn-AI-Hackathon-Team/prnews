# Stage 1: Builder - Build the entire monorepo
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


# Stage 2: Production - Create the final lightweight image
FROM node:20-alpine AS runner
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy only the necessary package manifests and lockfile
COPY package.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY backend/package.json ./backend/
COPY packages/common/package.json ./packages/common/

# Install ONLY production dependencies for the entire workspace RECURSIVELY
# The '-r' flag is crucial for installing dependencies from workspace packages.
RUN pnpm install -r --prod --frozen-lockfile

# Copy the built artifacts from the builder stage
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/packages/common/package.json ./packages/common/package.json

# Expose the port the app runs on
EXPOSE 8080

# Run the application
CMD ["node", "backend/dist/src/index.js"]
