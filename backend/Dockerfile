# Stage 1: Builder
FROM node:20-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy pnpm-workspace.yaml, root package.json, and pnpm-lock.yaml first
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install all dependencies for the entire workspace from the root
# Use --frozen-lockfile to ensure exact dependencies from the lockfile are used
RUN pnpm install --frozen-lockfile

# Copy the rest of the project context
COPY . .

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
