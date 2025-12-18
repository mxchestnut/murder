# Matrix Homeserver Setup Guide

## Overview
Matrix provides decentralized, secure messaging for your private portal.

## Option 1: Use Matrix.org (Easiest)
For simplicity, you can use the public Matrix.org homeserver:

1. Create accounts at https://app.element.io
2. Use these credentials in your backend
3. Update `.env`:
   ```
   MATRIX_HOMESERVER_URL=https://matrix.org
   ```

## Option 2: Self-Host Matrix Synapse (More Private)

### Installation on Separate EC2 Instance
```bash
# Install Synapse
sudo apt install -y matrix-synapse

# Configure Synapse
sudo nano /etc/matrix-synapse/homeserver.yaml
```

### Configuration
```yaml
server_name: "cyarika.com"
listeners:
  - port: 8008
    type: http
    bind_addresses: ['::1', '127.0.0.1']
    
database:
  name: psycopg2
  args:
    user: matrix_user
    password: your_password
    database: matrix
    host: localhost
    cp_min: 5
    cp_max: 10

enable_registration: false
enable_registration_without_verification: false
```

### Create User Accounts
```bash
# Register users
register_new_matrix_user -c /etc/matrix-synapse/homeserver.yaml http://localhost:8008

# Enter username and password for each user
```

### Nginx Configuration for Matrix
```nginx
server {
    listen 443 ssl http2;
    server_name matrix.cyarika.com;

    location /_matrix {
        proxy_pass http://localhost:8008;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```

## Integration with Backend

### Get Access Tokens
```bash
# Login to get access token
curl -XPOST -d '{"type":"m.login.password", "user":"username", "password":"password"}' "http://localhost:8008/_matrix/client/r0/login"
```

### Update Backend Environment
```
MATRIX_HOMESERVER_URL=https://matrix.cyarika.com
MATRIX_USER1_TOKEN=your_token_here
MATRIX_USER2_TOKEN=your_token_here
```

## Recommended: Option 1 for Simplicity
For your use case (2 users, simple setup), using Matrix.org is perfectly fine and secure since:
- Messages are end-to-end encrypted
- No server maintenance required
- Free tier available
- Stable and reliable

## Alternative: Conduit (Lightweight)
If you want self-hosting but lighter than Synapse:

```bash
docker run -d -p 6167:6167 \
  -v db:/var/lib/matrix-conduit/ \
  -e CONDUIT_SERVER_NAME="cyarika.com" \
  matrixconduit/matrix-conduit:latest
```

Conduit uses ~100MB RAM vs Synapse's ~500MB+
