# Cloudflare Tunnel Deployment

This guide explains how to deploy OpenTXPacker using Cloudflare Tunnel with Docker. This setup allows you to expose your application to the internet securely without opening any ports on your firewall.

## Benefits

- ✅ **Free forever** - No cost for the tunnel service
- ✅ **No port forwarding** - No need to open ports on your router/firewall
- ✅ **Automatic HTTPS** - Free SSL/TLS certificates from Cloudflare
- ✅ **DDoS protection** - Cloudflare's global network protects your application
- ✅ **Zero Trust security** - Add authentication and access controls
- ✅ **Private networking** - Application only accessible via Cloudflare Tunnel

## Prerequisites

1. A **Cloudflare account** (free tier works)
2. A **domain** added to Cloudflare (or use a Cloudflare subdomain)
3. **Docker** and **Docker Compose** installed on your server
4. **cloudflared CLI** installed on your local machine (for initial setup)

## Installation

### Step 1: Install cloudflared CLI

Choose your platform:

**macOS (Homebrew):**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Linux (Debian/Ubuntu):**
```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

**Linux (RHEL/CentOS):**
```bash
curl -L --output cloudflared.rpm https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-x86_64.rpm
sudo rpm -i cloudflared.rpm
```

**Windows:**
Download from [Cloudflare's releases page](https://github.com/cloudflare/cloudflared/releases)

### Step 2: Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

This will open a browser window to authenticate with your Cloudflare account. Select the domain you want to use.

### Step 3: Create a Tunnel

```bash
cloudflared tunnel create opentxpacker
```

This creates a tunnel and generates credentials. You'll see output like:
```
Tunnel credentials written to: /Users/youruser/.cloudflared/<TUNNEL-ID>.json
Created tunnel opentxpacker with id <TUNNEL-ID>
```

**Important:** Keep note of your `<TUNNEL-ID>`.

### Step 4: Get Your Tunnel Token

Generate a token for your tunnel:

```bash
cloudflared tunnel token opentxpacker
```

This outputs a long token string. Copy it - you'll need it for the next step.

**Alternative:** You can also get the token from the [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/):
1. Go to Networks > Tunnels
2. Find your tunnel and click on it
3. Click "Configure" > "Install Connector"
4. Copy the token from the Docker command shown

### Step 5: Configure DNS

Route your domain/subdomain to the tunnel:

```bash
cloudflared tunnel route dns opentxpacker opentxpacker.example.com
```

Replace `opentxpacker.example.com` with your actual domain and subdomain (e.g., `app.yourdomain.com`).

**Example for a specific domain:**

```bash
# If your domain is example.com, this creates opentxpacker.example.com
cloudflared tunnel route dns opentxpacker opentxpacker.example.com

# Or use a different subdomain on your domain
cloudflared tunnel route dns opentxpacker myapp.example.com
```

**Alternative:** Configure DNS manually in Cloudflare Dashboard:

1. Go to DNS settings for your domain (e.g., `example.com`)
2. Add a CNAME record:
   - Name: `opentxpacker` (this creates `opentxpacker.example.com`)
   - Target: `<TUNNEL-ID>.cfargotunnel.com`
   - Proxy status: Proxied (orange cloud)

### Step 6: Configure the Tunnel

Create a `.env` file in your project root:

```bash
touch .env
```

Add your tunnel token:

```env
TUNNEL_TOKEN=your_very_long_tunnel_token_here
```

**Security Note:** Add `.env` to your `.gitignore` to prevent committing sensitive tokens.

### Step 7: Configure Tunnel Routing

**IMPORTANT:** The DNS route created in Step 5 only creates the DNS record. You still need to configure ingress rules to tell the tunnel where to route traffic.

You have two options:

#### Option A: Dashboard Management (Recommended - Easiest)

**This is the recommended approach for ease of use.**

1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Navigate to **Networks > Tunnels**
3. Find your tunnel (you may see a migration prompt)
4. **Migrate the tunnel to dashboard management** (this is irreversible but much easier to manage)
5. After migration, click on your tunnel name
6. Go to the **Public Hostname** tab
7. Click **Add a public hostname**
8. Configure:
   - **Subdomain**: `opentxpacker` (or your subdomain)
   - **Domain**: Select your domain from dropdown (e.g., `example.com`)
   - **Path**: (leave empty)
   - **Type**: `HTTP`
   - **URL**: `opentxpacker:3000`
9. Click **Save hostname**

Your tunnel will immediately start routing traffic!

#### Option B: Using Configuration File (Keep Token-Based)

**Note:** This approach is more complex and requires maintaining a config file. Most users should use Option A.

If you want to keep the tunnel token-based (not dashboard-managed), you need to add an ingress configuration file:

1. **Find your Tunnel ID:**

   ```bash
   cloudflared tunnel list
   ```

2. **Create `cloudflared-config.yml` in your project root:**

   ```yaml
   tunnel: <TUNNEL-ID>  # Replace with your actual tunnel ID
   credentials-file: /etc/cloudflared/creds.json

   ingress:
     # Route your domain to the internal Docker service
     - hostname: opentxpacker.example.com  # Replace with your actual domain
       service: http://opentxpacker:3000
     # Catch-all rule (required)
     - service: http_status:404
   ```

3. **Copy your tunnel credentials file:**

   ```bash
   # Find your credentials file
   ls ~/.cloudflared/*.json

   # Copy it to your project root
   cp ~/.cloudflared/<TUNNEL-ID>.json ./tunnel-credentials.json
   ```

4. **Update `docker-compose.cloudflare.yml`:**

   Replace the `cloudflared` service with:

   ```yaml
   cloudflared:
     image: cloudflare/cloudflared:latest
     container_name: cloudflared-tunnel
     command: tunnel --config /etc/cloudflared/config.yml run
     volumes:
       - ./cloudflared-config.yml:/etc/cloudflared/config.yml:ro
       - ./tunnel-credentials.json:/etc/cloudflared/creds.json:ro
     restart: unless-stopped
     networks:
       - cloudflare-network
     depends_on:
       - opentxpacker
   ```

5. **Restart the tunnel:**

   ```bash
   docker compose -f docker-compose.cloudflare.yml down
   docker compose -f docker-compose.cloudflare.yml up -d
   ```

**Security:** Make sure to add `tunnel-credentials.json` to your `.gitignore`!

## Deployment

### Start the Application

```bash
docker compose -f docker-compose.cloudflare.yml up -d
```

### Check Status

```bash
# View logs
docker compose -f docker-compose.cloudflare.yml logs -f

# Check if services are running
docker compose -f docker-compose.cloudflare.yml ps
```

### Access Your Application

Your application should now be accessible at:
- `https://app.yourdomain.com` (or whatever subdomain you configured)

**Note:** It may take a few minutes for DNS changes to propagate.

## Verification

### Test the Tunnel Connection

```bash
# Check cloudflared logs
docker logs cloudflared-tunnel

# You should see:
# "Connection <UUID> registered"
# "Route propagating"
```

### Test the Application

```bash
# Test from external network
curl https://app.yourdomain.com

# Should return the HTML of your application
```

## Security Enhancements (Optional)

### Add Email Authentication with Cloudflare Access

Protect your application with email-based authentication using Cloudflare Zero Trust. Users will receive a one-time PIN code to their email to access the application.

#### Step 1: Enable Cloudflare Zero Trust

1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. If this is your first time, you'll be prompted to choose a team name (e.g., `yourcompany`)
3. Your team domain will be: `yourcompany.cloudflareaccess.com`

#### Step 2: Configure Email Authentication (One-time PIN)

1. In the Zero Trust Dashboard, go to **Settings > Authentication**
2. Under "Login methods", find **One-time PIN**
3. Click **Add new** if not already enabled
4. The One-time PIN method is **free and enabled by default** - no configuration needed

**Note:** One-time PIN sends a 6-digit code to the user's email address. This is completely free and doesn't require any third-party integrations.

#### Step 3: Create a Self-Hosted Application

1. Navigate to **Access > Applications**
2. Click **Add an application**
3. Select **Self-hosted**

#### Step 4: Configure Application Details

Configure the following settings:

**Application Configuration:**

- **Application name**: `OpenTXPacker` (or your preferred name)
- **Session Duration**: `24 hours` (or your preference)
- **Application domain**:
  - Enter your full domain: `opentxpacker.example.com`
  - Cloudflare will auto-fill the subdomain and domain fields

**Application Appearance (Optional):**

- **App Launcher visibility**: Toggle ON if you want it visible in the App Launcher
- **Logo**: Upload a custom logo (optional)

Click **Next** to continue to policies.

#### Step 5: Create Access Policy

You need at least one policy to allow users access. Here are common policy configurations:

##### Option A: Allow Specific Email Addresses

1. **Policy name**: `Allow specific users`
2. **Action**: `Allow`
3. **Configure rules**:
   - **Selector**: `Emails`
   - **Value**: Enter email addresses (e.g., `user@example.com, admin@example.com`)

##### Option B: Allow Email Domain

1. **Policy name**: `Allow company domain`
2. **Action**: `Allow`
3. **Configure rules**:
   - **Selector**: `Emails ending in`
   - **Value**: `@example.com` (allows anyone with this email domain)

##### Option C: Allow Everyone (Public with Email Verification)

1. **Policy name**: `Allow all authenticated users`
2. **Action**: `Allow`
3. **Configure rules**:
   - **Selector**: `Everyone`

This allows anyone with a valid email address to authenticate.

##### Additional Policy Options

You can add multiple rules with AND/OR logic:

- **Country**: Restrict by geographic location
- **IP ranges**: Allow only specific IP addresses or ranges
- **Authentication method**: Require specific login methods

Click **Next** and then **Add application** to finish.

#### Step 6: Test Authentication

1. Open your application URL in a browser: `https://opentxpacker.example.com`
2. You should be redirected to Cloudflare Access login page
3. Enter your email address
4. Check your email for a 6-digit PIN code
5. Enter the PIN code
6. You'll be authenticated and redirected to your application

**Session behavior:**

- Sessions last for the duration you specified (default: 24 hours)
- After expiration, users must re-authenticate
- Users can have sessions on multiple devices

#### Step 7: Customize Authentication Page (Optional)

Make the login experience match your brand:

1. Go to **Settings > Custom Pages**
2. Customize the following pages:
   - **Login page**: Add your branding, custom text
   - **Forbidden page**: Shown when access is denied
   - **Identity provider selection**: Customize the login method selection

3. You can use custom HTML/CSS for full control

#### Managing User Sessions

**View active sessions:**

1. Go to **Access > Applications**
2. Click on your application
3. View **Active users** and **Session activity**

**Revoke access:**

1. Go to **Settings > Authentication > User revocation**
2. Enter email address to revoke all sessions for that user

**Force re-authentication:**

1. Edit your application
2. Change **Session Duration** to a lower value
3. Existing sessions will be invalidated when they exceed the new duration

#### Advanced: Multi-Factor Authentication

For additional security, require users to use hardware keys or TOTP:

1. Go to **Settings > Authentication**
2. Enable additional methods:
   - **TOTP (Google Authenticator, Authy)**
   - **WebAuthn (YubiKey, hardware keys)**
3. Edit your application policy to **require** specific authentication methods

Now users must authenticate before accessing your application. All authentication happens at Cloudflare's edge - your application code doesn't need any changes.

### Enable Additional Security Features

In Cloudflare Dashboard, you can enable:
- **WAF (Web Application Firewall)** - Protect against common attacks
- **Rate Limiting** - Prevent abuse
- **Bot Protection** - Filter malicious bots
- **IP Access Rules** - Whitelist/blacklist specific IPs

## Troubleshooting

### Tunnel Shows as Inactive

**Check logs:**
```bash
docker logs cloudflared-tunnel
```

**Common issues:**
- Invalid `TUNNEL_TOKEN` - Regenerate the token
- Network connectivity - Ensure the container can reach Cloudflare's servers
- Tunnel already running elsewhere - Each tunnel can only have one active connection

### Application Not Accessible

**Verify DNS:**
```bash
nslookup app.yourdomain.com
# Should resolve to Cloudflare IP addresses
```

**Check internal networking:**
```bash
# Exec into cloudflared container
docker exec -it cloudflared-tunnel sh

# Test connection to app
wget -O- http://opentxpacker:3000
```

**Check Cloudflare Dashboard:**
- Go to Cloudflare Zero Trust > Networks > Tunnels
- Verify your tunnel shows as "Healthy"
- Check that routes are configured correctly

### Port Already in Use (if using standard docker-compose.yml)

The Cloudflare setup doesn't expose any ports locally. If you're getting port conflicts:
- Ensure you're using `docker-compose.cloudflare.yml` (not the standard `docker-compose.yml`)
- Stop any existing containers: `docker compose down`

### DNS Changes Not Propagating

- Wait 5-10 minutes for DNS propagation
- Clear your browser cache
- Try incognito/private browsing mode
- Check DNS with: `dig app.yourdomain.com` or `nslookup app.yourdomain.com`

## Updating the Application

### Pull and Restart

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose -f docker-compose.cloudflare.yml up -d --build
```

### Update Cloudflared

```bash
# Pull latest cloudflared image
docker compose -f docker-compose.cloudflare.yml pull cloudflared

# Restart with new image
docker compose -f docker-compose.cloudflare.yml up -d cloudflared
```

## Stopping the Application

```bash
# Stop all services
docker compose -f docker-compose.cloudflare.yml down

# Stop and remove volumes
docker compose -f docker-compose.cloudflare.yml down -v
```

## Deleting the Tunnel

If you need to remove the tunnel completely:

```bash
# Delete DNS route
cloudflared tunnel route dns --delete opentxpacker app.yourdomain.com

# Delete the tunnel
cloudflared tunnel delete opentxpacker
```

## Architecture Overview

```
┌─────────────────────┐
│   Internet User     │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────┐
│  Cloudflare CDN     │
│  (DDoS Protection)  │
└──────────┬──────────┘
           │ Encrypted Tunnel
           ▼
┌─────────────────────┐
│  cloudflared        │◄──┐
│  (Tunnel Connector) │   │ Internal Docker Network
└──────────┬──────────┘   │ (cloudflare-network)
           │               │
           │ HTTP          │
           ▼               │
┌─────────────────────┐   │
│  opentxpacker:3000  │───┘
│  (Your Application) │
└─────────────────────┘
    No exposed ports!
```

## Cost

**Cloudflare Tunnel is completely free!**
- No bandwidth limits
- No request limits
- No hidden fees
- Included in the free Cloudflare plan

## Additional Resources

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
- [cloudflared GitHub Repository](https://github.com/cloudflare/cloudflared)
- [Cloudflare Community Forum](https://community.cloudflare.com/c/developers/workers/40)

## Support

For issues specific to OpenTXPacker, please open an issue on GitHub.
For Cloudflare Tunnel issues, consult the [Cloudflare Community Forum](https://community.cloudflare.com/).
