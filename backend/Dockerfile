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


# Stage 2: Production - Create the final image by pruning dev dependencies
FROM node:20-alpine AS runner
WORKDIR /app

# Set the environment to production
ENV NODE_ENV=production

# Install pnpm
RUN npm install -g pnpm

# Copy everything from the builder stage
COPY --from=builder /app .

# Prune development dependencies from the entire workspace
RUN pnpm prune --prod

# Expose the port the app runs on
EXPOSE 8080

# Run the application
CMD ["node", "backend/dist/src/index.js"]
