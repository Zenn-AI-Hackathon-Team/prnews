# Stage 1: Builder
FROM node:20-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

# Copy the entire project context into the /app directory in the container
COPY . /app

WORKDIR /app

# Install all dependencies for the entire workspace from the root
# This will create the .pnpm-store and symlinks for workspace packages
RUN pnpm install

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