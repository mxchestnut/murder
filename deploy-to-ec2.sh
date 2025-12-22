#!/bin/bash
# Cyar'ika Deployment Script for EC2

set -e

EC2_IP="100.49.41.171"
KEY_PATH="${HOME}/.ssh/cyarika-deploy-key.pem"
REMOTE_USER="ec2-user"

echo "🚀 Cyar'ika Deployment Script"
echo "=============================="
echo ""

# Check if SSH key exists
if [ ! -f "$KEY_PATH" ]; then
    echo "❌ SSH key not found at $KEY_PATH"
    echo "Please ensure your SSH key is in the correct location."
    exit 1
fi

echo "📦 Step 1: Copying .env file to EC2 instance..."
scp -i "$KEY_PATH" .env "${REMOTE_USER}@${EC2_IP}:/tmp/cyarika.env"

echo ""
echo "🔧 Step 2: Setting up the server..."
ssh -i "$KEY_PATH" "${REMOTE_USER}@${EC2_IP}" << 'ENDSSH'
set -e

echo "📥 Updating system packages..."
sudo yum update -y

echo "📦 Installing Node.js 20.x..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git

echo "🔄 Installing PM2..."
sudo npm install -g pm2

echo "📂 Cloning repository..."
if [ -d "cyarika" ]; then
    echo "Directory exists, pulling latest changes..."
    cd cyarika
    git pull
else
    git clone https://github.com/mxchestnut/cyarika.git
    cd cyarika
fi

echo "🔐 Moving .env file..."
mv /tmp/cyarika.env .env

echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building the application..."
npm run build

echo "🗄️  Initializing database..."
cd backend
npm run db:push
cd ..

echo "▶️  Starting application with PM2..."
pm2 delete cyarika-backend 2>/dev/null || true
pm2 start npm --name "cyarika-backend" -- run start
pm2 save

echo "🎯 Setting up PM2 to start on boot..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Application status:"
pm2 status

echo ""
echo "📝 View logs with: pm2 logs cyarika-backend"
echo "🔍 Monitor with: pm2 monit"
ENDSSH

echo ""
echo "🌐 Your application should now be running at:"
echo "   http://${EC2_IP}:3000"
echo "   http://cyarika.com (once DNS propagates)"
echo ""
echo "✨ Next steps:"
echo "   1. Wait for DNS propagation (5-10 minutes)"
echo "   2. Setup SSL with Let's Encrypt (optional)"
echo "   3. Configure Nginx reverse proxy (recommended)"
echo ""
echo "📚 See DEPLOYMENT_SETUP.md for detailed instructions"
