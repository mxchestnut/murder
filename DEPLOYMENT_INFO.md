# Cyarika EC2 Deployment Information

## Instance Details
- **Instance ID**: i-0038431a2b62c1dbf
- **Public IP**: 54.242.214.56
- **Instance Type**: t2.micro (Free tier eligible)
- **OS**: Ubuntu 22.04 LTS
- **Region**: Your configured AWS region
- **Security Group**: cyarika-sg (sg-0f04474e55f42ab5b)
- **Key Pair**: cyarika-key

## Security Group Rules
- **Port 22** (SSH): Open to 0.0.0.0/0
- **Port 80** (HTTP): Open to 0.0.0.0/0  
- **Port 443** (HTTPS): Open to 0.0.0.0/0

## SSH Access

### Connect to your instance:
```bash
ssh -i cyarika-key.pem ubuntu@54.242.214.56
```

**Note**: If you see a "Permission denied (publickey)" error, the key file `cyarika-key.pem` needs to be retrieved from AWS or you may need to create a new key pair.

## Next Steps

### 1. Connect to Instance
```bash
# Wait a minute for instance to fully initialize
ssh -i cyarika-key.pem ubuntu@54.242.214.56
```

### 2. Install Dependencies on Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### 3. Setup Neon Database
Instead of installing PostgreSQL locally, use Neon's serverless PostgreSQL:

1. Go to https://neon.tech and sign up (free tier available)
2. Create a new project
3. Create a database named `cyarika`
4. Copy the connection string (it looks like: `postgresql://username:password@ep-xxx.neon.tech/cyarika?sslmode=require`)
5. Use this connection string in your `.env` file

### 4. Deploy Application
```bash
# Clone your repository (you'll need to push to GitHub first)
cd /home/ubuntu
git clone https://github.com/yourusername/cyarika.git
cd cyarika

# Install dependencies
npm install

# Create .env file
nano .env
# Copy contents from .env.example and update with production values
```

### 5. Build and Start
```bash
# Build frontend
npm run build --workspace=frontend

# Build backend
npm run build --workspace=backend

# Start with PM2
cd backend
pm2 start dist/server.js --name cyarika
pm2 save
pm2 startup
```

### 6. Configure Nginx
```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/cyarika
sudo ln -s /etc/nginx/sites-available/cyarika /etc/nginx/sites-enabled/

# Update server_name in config to your domain or IP
sudo nano /etc/nginx/sites-available/cyarika

# Test and restart nginx
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Setup SSL (Optional but Recommended)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot --nginx -d cyarika.com -d www.cyarika.com
```

### 8. Install Tailscale for VPN Access
```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Start Tailscale
sudo tailscale up --advertise-tags=tag:cyarika

# Get Tailscale IP
tailscale ip -4
```

## Environment Variables Needed

Create `/home/ubuntu/cyarika/.env`:
```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://54.242.214.56

# Neon PostgreSQL connection string (get from Neon console)
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/cyarika?sslmode=require

SESSION_SECRET=generate-a-long-random-string-here

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=cyarika-documents
```

## AWS S3 Bucket Setup

1. Create bucket in AWS Console:
   ```bash
   aws s3 mb s3://cyarika-documents
   ```

2. Configure bucket policy for private access

3. Update IAM credentials in `.env`

## Cost Management

- **t2.micro**: Free for 12 months (750 hours/month)
- **S3**: 5GB free storage
- **Data Transfer**: 15GB/month free
- Set up billing alerts in AWS Console

## Monitoring

```bash
# View application logs
pm2 logs cyarika

# Check status
pm2 status

# Monitor resources
pm2 monit

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Useful Commands

```bash
# Restart application
pm2 restart cyarika

# Stop application
pm2 stop cyarika

# Update code
cd /home/ubuntu/cyarika
git pull
npm install
npm run build --workspace=frontend
npm run build --workspace=backend
pm2 restart cyarika
```

## Troubleshooting

**Can't SSH**: Wait 2-3 minutes after instance creation, or check if cyarika-key.pem exists

**Port issues**: Check security group allows ports 22, 80, 443

**Out of memory**: t2.micro has 1GB RAM - may need t2.small for production

**Database connection fails**: Check Neon connection string in `.env` and ensure `sslmode=require` is set

## Security Recommendations

1. **After Tailscale setup**, restrict security group to only Tailscale IPs
2. Change default PostgreSQL password
3. Use strong SESSION_SECRET
4. Enable AWS CloudWatch for monitoring
5. Setup automated backups
6. Keep system updated: `sudo apt update && sudo apt upgrade`

## Backup Commands

```bash
# Database backups are handled automatically by Neon
# You can also create manual backups from the Neon console

# Backup files to S3
aws s3 sync /home/ubuntu/cyarika/uploads s3://cyarika-documents/backups/ --exclude "*" --include "*.pdf" --include "*.docx"
```

---

**Instance Created**: December 18, 2025
**Status**: Ready for deployment
