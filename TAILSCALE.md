# Tailscale Configuration Guide for Cyarika

## Overview
Tailscale provides secure VPN access to your private portal without exposing it to the public internet.

## Installation

### On EC2 Server
```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Start Tailscale
sudo tailscale up

# Get the server's Tailscale IP
tailscale ip -4
```

### On Client Devices
1. Install Tailscale from https://tailscale.com/download
2. Sign in with your account
3. Connect to your tailnet

## Configuration

### 1. Set Up ACLs (Access Control Lists)
In the Tailscale admin console, configure ACLs to restrict access:

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["user1@example.com", "user2@example.com"],
      "dst": ["tag:cyarika:*"]
    }
  ],
  "tagOwners": {
    "tag:cyarika": ["user1@example.com"]
  }
}
```

### 2. Tag Your Server
```bash
# Tag the EC2 instance
sudo tailscale up --advertise-tags=tag:cyarika
```

### 3. Enable MagicDNS
Enable MagicDNS in Tailscale admin console for easy access via hostname.

### 4. Configure Nginx for Tailscale Only
Update nginx to only listen on Tailscale interface:

```nginx
server {
    listen 100.x.x.x:443 ssl http2;  # Replace with your Tailscale IP
    server_name cyarika;
    # ... rest of config
}
```

## Access
Once configured, access your portal at:
- `https://cyarika-server` (with MagicDNS)
- `https://100.x.x.x` (Tailscale IP)

## Security Benefits
✅ No public IP exposure
✅ Encrypted WireGuard tunnel
✅ Per-user access control
✅ Activity logging
✅ Easy revocation

## Two-User Setup
For your two-user scenario:
1. Both users install Tailscale
2. Both join the same tailnet
3. Only these users can access cyarika.com
4. No one else can even see the server
