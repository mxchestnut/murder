#!/bin/bash

# AWS EC2 Deployment Script for Cyarika Private Portal

echo "=== Cyarika Deployment Setup ==="

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Setup PostgreSQL database
sudo -u postgres psql -c "CREATE DATABASE cyarika;"
sudo -u postgres psql -c "CREATE USER cyarika_user WITH PASSWORD 'change_this_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cyarika TO cyarika_user;"

# Install PM2 for process management
sudo npm install -g pm2

# Clone repository (you'll need to set this up)
# git clone https://github.com/yourusername/cyarika.git
# cd cyarika

# Install dependencies
npm install
npm install --workspace=backend
npm install --workspace=frontend

# Build frontend
npm run build --workspace=frontend

# Setup environment variables
cp .env.example .env
echo "Please edit .env file with your configuration"

# Build backend
npm run build --workspace=backend

# Start with PM2
pm2 start backend/dist/server.js --name cyarika-backend
pm2 save
pm2 startup

echo "=== Deployment Complete ==="
echo "Please configure:"
echo "1. .env file with your settings"
echo "2. Nginx reverse proxy"
echo "3. SSL certificates (Let's Encrypt)"
echo "4. Tailscale for VPN access"
