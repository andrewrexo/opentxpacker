# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies (update lockfile for new adapter-node)
RUN bun install

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Copy package files from builder
COPY --from=builder /app/package.json ./

# Copy node_modules from builder (already installed)
COPY --from=builder /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder /app/build ./build

# Expose the port the app runs on
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Run the Node.js server
CMD ["node", "build"]
