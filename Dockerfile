# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json ./

# Install dependencies with npm
RUN npm install

# Copy source code
COPY . .

# Sync SvelteKit and build the application
RUN npx svelte-kit sync
RUN NODE_ENV=production npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Copy package files from builder
COPY --from=builder /app/package.json ./

# Install only production dependencies (excludes devDependencies like esbuild)
RUN npm install --omit=dev && \
    # Remove npm and related packages to eliminate glob vulnerabilities
    npm cache clean --force && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack ~/.npm

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
