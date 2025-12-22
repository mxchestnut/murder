# Cyar'ika Deployment Setup

## Project Overview
**Cyar'ika** is a Discord-integrated roleplay platform forked from writepretend, featuring character management, dice rolling, and web portal functionality.

## Infrastructure Setup

### EC2 Instance
- **Instance ID:** i-0a7d5f108d60dab09
- **Instance Type:** t3.small
- **Public IP:** 100.49.41.171
- **Region:** us-east-1 (US East - N. Virginia)
- **AMI:** Amazon Linux 2 (ami-03f9680ef0c07a3d1)
- **Key Pair:** cyarika-key
- **Security Group:** sg-068344f8a044ec991 (cyarika-web)

### Security Group Rules
- **SSH (22):** 0.0.0.0/0
- **HTTP (80):** 0.0.0.0/0
- **HTTPS (443):** 0.0.0.0/0
- **App Port (3000):** 0.0.0.0/0

### DNS Configuration (Route 53)
- **Domain:** cyarika.com
- **Hosted Zone ID:** Z01482473LHFKM7LFNJKR
- **A Record:** cyarika.com → 100.49.41.171
- **A Record:** www.cyarika.com → 100.49.41.171
- **TTL:** 300 seconds

### Database
- **Provider:** Neon (Serverless PostgreSQL)
- **Region:** us-east-1
- **Connection:** Configured in .env file

### Discord Bot
- **Bot Name:** Cyar'ika
- **Token:** Configured in .env file

## Next Steps for Deployment

### 1. SSH into the EC2 Instance
```bash
ssh -i ~/.ssh/cyarika-deploy-key.pem ec2-user@100.49.41.171
```

### 2. Install Node.js and Dependencies
```bash
# Update system
sudo yum update -y

# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install Git
sudo yum install -y git

# Install PM2 for process management
sudo npm install -g pm2
```

### 3. Clone and Setup the Repository
```bash
# Clone the repository
git clone https://github.com/mxchestnut/cyarika.git
cd cyarika

# Copy the .env file (you'll need to upload it separately or create it)
nano .env
# Paste the production .env content

# Install dependencies
npm install

# Build the project
npm run build
```

### 4. Initialize the Database
```bash
# Run database migrations
cd backend
npm run db:push
```

### 5. Start the Application with PM2
```bash
# From the project root
pm2 start npm --name "cyarika-backend" -- run start

# Save the PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions from the command output
```

### 6. Setup Nginx as Reverse Proxy (Optional but Recommended)
```bash
# Install Nginx
sudo amazon-linux-extras install nginx1 -y

# Create Nginx configuration
sudo nano /etc/nginx/conf.d/cyarika.conf
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name cyarika.com www.cyarika.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 7. Setup SSL with Let's Encrypt
```bash
# Install certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d cyarika.com -d www.cyarika.com
```

## Environment Variables (.env)
The .env file is already configured with:
- Production Node environment
- Neon database connection string
- Discord bot token
- AWS S3 bucket (cyarika-documents)
- Session secret (auto-generated)
- Frontend URL (https://cyarika.com)

## Repository
- **GitHub:** https://github.com/mxchestnut/cyarika.git
- **Local Path:** ~/cyarika-project/cyarika

## Important Files
- `.env` - Production environment variables (DO NOT commit to git)
- `package.json` - Project dependencies and scripts
- `backend/` - Express server and API
- `frontend/` - React web application

## Monitoring
```bash
# View application logs
pm2 logs cyarika-backend

# Check application status
pm2 status

# Monitor resources
pm2 monit
```

## Discord Bot Commands
Once deployed, the bot will support:
- `!connect <username> <password>` - Link Discord account
- `!sync all` - Refresh character list
- `CharName: message` - Speak as a character
- Character dice rolling commands

## Security Notes
⚠️ **IMPORTANT:** The Discord bot token and database credentials in this setup are sensitive. Make sure:
1. Never commit .env to git (it's in .gitignore)
2. Rotate tokens regularly
3. Consider using AWS Secrets Manager for production
4. Keep the SSH key secure

## Cost Estimation
- **EC2 t3.small:** ~$15/month (on-demand)
- **Neon Database:** Free tier or ~$10/month
- **Route 53:** ~$0.50/month per hosted zone
- **Total:** ~$25-26/month

## Support
For issues or questions, refer to the project documentation in the repository.
