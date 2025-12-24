#!/bin/bash

# Cyar'ika Production Deployment Script
# Updates NODE_ENV to production and restarts backend

set -e  # Exit on error

echo "🚀 Deploying to production..."

# SSH into server and update PM2 config
ssh ec2-user@100.83.245.45 << 'ENDSSH'
  cd ~/cyarika
  
  # Create PM2 ecosystem config with production mode
  cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cyarika-backend',
    script: './backend/dist/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

  echo "✓ Updated PM2 ecosystem config"
  
  # Delete existing process and start with new config
  pm2 delete cyarika-backend 2>/dev/null || true
  pm2 start ecosystem.config.js
  pm2 save
  
  echo "✓ Restarted backend in production mode"
  
  # Show logs
  pm2 logs cyarika-backend --lines 20 --nostream
ENDSSH

echo "✅ Deployment complete!"
