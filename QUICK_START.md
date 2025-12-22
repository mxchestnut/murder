# Cyar'ika Quick Start Guide

## 📋 Setup Summary

✅ **Project cloned and configured**  
✅ **Database configured** (Neon PostgreSQL)  
✅ **Discord bot configured** (Token set)  
✅ **AWS EC2 instance created** (t3.small)  
✅ **DNS configured** (cyarika.com → 100.49.41.171)  
✅ **Git remote updated** (github.com/mxchestnut/cyarika.git)

## 🚀 To Deploy NOW

Simply run the deployment script:
```bash
cd ~/cyarika-project/cyarika
./deploy-to-ec2.sh
```

This will automatically:
1. Copy your .env file to the server
2. Install all dependencies (Node.js, PM2, etc.)
3. Clone the repository
4. Build the application
5. Initialize the database
6. Start the application with PM2

## 🔑 Important Information

### Server Access
```bash
ssh -i ~/.ssh/cyarika-deploy-key.pem ec2-user@100.49.41.171
```

### EC2 Instance
- **IP:** 100.49.41.171
- **Type:** t3.small
- **Region:** us-east-1
- **Instance ID:** i-0a7d5f108d60dab09

### Domain
- **Primary:** cyarika.com
- **WWW:** www.cyarika.com
- **Both point to:** 100.49.41.171

### Application URLs
- **Direct IP:** http://100.49.41.171:3000
- **Domain:** http://cyarika.com (after DNS propagates)

## 📦 What's Been Configured

### Environment Variables (.env)
- ✅ Production mode
- ✅ Neon database connection
- ✅ Discord bot token
- ✅ Session secret (generated)
- ✅ AWS S3 bucket name
- ✅ Frontend URL

### AWS Resources
- ✅ EC2 instance (running)
- ✅ Security group (ports 22, 80, 443, 3000)
- ✅ Route 53 DNS records

## 🎯 Next Steps

1. **Deploy the application** (run `./deploy-to-ec2.sh`)
2. **Wait for DNS** to propagate (5-10 minutes)
3. **Test the Discord bot** in your Discord server
4. **Setup SSL** (optional but recommended)
5. **Configure Nginx** reverse proxy (optional)

## 📚 Documentation
- `DEPLOYMENT_SETUP.md` - Detailed deployment instructions
- `README.md` - Project overview
- `.env.example` - Environment variable template

## 🔐 Security Reminders
- `.env` file contains sensitive credentials
- Never commit `.env` to git
- SSH key is at `~/.ssh/cyarika-deploy-key.pem`
- Discord bot token and database password are configured

## 💰 Monthly Costs
- EC2 t3.small: ~$15
- Neon DB: ~$0-10
- Route 53: ~$0.50
- **Total: ~$15-26/month**

## 🆘 Troubleshooting

### If deployment fails:
```bash
# Check EC2 instance status
aws ec2 describe-instances --instance-ids i-0a7d5f108d60dab09 --region us-east-1

# SSH into server and check manually
ssh -i ~/.ssh/cyarika-deploy-key.pem ec2-user@100.49.41.171
```

### After deployment:
```bash
# View app logs
pm2 logs cyarika-backend

# Check app status
pm2 status

# Restart app
pm2 restart cyarika-backend
```

## 📞 Support
For issues or questions, refer to the detailed documentation or the original writepretend repository.
