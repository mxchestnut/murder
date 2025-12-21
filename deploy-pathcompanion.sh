#!/bin/bash
# Quick deployment script for PathCompanion integration

echo "🚀 Deploying PathCompanion Integration to EC2..."

# SSH into EC2 and run deployment commands
ssh -i cyarika-key.pem ubuntu@54.242.214.56 << 'ENDSSH'
  cd /home/ubuntu/cyarika
  
  echo "📥 Pulling latest changes..."
  git pull origin main
  
  echo "📦 Installing dependencies..."
  cd backend
  npm install
  cd ../frontend
  npm install
  cd ..
  
  echo "🔨 Building backend..."
  cd backend
  npm run build
  
  echo "🔨 Building frontend..."
  cd ../frontend
  npm run build
  
  echo "🗃️ Running database migrations..."
  cd ../backend
  npm run db:push
  
  echo "🔄 Restarting backend service..."
  pm2 restart cyarika || pm2 start dist/server.js --name cyarika
  pm2 save
  
  echo "✅ Deployment complete!"
  echo "📊 Service status:"
  pm2 status
ENDSSH

echo ""
echo "🎉 PathCompanion integration deployed successfully!"
echo "🌐 Access your site at: http://54.242.214.56"
echo ""
echo "📝 Next steps:"
echo "  1. Test PathCompanion import at http://54.242.214.56"
echo "  2. Check logs with: ssh -i cyarika-key.pem ubuntu@54.242.214.56 'pm2 logs cyarika'"
