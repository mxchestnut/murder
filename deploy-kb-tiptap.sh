#!/bin/bash
# Deploy Knowledge Base Tiptap changes to EC2

echo "🚀 Deploying Knowledge Base Tiptap integration..."

# Pull latest changes
echo "📥 Pulling latest code..."
git pull

# Run database migration
echo "🗄️  Running database migration..."
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, loading from AWS Secrets Manager..."
  export DATABASE_URL=$(aws secretsmanager get-secret-value --secret-id cyarika-secrets --query SecretString --output text | jq -r .DATABASE_URL)
fi

psql "$DATABASE_URL" -f backend/migrations/add_answer_html.sql

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Restart backend to pick up schema changes
echo "♻️  Restarting backend..."
cd ..
pm2 restart cyarika-backend

echo "✅ Deployment complete!"
echo "🔍 Check status: pm2 status"
