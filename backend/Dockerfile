# Stage 1: Builder
FROM node:20-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

# Copy the entire project context into the /app directory in the container
COPY . /app

WORKDIR /app

# Fetch all dependencies to the pnpm store
RUN pnpm fetch

# Install production dependencies for the entire workspace from the root
RUN pnpm install --prod

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

# Expose the port the app runs on
EXPOSE 8080

# Run the application
CMD ["node", "dist/index.js"]
