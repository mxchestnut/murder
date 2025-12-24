# S3 Bucket Setup - Cyar'ika

## ✅ Configuration Complete

**Bucket Name:** `cyarika-documents-680363506283`  
**Region:** `us-east-1` (US East N. Virginia)  
**IAM Role:** `CyarikaEC2SecretsRole` with `AmazonS3FullAccess`

---

## Environment Variables

The following environment variables are configured in `/home/ec2-user/cyarika/ecosystem.config.js`:

```javascript
S3_BUCKET=cyarika-documents-680363506283
AWS_REGION=us-east-1
```

The EC2 instance uses IAM role authentication (no access keys needed).

---

## Testing S3 Access

```bash
# From EC2 instance
aws s3 ls s3://cyarika-documents-680363506283/

# Upload test file
echo "test" > test.txt
aws s3 cp test.txt s3://cyarika-documents-680363506283/test/
aws s3 rm s3://cyarika-documents-680363506283/test/test.txt
```

---

## File Upload Features

✅ Virus scanning with ClamAV before upload  
✅ Presigned URLs for secure downloads  
✅ Soft delete (files table tracks deletedAt)  
✅ User-scoped file organization (`uploads/{userId}/`)

---

## Bucket Structure

```
cyarika-documents-680363506283/
├── uploads/
│   └── {userId}/
│       └── {timestamp}-{randomHash}.{ext}
└── test/
    └── (testing files)
```

---

## PM2 Configuration

Backend is managed via ecosystem file:

```bash
# Restart with config
pm2 delete cyarika-backend
pm2 start ecosystem.config.js
pm2 save

# View environment
pm2 env 0
```

---

## AWS Free Tier Limits

- **Storage:** 5 GB/month for first 12 months
- **Requests:** 20,000 GET, 2,000 PUT per month
- **Data Transfer:** 15 GB/month out to internet

Monitor usage: https://console.aws.amazon.com/billing/

---

**Setup Date:** December 24, 2025  
**Status:** ✅ Production Ready
