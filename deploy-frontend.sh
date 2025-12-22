#!/bin/bash
set -e

# Cyarika Frontend Deployment Script
# Deploys frontend to the CORRECT location: /home/ubuntu/cyarika/frontend/dist/

echo "🚀 Building frontend..."
cd frontend
npm run build

echo "📦 Uploading files to server..."
aws ec2-instance-connect send-ssh-public-key \
  --instance-id i-0038431a2b62c1dbf \
  --instance-os-user ubuntu \
  --ssh-public-key file://~/.ssh/cyarika-debug-key.pub

scp -i ~/.ssh/cyarika-debug-key.pem \
  dist/index.html \
  dist/assets/* \
  ubuntu@54.242.214.56:/tmp/

echo "🔧 Deploying to production..."
ssh -i ~/.ssh/cyarika-debug-key.pem ubuntu@54.242.214.56 << 'ENDSSH'
  # Move assets first
  mv /tmp/index-*.js /tmp/index-*.css /home/ubuntu/cyarika/frontend/dist/assets/
  
  # Move index.html directly without modification (Vite already handles hashing)
  mv /tmp/index.html /home/ubuntu/cyarika/frontend/dist/
  
  echo "✅ Deployment complete!"
  cat /home/ubuntu/cyarika/frontend/dist/index.html
ENDSSH

echo ""
echo "✨ Frontend deployed successfully!"
echo "🌐 Visit https://cyarika.com to see your changes"
