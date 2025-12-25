#!/bin/bash
# Simple deploy script

echo "🚀 Deploying updates to Murder..."

# Git pull on server
echo "📥 Pulling latest code..."
ssh -i ~/.ssh/murder-tech-key.pem ubuntu@44.210.148.206 'cd murder-tech && git pull'

# Install frontend dependencies if package.json changed
echo "📦 Installing frontend dependencies..."
ssh -i ~/.ssh/murder-tech-key.pem ubuntu@44.210.148.206 'cd murder-tech/frontend && npm install'

# Build backend
echo "🔨 Building backend..."
ssh -i ~/.ssh/murder-tech-key.pem ubuntu@44.210.148.206 'cd murder-tech/backend && npm run build'

# Restart PM2
echo "♻️  Restarting server..."
ssh -i ~/.ssh/murder-tech-key.pem ubuntu@44.210.148.206 'pm2 restart all'

echo "✅ Deploy complete!"
