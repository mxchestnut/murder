# Neon Database Backup Guide

## 📋 How to Check Your Neon Backup Status

### Step 1: Access Neon Console
1. Go to https://console.neon.tech/
2. Log in with your account
3. Select your **Cyar'ika** project

### Step 2: Check Backup Settings

Look for these features in your Neon dashboard:

#### A. **Point-in-Time Recovery (PITR)** 
- Location: Project Settings → Backups
- This is Neon's main backup feature
- **Free Tier:** 7 days of history
- **Paid Plans:** Up to 30 days of history
- Allows you to restore to any point in time within the retention period

#### B. **Branch History**
- Neon automatically keeps branch history
- You can restore from historical states
- Check: Project → Branches → View history

#### C. **Automatic Snapshots**
- Neon takes automatic snapshots for recovery
- These are managed automatically
- No configuration needed

---

## ✅ What to Verify

Check if these are enabled in your Neon project:

- [ ] **PITR enabled** (likely automatic on all plans)
- [ ] **Retention period** (7 days on Free, up to 30 on paid)
- [ ] **Branch protection** (prevent accidental deletions)
- [ ] **Backup frequency** (automatic, continuous)

---

## 🔍 Current Backup Status

**To check your exact configuration:**

1. Go to: https://console.neon.tech/app/projects
2. Click on your Cyar'ika project
3. Go to **Settings** → **General** → Check plan details
4. Go to **Settings** → **Backups** (if available on your plan)

---

## 📊 Neon Backup Features by Plan

### Free Tier (Likely your current plan)
- ✅ Automatic snapshots
- ✅ 7-day point-in-time recovery
- ✅ Branch history
- ✅ No manual configuration needed
- ❌ Limited retention period

### Launch Plan ($19/mo)
- ✅ 7-day PITR
- ✅ Better compute limits
- ✅ More storage

### Scale Plan ($69/mo)
- ✅ **30-day PITR** (best for production)
- ✅ Read replicas
- ✅ Advanced features

---

## 🔄 Testing Point-in-Time Recovery

**How to test restore (DO THIS IN TEST ENVIRONMENT):**

1. Create a test branch from main:
   - Neon Console → Branches → Create Branch
   - Name it `recovery-test`
   
2. Make a test change in the branch
   - Add/delete some test data
   
3. Try to restore to a previous point:
   - Click on the branch
   - Look for "Restore" or "Reset to point in time"
   - Select a timestamp before your test change
   
4. Verify data is restored correctly

**⚠️ DO NOT test on main/production branch!**

---

## 💾 Additional Backup Recommendations

Since Neon handles automatic backups, here's what YOU should do:

### 1. Manual Database Exports (Weekly)
Create a backup script for peace of mind:

```bash
# On EC2 or locally
pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d).sql
```

### 2. Store Critical Data Externally
- Export character sheets to JSON weekly
- Backup knowledge base entries
- Keep copies of critical tables

### 3. Monitor Neon Status
- Check: https://neonstatus.com/
- Sign up for status notifications

---

## 🚨 Disaster Recovery Plan

**If you need to recover data:**

1. **Recent data loss (< 7 days):**
   - Use Neon's PITR feature
   - Restore to exact timestamp before data loss
   
2. **Older data loss (> 7 days on free tier):**
   - Restore from manual SQL dumps (if you have them)
   - Contact Neon support
   
3. **Complete database loss:**
   - Restore from latest manual dump
   - Neon has redundancy, this is extremely unlikely

---

## 📝 Recommended Actions

**Immediate (Today):**
1. ✅ Log into Neon console and verify PITR is enabled
2. ✅ Check your current plan and retention period
3. ✅ Note the retention period (likely 7 days)
4. ✅ Test creating a branch (non-destructive test)

**This Week:**
1. ⬜ Set up weekly manual SQL exports (see script below)
2. ⬜ Create a monitoring alert for database issues
3. ⬜ Document your Neon project ID and region

**Monthly:**
1. ⬜ Verify backups are still working
2. ⬜ Review Neon storage usage
3. ⬜ Consider upgrading if you need longer retention

---

## 🛠️ Manual Backup Script (Optional)

Create this script on your EC2 instance:

```bash
#!/bin/bash
# /home/ec2-user/scripts/backup-database.sh

# Get database URL from AWS Secrets Manager
DB_URL=$(aws secretsmanager get-secret-value \
  --secret-id cyarika/production \
  --query SecretString \
  --output text | jq -r '.DATABASE_URL')

# Create backup directory
BACKUP_DIR="/home/ec2-user/backups"
mkdir -p $BACKUP_DIR

# Export database
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/cyarika-$DATE.sql"

echo "Starting backup at $(date)"
pg_dump "$DB_URL" > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"

# Upload to S3
aws s3 cp "${BACKUP_FILE}.gz" s3://cyarika-documents-680363506283/backups/

# Keep only last 7 local backups
cd $BACKUP_DIR
ls -t cyarika-*.sql.gz | tail -n +8 | xargs -r rm

echo "Backup complete: ${BACKUP_FILE}.gz"
```

**To automate weekly:**
```bash
# Add to crontab
crontab -e

# Add this line (runs every Sunday at 3 AM):
0 3 * * 0 /home/ec2-user/scripts/backup-database.sh >> /home/ec2-user/logs/backup.log 2>&1
```

---

## ℹ️ More Information

- **Neon Docs:** https://neon.tech/docs/introduction/point-in-time-restore
- **Neon Pricing:** https://neon.tech/pricing
- **Support:** support@neon.tech

---

**Next Steps:**
1. Check your Neon console now to verify backup settings
2. Report back what you find (retention period, plan type)
3. Decide if you need additional manual backups
