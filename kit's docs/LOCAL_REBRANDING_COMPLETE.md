# Local Rebranding Complete ✅

**Date:** December 24, 2025  
**Status:** All local code changes completed

---

## Summary

All local code files have been successfully rebranded from "Cyar'ika" to "Murder Tech". The following changes were made:

---

## ✅ Root Configuration Files

### `/package.json`
- ✅ Changed name from `"cyarika"` to `"murder-tech"`
- ✅ Updated description

### `/ecosystem.config.js`
- ✅ Changed PM2 app name from `'cyarika-backend'` to `'murder-tech-backend'`

### `/nginx.conf`
- ✅ Updated server_name from `cyarika.com` to `murdertech.com` (placeholder domain)
- ✅ Updated SSL certificate paths
- ✅ Updated frontend path from `/home/ubuntu/cyarika/` to `/home/ubuntu/murder-tech/`

### `/deploy.sh`
- ✅ Updated all SSH paths and commands
- ✅ Updated echo messages
- ✅ Updated PM2 restart command

### `/.env.example`
- ✅ Updated database name from `cyarika` to `murder`
- ✅ Updated S3 bucket from `cyarika-documents` to `murder-tech-documents`

### `/README.md`
- ✅ Updated title and description
- ✅ Updated website URL
- ✅ Updated repository clone URL
- ✅ Updated Discord bot name
- ✅ Updated all "Write Pretend" references
- ✅ Updated project structure documentation
- ✅ Updated DNS configuration reference

---

## ✅ Backend Files

### `/backend/package.json`
- ✅ Updated description from "Cyarika private portal" to "Murder Tech roleplay platform"

### `/backend/src/config/secrets.ts`
- ✅ Updated AWS secret names:
  - `cyarika/database-url` → `murder/database-url`
  - `cyarika/session-secret` → `murder/session-secret`
  - `cyarika/discord-bot-token` → `murder/discord-bot-token`
  - `cyarika/gemini-api-key` → `murder/gemini-api-key`

### `/backend/src/config/s3.ts`
- ✅ Updated default bucket name from `'cyarika-documents'` to `'murder-tech-documents'`

### `/backend/src/server.ts`
- ✅ Updated CORS origins from `cyarika.com` to `murdertech.com`
- ✅ Updated Redis session prefix from `'cyarika:sess:'` to `'murder:sess:'`
- ✅ Updated CSRF cookie name from `'cyarika.x-csrf-token'` to `'murder.x-csrf-token'`

### `/backend/src/routes/auth.ts`
- ✅ Updated Redis session key pattern from `'cyarika:sess:*'` to `'murder:sess:*'`

### `/backend/src/routes/discord.ts`
- ✅ Updated comment "validates Cyarika credentials" → "validates Murder Tech credentials"
- ✅ Updated error messages mentioning "Cyarika account" → "Murder Tech account"
- ✅ Updated "Discord account not linked to Cyarika" → "Murder Tech"

### `/backend/src/routes/pathcompanion.ts`
- ✅ Updated comment "doesn't require Cyarika auth" → "Murder Tech auth"
- ✅ Updated authentication requirement comments (2 places)

### `/backend/src/services/playfab.ts`
- ✅ Updated CustomId from `cyarika_import_` to `murder_tech_import_`

### `/backend/src/services/discordBot.ts`
- ✅ Updated avatar URL domain from `https://cyarika.com` to `https://murdertech.com`
- ✅ Updated "Connecting to Write Pretend" → "Connecting to Murder Tech"
- ✅ Updated "Successfully connected to Write Pretend" → "Murder Tech"
- ✅ Updated "Authenticate with Cyarika backend" → "Murder Tech backend"
- ✅ Updated error message "Discord account not linked to Cyarika" → "Murder Tech"
- ✅ Updated help footer "Visit cyarika.com" → "murdertech.com"
- ✅ Removed hardcoded IP address, using domain name

---

## ✅ Frontend Files

### `/frontend/index.html`
- ✅ Updated meta description
- ✅ Updated title from "Cyar'ika - Roleplay Smarter" to "Murder Tech - Roleplay Platform"

### `/frontend/src/App.tsx`
- ✅ Updated console log from "Cyar'ika v2.0.0" to "Murder Tech v2.0.0"

### `/frontend/src/components/Login.tsx`
- ✅ Updated heading from "Login to Cyar'ika" to "Login to Murder Tech"

### `/frontend/src/components/HamburgerSidebar.tsx`
- ✅ Updated sidebar title from "Cyar'ika" to "Murder Tech"

### `/frontend/src/components/DiscordCommands.tsx`
- ✅ Updated "Cyar'ika bot" references to "Murder Tech bot" (2 places)

### `/frontend/src/components/Settings.tsx`
- ✅ Updated customization text "Cyar'ika" to "Murder Tech"

---

## ✅ Documentation Files

### Renamed Files
- ✅ `CYARIKA_ROADMAP.md` → `MURDER_ROADMAP.md`

### `/kit's docs/MURDER_ROADMAP.md`
- ✅ Updated title from "Cyar'ika" to "Murder Tech"
- ✅ Updated file path reference

### Created New Files
- ✅ `REBRANDING_AUDIT.md` - Comprehensive audit document
- ✅ `LOCAL_REBRANDING_COMPLETE.md` - This file

---

## 🔴 STILL REQUIRED - Server/AWS Changes

These changes CANNOT be done locally and require server access:

### AWS Secrets Manager
- [ ] Create new secrets with `murder/*` prefix
- [ ] Test in development first
- [ ] Update production after testing
- [ ] Delete old `cyarika/*` secrets after migration

### Database
- [ ] Create new database named `murder` OR rename existing
- [ ] Update DATABASE_URL in AWS Secrets Manager
- [ ] Test connection before production deployment

### Domain & DNS
- [ ] Register new domain (murdertech.com or alternative)
- [ ] Update Route 53 DNS records
- [ ] Get new SSL certificate with Let's Encrypt
- [ ] Test HTTPS access

### S3 Bucket
- [ ] Create new bucket: `murder-tech-documents`
- [ ] Update bucket CORS policy with new domain
- [ ] Migrate existing files OR start fresh
- [ ] Update IAM permissions

### EC2 Instance
- [ ] Update environment variables in ecosystem.config.js
- [ ] Restart PM2 with new configuration
- [ ] Test all functionality
- [ ] Update security group tags (optional)

### GitHub Repository
- [ ] Rename repository from `cyarika` to `murder-tech`
- [ ] Update repository description
- [ ] Update any GitHub Actions/workflows

---

## 📝 Testing Checklist

Before deploying to production, test these locally:

- [ ] Backend starts without errors
- [ ] Frontend builds successfully
- [ ] Database connection works (using .env, not AWS secrets)
- [ ] All API endpoints respond correctly
- [ ] Discord bot connects (if token provided)
- [ ] No console errors in browser
- [ ] Login/registration works
- [ ] Character sheets load
- [ ] File uploads work (if S3 configured)

---

## 🚀 Next Steps

1. **Test Locally:**
   ```bash
   cd /Users/kit/Code/MurderTech/Murder
   npm run dev
   ```
   - Verify backend starts on port 3000
   - Verify frontend starts on port 5173
   - Test basic functionality

2. **Review Audit:**
   - Read `REBRANDING_AUDIT.md` for complete task list
   - Prioritize AWS infrastructure changes
   - Plan deployment timeline

3. **Set Up AWS Resources:**
   - Follow instructions in audit document
   - Test each change in development/staging first
   - Document any issues encountered

4. **Deploy to Production:**
   - Only after ALL AWS resources are ready
   - Follow deployment checklist in audit
   - Monitor logs carefully
   - Have rollback plan ready

---

## ⚠️ Important Notes

### Domain Placeholder
- All code currently references `murdertech.com`
- This is a **placeholder** - choose actual domain before deployment
- Update nginx.conf, server.ts CORS, and discordBot.ts when domain is finalized

### Session Invalidation
- Changing Redis prefix will **log out all users**
- This is expected and acceptable for rebranding
- Users will need to log in again after deployment

### Database Migration
- Decide early: new database or rename existing?
- **New database** = clean slate but lose data
- **Rename existing** = keep data but requires careful migration
- Test thoroughly before production

### Testing Before Production
- **Critical:** Test in development with .env file first
- Then test with AWS secrets in staging/test environment
- Only deploy to production when everything works

---

## 📊 Statistics

- **Total Files Modified:** 21 code files
- **Total Lines Changed:** 50+ individual changes
- **Documentation Updated:** 2 files
- **Files Renamed:** 1 file
- **New Files Created:** 2 files

---

**Status:** ✅ Ready for AWS infrastructure setup and testing

**Next Action:** Review REBRANDING_AUDIT.md and begin AWS resource creation
