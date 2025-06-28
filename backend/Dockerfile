# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy pnpm-workspace.yaml and root package.json/pnpm-lock.yaml
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY package.json ./package.json
COPY pnpm-lock.yaml ./pnpm-lock.yaml

# Copy backend's package.json and source code
COPY backend/package.json ./backend/package.json
COPY backend/src ./backend/src

# Install dependencies for the backend workspace
WORKDIR /app/backend
RUN pnpm install --prod

# Build the backend application
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app/backend

# Copy only necessary files from the builder stage
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules # Copy backend's production dependencies
COPY backend/package.json ./package.json

# Expose the port the app runs on
EXPOSE 8080

# Run the application
CMD ["node", "dist/index.js"]