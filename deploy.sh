#!/bin/bash
# Simple deploy script

echo "🚀 Deploying updates to cyarika.com..."

# Git pull on server
echo "📥 Pulling latest code..."
ssh ec2-user@cyarika.com 'cd /home/ec2-user/cyarika && git pull'

# Build backend
echo "🔨 Building backend..."
ssh ec2-user@cyarika.com 'cd /home/ec2-user/cyarika/backend && npm run build'

# Restart PM2
echo "♻️  Restarting server..."
ssh ec2-user@cyarika.com 'pm2 restart cyarika-backend'

echo "✅ Deploy complete!"
