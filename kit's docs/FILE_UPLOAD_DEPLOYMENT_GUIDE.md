# Deployment Instructions for CSRF + File Upload Feature

## Summary
This deployment adds:
1. **CSRF Protection** - Session-based token protection for all state-changing operations
2. **File Upload with Malware Scanning** - Upload files to S3 with ClamAV virus scanning
3. **File Manager UI** - New "Files" button in dashboard header for file management

## Pre-Deployment Checklist

### 1. Install ClamAV on EC2

SSH to your EC2 instance and follow instructions in `CLAMAV_INSTALLATION.md`:

```bash
ssh ec2-user@cyarika.mxchestnut.com

# Quick install (see CLAMAV_INSTALLATION.md for full details)
sudo dnf install -y clamav clamd clamav-update
sudo freshclam  # Update virus definitions
sudo systemctl enable clamd@scan
sudo systemctl start clamd@scan

# Verify it's running
sudo systemctl status clamd@scan
echo "PING" | nc -U /var/run/clamd.scan/clamd.sock
# Should return: PONG
```

### 2. Create Uploads Directory

```bash
# Still on EC2
sudo mkdir -p /tmp/uploads
sudo chmod 777 /tmp/uploads
```

### 3. Verify Environment Variables

Ensure these are set in your EC2 environment (PM2 or .env):

```bash
# Check current env vars
pm2 env 0  # or whatever process ID your backend is

# Required for file upload:
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name  # or AWS_S3_BUCKET

# Required for session/CSRF:
SESSION_SECRET=your_secret
REDIS_URL=your_redis_url
```

## Deployment Steps

### 1. Pull Latest Code

```bash
# On EC2
cd /home/ec2-user/cyarika
git pull origin main
```

### 2. Install New Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Packages added:
# - csrf-csrf
# - cookie-parser
# - @types/cookie-parser
# - multer
# - @types/multer
# - clamscan
# - @aws-sdk/s3-request-presigner
```

### 3. Run Database Migration

```bash
# Still in backend directory
npm run db:push

# This will create the new 'files' table with columns:
# - id, userId, fileName, originalFileName, mimeType, fileSize
# - s3Key, s3Bucket, virusScanStatus, virusScanDetails
# - uploadedAt, deletedAt
```

### 4. Build Backend

```bash
# Still in backend directory
npm run build
```

### 5. Build Frontend

```bash
cd ../frontend
npm install  # No new dependencies, but just in case
npm run build
```

### 6. Restart Backend with PM2

```bash
# From cyarika root directory
pm2 restart cyarika-backend

# Check logs for any errors
pm2 logs cyarika-backend --lines 50
```

### 7. Test the Deployment

Open your browser and navigate to your Cyar'ika instance:

#### Test CSRF Protection
1. Open browser DevTools → Network tab
2. Try creating/editing a document or character
3. Look for `x-csrf-token` header in POST/PUT/DELETE requests
4. Should see 200 responses (not 403)

#### Test File Upload
1. Click "Files" button in top navigation
2. Click "Choose File to Upload"
3. Select a small test file
4. Should see "Scanning for viruses..." then "File uploaded successfully!"
5. File should appear in the list below
6. Try downloading the file
7. Try deleting the file

#### Test Virus Scanning (Optional)
```bash
# On your local machine, download EICAR test virus (safe test file)
curl -o eicar.txt https://secure.eicar.org/eicar.com.txt

# Upload this file through the UI
# Should be rejected with "File contains malware" message
```

## Troubleshooting

### ClamAV Socket Error

**Error**: `ENOENT: no such file or directory, connect '/var/run/clamd.scan/clamd.sock'`

**Fix**:
```bash
# Check if ClamAV is running
sudo systemctl status clamd@scan

# Start if not running
sudo systemctl start clamd@scan

# Check socket exists
ls -la /var/run/clamd.scan/clamd.sock
```

### File Upload 500 Error

**Check backend logs**:
```bash
pm2 logs cyarika-backend --lines 100
```

**Common issues**:
- ClamAV not running → See ClamAV Socket Error above
- /tmp/uploads doesn't exist → `sudo mkdir -p /tmp/uploads && sudo chmod 777 /tmp/uploads`
- S3 credentials missing → Check `pm2 env 0` for AWS env vars
- S3 bucket doesn't exist → Create bucket in AWS console

### CSRF 403 Forbidden

**Symptoms**: All POST/PUT/DELETE requests fail with 403

**Fix**:
```bash
# Clear browser cookies for your domain
# Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+F5)
# CSRF token should be fetched on login
```

### Files Table Missing

**Error**: `relation "files" does not exist`

**Fix**:
```bash
cd /home/ec2-user/cyarika/backend
npm run db:push
pm2 restart cyarika-backend
```

## Post-Deployment Verification

1. **CSRF Protection**:
   - ✅ Can create/edit documents
   - ✅ Can create/edit characters
   - ✅ Can save settings
   - ✅ No 403 errors in console

2. **File Upload**:
   - ✅ Can upload files
   - ✅ Files appear in list
   - ✅ Can download files
   - ✅ Can delete files
   - ✅ Virus scanning works (test with EICAR)

3. **UI**:
   - ✅ "Files" button appears in header
   - ✅ FileManager component loads
   - ✅ No console errors

## Rollback Plan (If Needed)

```bash
# On EC2
cd /home/ec2-user/cyarika

# Checkout previous commit
git log --oneline  # Find previous commit hash
git checkout 5813934  # Replace with actual previous commit

# Rebuild and restart
cd backend && npm run build
cd ../frontend && npm run build
pm2 restart cyarika-backend
```

## Next Steps

After successful deployment:

1. ✅ Test file upload with various file types (PDF, images, documents)
2. ✅ Test large file uploads (100MB+)
3. ✅ Monitor ClamAV memory usage (`free -h`)
4. Consider: Set up automated virus definition updates
5. Consider: Add file type restrictions if needed
6. Consider: Add user file storage quotas

## Support

If you encounter issues:

1. Check PM2 logs: `pm2 logs cyarika-backend`
2. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check ClamAV logs: `sudo journalctl -u clamd@scan -n 50`
4. Check system resources: `htop` or `free -h`

---

**Deployed**: December 2024  
**Git Commit**: 117eec5  
**Features**: CSRF Protection, File Upload with ClamAV Malware Scanning
