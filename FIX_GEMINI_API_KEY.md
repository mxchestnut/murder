# Fix: Add Gemini API Key to AWS Secrets Manager

## The Issue
The `!kink`, `!feat`, and `!spell` commands are failing with:
```
Error in !feat command: Error: Gemini API key not configured
```

This is because the Gemini API key hasn't been added to AWS Secrets Manager yet.

## Solution

### Step 1: Get your Gemini API Key
1. Go to https://aistudio.google.com/apikey
2. Create a new API key (or copy your existing one)
3. Copy the key (it looks like: `AIzaSy...`)

### Step 2: Add to AWS Secrets Manager

**Option A: Using AWS Console**
1. Go to AWS Secrets Manager: https://console.aws.amazon.com/secretsmanager/
2. Click "Store a new secret"
3. Select "Other type of secret"
4. Select "Plaintext" tab
5. Paste your Gemini API key (just the key, no quotes or formatting)
6. Click "Next"
7. Secret name: `cyarika/gemini-api-key`
8. Click "Next" → "Next" → "Store"

**Option B: Using AWS CLI (Faster)**
```bash
aws secretsmanager create-secret \
  --name cyarika/gemini-api-key \
  --secret-string "YOUR_GEMINI_API_KEY_HERE" \
  --region us-east-1
```

Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key.

### Step 3: Deploy the Code Changes

The code has been updated to load the Gemini API key from secrets. Now deploy:

```bash
# From your local machine
cd /Users/kit/cyarika-project/cyarika
git add -A
git commit -m "Add Gemini API key support via AWS Secrets Manager"
git push origin main

# Deploy to EC2
ssh -i ~/.ssh/cyarika-deploy-key.pem ec2-user@100.49.41.171 \
  'cd cyarika && git pull && cd backend && npm run build && pm2 restart cyarika'
```

### Step 4: Verify It Works

In Discord, try:
```
!feat Weapon Finesse
!spell Fireball
!kink bondage
```

Should now work with AI responses!

---

## What Was Changed

1. **backend/src/config/secrets.ts**
   - Added `GEMINI_API_KEY` to the Secrets interface
   - Added loading from `cyarika/gemini-api-key` secret

2. **backend/src/server.ts**
   - Sets `process.env.GEMINI_API_KEY` from loaded secrets
   - Gemini service can now access the API key

3. **Error Handling**
   - Gemini service already had proper error handling
   - Just needed the key to be available

---

## Cost

Gemini 2.0 Flash is **FREE** with generous limits:
- 15 requests per minute
- 1500 requests per day
- 1 million requests per month

Your Discord bot usage will be well within these limits!

---

## Security Note

✅ **Good**: API key stored in AWS Secrets Manager (encrypted at rest)  
✅ **Good**: Not committed to git  
✅ **Good**: Loaded only in production environment  
❌ **Never**: Hardcode API keys in source code  
❌ **Never**: Commit .env files to git  
