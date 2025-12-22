# Rebrand Migration: Cyarika → Write Pretend

## 🎯 Vision
**Write Pretend** - A comprehensive roleplay platform with Discord bot integration, character management, AI-powered assistance, and session tracking for tabletop RPG communities.

## 📋 Migration Checklist

### Phase 1: Domain & AWS Setup
- [ ] Configure Route53 for writepretend.com
- [ ] Point A record to EC2 (54.242.214.56)
- [ ] Update SSL certificate (if using HTTPS)
- [ ] Configure nginx for new domain
- [ ] Test domain accessibility

### Phase 2: Backend Rebrand
- [ ] Update environment variables (.env)
  - FRONTEND_URL → http://writepretend.com (or IP during transition)
  - Update any hardcoded references
- [ ] Rename database if needed (optional - can keep internal name)
- [ ] Update API documentation
- [ ] Update CORS origins

### Phase 3: Frontend Rebrand
- [ ] Update page titles and meta tags
- [ ] Replace "Cyarika" with "Write Pretend" in UI
- [ ] Update logo/branding assets
- [ ] Update footer/about sections
- [ ] Favicon update

### Phase 4: Discord Bot Rebrand
- [ ] Rename bot: PathKeeper → Write Pretend Bot
- [ ] Update bot description on Discord Developer Portal
- [ ] Update bot avatar/icon
- [ ] Update !help command text
- [ ] Update command descriptions
- [ ] Update OAuth2 invite link

### Phase 5: Documentation Updates
- [ ] README.md
- [ ] PROJECT_SNAPSHOT.md
- [ ] PATHKEEPER_ROADMAP.md → WRITEPRETEND_ROADMAP.md
- [ ] All deployment docs
- [ ] GitHub repository description
- [ ] Repository name (optional - cyarika can stay as internal)

### Phase 6: GitHub & Repository
- [ ] Update repository description
- [ ] Update repository topics/tags
- [ ] Consider renaming repo (cyarika → writepretend) - optional
- [ ] Update any badges/links in README

---

## 🚀 New Branding

### Name
**Write Pretend** (writepretend.com)

### Tagline Ideas
- "Your AI-powered companion for tabletop roleplaying"
- "Roleplay smarter, not harder"
- "Where stories come alive"
- "The ultimate roleplay assistant"

### Bot Name
**Write Pretend Bot** (or just "Write Pretend")

### Color Scheme Suggestions
- Primary: Deep purple (#6B46C1) - creativity, imagination
- Secondary: Warm gold (#F59E0B) - adventure, excitement
- Accent: Teal (#14B8A6) - community, connection

### Logo Ideas
- Quill pen + d20 die
- Open book with dice
- Theater masks with fantasy elements
- Minimalist "WP" monogram

---

## 📝 Implementation Plan

### Step 1: Route53 Configuration
```bash
# We'll configure A record pointing to 54.242.214.56
# Optionally CNAME www.writepretend.com → writepretend.com
```

### Step 2: Update .env Files
**Backend (.env):**
```env
FRONTEND_URL=http://writepretend.com
# Or during transition: http://54.242.214.56
```

### Step 3: Frontend Updates
**Key files to update:**
- `frontend/index.html` - title, meta tags
- `frontend/src/App.tsx` - branding text
- `frontend/src/components/Dashboard.tsx` - welcome message
- `frontend/src/components/Sidebar.tsx` - app name

### Step 4: Discord Bot Updates
**Files to update:**
- `backend/src/services/discordBot.ts` - help text, descriptions
- Discord Developer Portal - bot name, description, icon
- New OAuth2 URL with updated name

### Step 5: Documentation
**Files to update:**
- `README.md` - project title, description
- `PATHKEEPER_ROADMAP.md` → `WRITEPRETEND_ROADMAP.md`
- `PROJECT_SNAPSHOT.md` - project overview
- All deployment guides

---

## 🎨 Branding Assets Needed

### Immediate
- [ ] Bot avatar/icon (512x512 PNG)
- [ ] Favicon (32x32, multiple sizes)
- [ ] Logo (SVG preferred, various sizes)

### Future
- [ ] Social media cards (1200x630)
- [ ] Documentation graphics
- [ ] Landing page hero image

---

## ⚠️ Migration Risks & Mitigations

### Risk 1: Domain propagation delay
**Mitigation:** Keep IP address working during transition, update gradually

### Risk 2: Broken Discord webhook links
**Mitigation:** Update FRONTEND_URL env var, test webhooks before full migration

### Risk 3: User confusion
**Mitigation:** Announce rebrand in Discord, update bot with migration message

### Risk 4: Database connections
**Mitigation:** No database changes needed, connection strings stay same

---

## 🔄 Rollback Plan

If issues arise:
1. Keep old domain accessible temporarily
2. Environment variables easily reverted
3. Git history preserves all changes
4. Database unchanged (safe)

---

## 📅 Timeline

**Estimated Time:** 2-3 hours

1. **Domain Setup** (30 min)
   - Route53 configuration
   - DNS testing

2. **Code Updates** (1 hour)
   - Environment variables
   - Frontend branding
   - Bot rename

3. **Testing** (30 min)
   - Domain accessibility
   - Discord bot functionality
   - Portal features

4. **Documentation** (30 min)
   - Update all docs
   - Commit and push

5. **Deployment** (30 min)
   - Deploy to production
   - Final testing

---

## ✅ Post-Migration Verification

- [ ] writepretend.com loads portal
- [ ] Discord bot responds with new name
- [ ] Character proxying works with new avatar URLs
- [ ] All existing features functional
- [ ] Documentation up to date
- [ ] GitHub repo updated

---

## 🎉 Launch Announcement

**Discord Message Template:**
```
🎭 **BIG NEWS!** 🎭

Cyarika is evolving! We're becoming **Write Pretend** - your AI-powered companion for tabletop roleplaying!

✨ What's changing:
• New name: Write Pretend
• New domain: writepretend.com
• Same awesome features you love!
• PLUS exciting new features coming soon!

🚀 What's staying:
• All your characters
• All your data
• All your favorite commands
• Your amazing community!

Check out the new portal at writepretend.com and let us know what you think!

- The Write Pretend Team
```

---

**Status:** Ready to begin migration
**Next Steps:** Start with Route53 domain configuration
