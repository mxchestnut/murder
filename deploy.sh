#!/bin/bash
# Simple deploy script

echo "🚀 Deploying updates to Murder..."

# Git pull on server
echo "📥 Pulling latest code..."
ssh ec2-user@murder.tech 'cd /home/ec2-user/murder-tech && git pull'

# Build backend
echo "🔨 Building backend..."
ssh ec2-user@murder.tech 'cd /home/ec2-user/murder-tech/backend && npm run build'

# Restart PM2
echo "♻️  Restarting server..."
ssh ec2-user@murder.tech 'pm2 restart murder-tech-backend'

echo "✅ Deploy complete!"
