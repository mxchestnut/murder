# Tailscale Setup for Cyar'ika

Tailscale provides secure VPN access to your Cyar'ika portal, allowing you to restrict access to only trusted devices.

## What is Tailscale?

Tailscale creates a secure mesh VPN network between your devices. Once set up:
- Access the portal from anywhere using your Tailscale IP
- Optional: Restrict public access and only allow Tailscale connections
- Automatic encryption between all devices
- No port forwarding or firewall configuration needed

## Installation on EC2

### Step 1: Install Tailscale on the Server

SSH into your EC2 instance and run:

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Start Tailscale and authenticate
sudo tailscale up

# Note the authentication URL and open it in your browser
# This will link the server to your Tailscale account
```

### Step 2: Get the Tailscale IP

```bash
# Get your server's Tailscale IP address
tailscale ip -4
```

This will show an IP like `100.x.x.x` - this is your private Tailscale IP.

### Step 3: Install Tailscale on Your Devices

Install Tailscale on any device you want to access the portal from:

- **Mac/Windows/Linux**: https://tailscale.com/download
- **iOS/Android**: Search "Tailscale" in App Store/Play Store

Log in with the same account on each device.

## Access Options

### Option A: Dual Access (Public + Tailscale)

Keep the portal accessible publicly at `cyarika.com` AND via Tailscale:

```bash
# Access publicly (HTTPS)
https://cyarika.com

# Access via Tailscale (HTTP)
http://100.x.x.x:3000
```

**Pros**: Flexible access from anywhere
**Cons**: Portal is still publicly accessible

### Option B: Tailscale-Only Access (Recommended for Privacy)

Restrict access to only Tailscale connections:

```bash
# Update nginx configuration to only listen on Tailscale IP
sudo nano /etc/nginx/conf.d/cyarika.conf
```

Change the server block to:
```nginx
server {
    listen 100.x.x.x:80;  # Replace with your Tailscale IP
    server_name cyarika.local;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then restart nginx:
```bash
sudo systemctl restart nginx
```

**Pros**: Portal only accessible via your VPN (maximum security)
**Cons**: Must be on Tailscale to access

## MagicDNS (Optional)

Enable MagicDNS in your Tailscale admin console for easier access:

1. Go to https://login.tailscale.com/admin/dns
2. Enable MagicDNS
3. Access your server at: `http://ec2-server:3000` (or whatever hostname you set)

## Firewall Rules (Optional)

If using Tailscale-only access, you can tighten the AWS security group:

```bash
# Remove public HTTP/HTTPS access
# Keep only:
# - Port 22 (SSH) from your IP
# - Port 41641 (Tailscale) from 0.0.0.0/0
```

This ensures only VPN users can access the portal.

## Troubleshooting

### Can't connect via Tailscale IP

```bash
# Check Tailscale status
sudo tailscale status

# Restart Tailscale
sudo systemctl restart tailscaled
```

### Check what IPs are accessible

```bash
# List all Tailscale IPs in your network
tailscale status
```

## Current Setup

- **Public URL**: https://cyarika.com (via nginx, port 80/443)
- **Backend**: localhost:3000 (Node.js server)
- **Tailscale IP**: 100.83.245.45
- **Tailscale Hostname**: ip-172-31-76-84
- **Status**: ✅ Connected

## Access Your Portal via Tailscale

Now that Tailscale is set up, you can access your portal at:

```
http://100.83.245.45
```

Or if you enable MagicDNS:

```
http://ip-172-31-76-84
```

Both will route to the nginx server on port 80, which proxies to your Node.js backend on port 3000.

## Recommended Configuration

For maximum security while maintaining flexibility:

1. Keep public HTTPS access at `cyarika.com` for general use
2. Access via Tailscale for admin tasks and sensitive operations
3. Use Tailscale IP for development and testing
4. Optionally add IP whitelist middleware to restrict admin endpoints

## Next Steps

1. Install Tailscale on EC2 instance
2. Install Tailscale on your devices
3. Test access via Tailscale IP
4. Decide on access model (dual or Tailscale-only)
5. Update security group rules if needed
