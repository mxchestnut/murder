#!/bin/bash
# Quick fix: Deploy relationships migration

echo "🚀 Deploying relationships migration fix..."
echo ""
echo "This will:"
echo "1. Pull latest code on server"
echo "2. Run the relationships migration" 
echo "3. Restart the backend"
echo ""

# Method 1: Try using deploy.sh pattern
echo "📥 Pulling latest code..."
ssh ec2-user@cyarika.com 'cd /home/ec2-user/cyarika && git pull' || {
  echo ""
  echo "❌ Automatic deployment failed. Please run manually:"
  echo ""
  echo "  ssh ec2-user@cyarika.com"
  echo "  cd /home/ec2-user/cyarika && git pull"
  echo "  cd backend"
  echo "  npx tsx src/migrate-relationships.ts"
  echo "  pm2 restart cyarika-backend"
  echo ""
  exit 1
}

echo ""
echo "🔄 Running migration..."
ssh ec2-user@cyarika.com 'cd /home/ec2-user/cyarika/backend && npx tsx src/migrate-relationships.ts'

echo ""
echo "♻️  Restarting backend..."
ssh ec2-user@cyarika.com 'pm2 restart cyarika-backend'

echo ""
echo "✅ Migration complete! Test with:"
echo "   !Duane is Elystrix's bodyguard | They're inseparable."
