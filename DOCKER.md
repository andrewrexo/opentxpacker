# Docker Deployment

This document describes how to run OpenTXPacker using Docker.

## Quick Start

### Using Docker Compose (Recommended)

```bash
docker compose up -d
```

The application will be available at http://localhost:3000

### Using Docker CLI

```bash
docker build -t opentxpacker .
docker run -p 3000:3000 opentxpacker
```

### Cloudflare Tunnel Deployment (Recommended for Production)

For secure, production-ready deployment without opening ports:

```bash
docker compose -f docker-compose.cloudflare.yml up -d
```

This setup uses Cloudflare Tunnel to expose your application securely to the internet without port forwarding. See [CLOUDFLARE.md](CLOUDFLARE.md) for detailed setup instructions.

## Using Pre-built Images from GitHub Container Registry

Pre-built multi-architecture images (amd64, arm64) are available from GitHub Container Registry:

### Pull and Run Latest Image

```bash
# Pull the latest image
docker pull ghcr.io/andrewrexo/opentxpacker:latest

# Run the container
docker run -d -p 3000:3000 --name opentxpacker ghcr.io/andrewrexo/opentxpacker:latest
```

### Pull Specific Version

```bash
# Pull a specific version (e.g., v1.0.0)
docker pull ghcr.io/andrewrexo/opentxpacker:v1.0.0

# Or by commit SHA
docker pull ghcr.io/andrewrexo/opentxpacker:master-abc1234
```

### Using with Docker Compose

Create a `docker-compose.yml` file:

```yaml
services:
  opentxpacker:
    image: ghcr.io/andrewrexo/opentxpacker:latest
    container_name: opentxpacker
    ports:
      - "3000:3000"
    restart: unless-stopped
```

Then run:

```bash
docker compose up -d
```

## Architecture Support

The Docker images are built for the following architectures:
- `linux/amd64` (x86_64 - Standard desktops, servers, cloud)
- `linux/arm64` (ARM 64-bit - Apple Silicon, newer ARM servers, Raspberry Pi 4/5 64-bit)

Docker will automatically pull the correct image for your platform.

**Note**: The Docker image uses Node.js 24 Alpine for minimal size and maximum security. npm is removed from the production image to eliminate all package vulnerabilities.

## Environment Variables

- `NODE_ENV` - Set to `production` (default)
- `HOST` - Host to bind to (default: `0.0.0.0`)
- `PORT` - Port to listen on (default: `3000`)

Example with custom port:

```bash
docker run -d -p 8080:8080 -e PORT=8080 ghcr.io/andrewrexo/opentxpacker:latest
```

## GitHub Actions Workflow

Images are automatically built and pushed to GitHub Container Registry when:
- Code is pushed to `master` or `main` branch
- A new tag is created (e.g., `v1.0.0`)
- Manually triggered via GitHub Actions

### Image Tags

The following tags are automatically generated:
- `latest` - Latest build from the default branch
- `v1.0.0`, `v1.0`, `v1` - Semantic version tags
- `master` - Latest build from master branch
- `master-<sha>` - Specific commit from master branch
- `2025-12-27-20-04` - Build timestamp in UTC (YYYY-MM-DD-HH-mm format)

## Building Locally

To build the Docker image locally:

```bash
# Build for your current architecture
docker build -t opentxpacker .

# Build for multiple architectures (requires buildx)
docker buildx build --platform linux/amd64,linux/arm64 -t opentxpacker .
```

## Troubleshooting

### Container logs

```bash
# View logs
docker compose logs -f

# Or for standalone container
docker logs -f opentxpacker
```

### Container not starting

Check if port 3000 is already in use:

```bash
# On Linux/macOS
lsof -i :3000

# Change to a different port
docker run -p 8080:3000 opentxpacker
```

### Accessing from other devices

Make sure to expose the port on your host's IP address. The container binds to `0.0.0.0` by default, so it should be accessible from other devices on your network at `http://<your-ip>:3000`.
