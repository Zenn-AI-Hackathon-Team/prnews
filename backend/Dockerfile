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
# We use `pnpm --filter <package> build` to avoid running the root build script
# and directly target the build script within each package.
RUN cd packages/common && pnpm run build && cd ../..
RUN cd backend && pnpm run build && cd ..

# Stage 2: Production - The "Kitchen Sink"
# This approach copies the entire application, including dev dependencies,
# to ensure module resolution works exactly like in development.
FROM node:20-alpine AS runner
WORKDIR /app

# Set the environment to production
ENV NODE_ENV=production

# Copy the entire built application from the builder stage
COPY --from=builder /app .

# Expose the port the app runs on
EXPOSE 8080

# Run the application
CMD ["node", "backend/dist/index.js"]
