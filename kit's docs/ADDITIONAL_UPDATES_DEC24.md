# Additional Updates - December 24, 2025

**Changes requested by user:**
1. Update domain from murdertech.com to murder.tech
2. Remove Neon references, use AWS RDS
3. Change OpenAI references to Google Gemini 2.5 Flash
4. Remove adult content (!kink command)

---

## ✅ Changes Completed

### 1. Domain Updated to murder.tech

**Files Updated:**
- ✅ `/nginx.conf` - Updated server_name (2 places), SSL certificate paths
- ✅ `/deploy.sh` - Updated SSH targets (3 places)
- ✅ `/backend/src/server.ts` - Updated CORS origins
- ✅ `/backend/src/services/discordBot.ts` - Updated avatar URL, error messages, help footer
- ✅ `/README.md` - Updated website link and DNS configuration

**New Domain:**
- Primary: `murder.tech`
- WWW: `www.murder.tech`
- SSL Certificate Path: `/etc/letsencrypt/live/murder.tech/`

---

### 2. Removed Neon, Using AWS RDS

**Files Updated:**
- ✅ `/README.md` - Changed "PostgreSQL (Neon serverless)" to "PostgreSQL (AWS RDS)"
- ✅ `/README.md` - Changed prerequisites from "Neon recommended" to "AWS RDS recommended"
- ✅ `/.github/copilot-instructions.md` - Updated from "PostgreSQL (Neon)" to "PostgreSQL (AWS RDS)"

**Note:** Historical documentation files (QUICK_START.md, SESSION_SUMMARY_DEC24_2025.md) still reference Neon as they are historical records. Current production uses AWS RDS.

---

### 3. Updated AI References to Google Gemini

**Files Updated:**
- ✅ `/README.md` - Changed "OpenAI GPT-4 (planned)" to "Google Gemini 2.5 Flash (optional)"
- ✅ `/README.md` - Changed "OpenAI API key" to "Google Gemini API key (optional)"

**Current AI Stack:**
- AI Model: Google Gemini 2.5 Flash
- Purpose: Optional FAQ assistance, not core dependency
- Command: `!ask <question>`

---

### 4. Removed Adult Content (!kink command)

**Files Updated:**
- ✅ `/backend/src/services/discordBot.ts` - Removed `case 'kink':` handler
- ✅ `/backend/src/services/discordBot.ts` - Removed `handleKink()` function
- ✅ `/backend/src/services/discordBot.ts` - Removed kink from help command text
- ✅ `/kit's docs/KNOWLEDGE_BASE_CATEGORIES.md` - Removed kink section
- ✅ `/kit's docs/DISCORD_COMMANDS.md` - Removed !kink command documentation (2 places)

**Remaining Commands:**
- `!ask <question>` - General AI questions
- `!feat <name>` - D&D/Pathfinder feat information
- `!spell <name>` - Spell information
- `!learn` - Admin teaching
- `!learnurl` - Learn from URLs

---

## 📊 Summary Statistics

- **Files Modified:** 10 files
- **Lines Changed:** 30+ individual changes
- **Commands Removed:** 1 (!kink)
- **Domain References Updated:** 8 locations

---

## 🧪 Testing Required

Before deployment, verify:

### Domain Changes
- [ ] Update DNS to point murder.tech to EC2
- [ ] Get new SSL certificate for murder.tech
- [ ] Test CORS with new domain
- [ ] Verify Discord bot messages show correct domain

### Database
- [ ] Confirm using AWS RDS (not Neon)
- [ ] Verify connection string in production
- [ ] Test database connectivity

### AI Features
- [ ] Verify Gemini API key is set
- [ ] Test !ask command works
- [ ] Confirm !kink command no longer responds

### Bot Commands
- [ ] Test !help shows updated command list
- [ ] Verify no kink references in help text
- [ ] Test remaining knowledge commands (!feat, !spell)

---

## 🚀 Deployment Notes

### SSL Certificate
When deploying to production with murder.tech:
```bash
sudo certbot certonly --nginx -d murder.tech -d www.murder.tech
```

### Environment Variables
Ensure these are set correctly:
- `GEMINI_API_KEY` - For AI features (optional)
- `DATABASE_URL` - Points to AWS RDS (not Neon)
- Domain in CORS matches `murder.tech`

### User Communication
- Inform users domain has changed from murdertech.com to murder.tech
- Update any bookmarks or saved links
- Discord bot help command will show new domain

---

**Status:** ✅ All changes complete and ready for testing

**Next Steps:** Test locally, then deploy to production with new domain
