#!/bin/bash
# Deploy relationships table migration to production

set -e

echo "🚀 Deploying relationships table migration..."

# SSH into EC2 and run migration
ssh ec2-user@cyarika.com << 'EOF'
  cd /home/ec2-user/cyarika/backend
  
  echo "📦 Installing dependencies..."
  npm install
  
  echo "🔄 Running relationships migration..."
  npx tsx src/migrate-relationships.ts
  
  echo "🔄 Restarting PM2..."
  pm2 restart cyarika-backend
  
  echo "✅ Migration complete!"
EOF

echo "✨ Deployment finished!"
