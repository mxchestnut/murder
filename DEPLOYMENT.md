# Cyarika Deployment Guide

## 🎯 Quick Reference

### Frontend Deployment
```bash
./deploy-frontend.sh
```

### Backend Deployment
```bash
cd backend
npm run build
aws ec2-instance-connect send-ssh-public-key --instance-id i-0038431a2b62c1dbf --instance-os-user ubuntu --ssh-public-key file://~/.ssh/cyarika-debug-key.pub
rsync -avz --exclude node_modules -e "ssh -i ~/.ssh/cyarika-debug-key.pem" dist/ ubuntu@54.242.214.56:/home/ubuntu/cyarika/backend/dist/
ssh -i ~/.ssh/cyarika-debug-key.pem ubuntu@54.242.214.56 'pm2 restart cyarika'
```

## 📂 Important Paths

### On Server
- **Frontend**: `/home/ubuntu/cyarika/frontend/dist/`
- **Backend**: `/home/ubuntu/cyarika/backend/dist/`
- **Nginx Config**: `/etc/nginx/sites-available/cyarika`
- **PM2 Process**: `cyarika` (running on port 3000)

### Nginx Configurations
- `cyarika` - Main config for cyarika.com (HTTPS with SSL)
- `cyarika-ip` - IP-based access config (HTTP)
- ~~`default`~~ - REMOVED (was causing confusion)

## 🔧 Cache-Busting Strategy

The deployment uses **timestamp-based query parameters** to defeat browser caching:

```html
<script src="/assets/index-ABC123.js?v=1766330063"></script>
```

- Timestamp changes on every deployment
- Forces browsers to fetch fresh files
- HTML can be cached, but asset URLs are unique

### Why This Matters
Browsers aggressively cache HTML files. Even with `no-cache` headers, some browsers ignore them. By changing the asset URLs (via timestamp), we guarantee fresh content loads.

## 🚨 Common Issues

### "I deployed but don't see changes"
1. ✅ Verify you deployed to `/home/ubuntu/cyarika/frontend/dist/` (not `/var/www/html/`)
2. ✅ Check timestamp was added: `ssh ubuntu@server 'cat /home/ubuntu/cyarika/frontend/dist/index.html'`
3. ✅ Hard refresh browser: Ctrl+Shift+R (Cmd+Shift+R on Mac)
4. ✅ Try incognito window

### "404 errors after deployment"
1. Check nginx is serving from correct directory
2. Verify files exist: `ssh ubuntu@server 'ls -la /home/ubuntu/cyarika/frontend/dist/'`
3. Check nginx config: `ssh ubuntu@server 'sudo nginx -t'`

### "Backend changes not working"
1. Make sure you ran `npm run build` in backend/
2. Verify PM2 restarted: `ssh ubuntu@server 'pm2 logs cyarika --lines 20'`
3. Check process is running: `ssh ubuntu@server 'pm2 list'`

## 📝 Manual Deployment (if script fails)

### Frontend
```bash
cd frontend
npm run build

# Upload files
aws ec2-instance-connect send-ssh-public-key --instance-id i-0038431a2b62c1dbf --instance-os-user ubuntu --ssh-public-key file://~/.ssh/cyarika-debug-key.pub
scp -i ~/.ssh/cyarika-debug-key.pem dist/index.html dist/assets/* ubuntu@54.242.214.56:/tmp/

# Deploy with timestamp
ssh -i ~/.ssh/cyarika-debug-key.pem ubuntu@54.242.214.56 '
  mv /tmp/index-*.js /tmp/index-*.css /home/ubuntu/cyarika/frontend/dist/assets/
  TIMESTAMP=$(date +%s)
  sed -i "s|src=\"/assets/index-[^\"]*\.js\"|src=\"/assets/index-*.js?v=$TIMESTAMP\"|g" /tmp/index.html
  sed -i "s|href=\"/assets/index-[^\"]*\.css\"|href=\"/assets/index-*.css?v=$TIMESTAMP\"|g" /tmp/index.html
  mv /tmp/index.html /home/ubuntu/cyarika/frontend/dist/
'
```

## 🔐 Server Access

```bash
# Connect to server
aws ec2-instance-connect send-ssh-public-key --instance-id i-0038431a2b62c1dbf --instance-os-user ubuntu --ssh-public-key file://~/.ssh/cyarika-debug-key.pub
ssh -i ~/.ssh/cyarika-debug-key.pem ubuntu@54.242.214.56

# Check PM2 status
pm2 list
pm2 logs cyarika

# Check nginx
sudo nginx -t
sudo systemctl status nginx
```

## 🌐 URLs

- **Production**: https://cyarika.com
- **IP Access**: http://54.242.214.56
- **Backend API**: https://cyarika.com/api

## ⚙️ Environment

- **Server**: AWS EC2 i-0038431a2b62c1dbf
- **OS**: Ubuntu 22.04
- **Node**: v18+
- **Database**: Neon PostgreSQL (serverless)
- **Process Manager**: PM2
- **Web Server**: Nginx with Let's Encrypt SSL
