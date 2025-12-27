#!/bin/bash
# Simple deploy script

echo "🚀 Deploying updates to My1e Party..."

# Git pull on server
echo "📥 Pulling latest code..."
ssh -i ~/.ssh/murder-tech-key.pem ubuntu@44.210.148.206 'cd my1eparty && git pull'

# Install frontend dependencies if package.json changed
echo "📦 Installing frontend dependencies..."
ssh -i ~/.ssh/murder-tech-key.pem ubuntu@44.210.148.206 'cd my1eparty/frontend && npm install'

# Build backend
echo "🔨 Building backend..."
ssh -i ~/.ssh/murder-tech-key.pem ubuntu@44.210.148.206 'cd my1eparty/backend && npm run build'

# Restart PM2
echo "♻️  Restarting server..."
ssh -i ~/.ssh/murder-tech-key.pem ubuntu@44.210.148.206 'pm2 restart my1eparty-backend'

echo "✅ Deploy complete!"
