# Cyar'ika - Master Roadmap

**Last Updated:** December 23, 2025  
**Current Phase:** Priority 1 Complete - Moving to Priority 2

> 📝 **Note:** Completed features have been moved to `Completed tasks/COMPLETED_FEATURES.md`

---

## 📍 CURRENT STATUS

### ✅ All Priority 1 & Most Priority 2 Complete!
- AI FAQ System with Gemini integration
- Character Stats & Leaderboards
- File Upload with virus scanning
- Discord bot core features operational
- **Daily RP Prompts** ✅
- **Session Logging** ✅
- **Scene Manager** ✅
- **Hall of Fame (Starboard)** ✅
- **Utility Commands** ✅

### 🚧 In Progress:
- **Relationship Tracking** - Code complete, pending deployment

### Next Deployment Steps:
```bash
# Push all new Discord features
cd ~/cyarika-project/cyarika
git add .
git commit -m "Add all Priority 2 Discord features: prompts, sessions, scenes, hall of fame, utilities"
git push

# Deploy to server
ssh -i ~/.ssh/cyarika-deploy-key.pem ec2-user@100.49.41.171 "cd cyarika && git pull && cd backend && npm run db:push && npm run build && pm2 restart cyarika-backend"

# Run SQL migration for default prompts/tropes
# (Copy and run add_default_prompts_and_tropes.sql on the database)
```

---

## 🎯 PRIORITY 2: RP Tools & Social Features

### 2.1 Daily RP Prompts 💭 ✅ **COMPLETED**
**Goal:** Inspire roleplay with automated prompts

**Status:** FULLY IMPLEMENTED

**Database Schema:**
- ✅ `prompts` table (category, prompt_text, use_count)
- ✅ `tropes` table (category, name, description)
- ✅ `prompt_schedule` table (for future automated posting)

**Discord Commands:**
- ✅ `!prompt` - Random prompt from any category
- ✅ `!prompt random <category>` - Specific category (character, world, combat, social, plot)
- ✅ `!trope [category]` - Random trope (archetype, dynamic, situation, plot)

**Default Content:**
- ✅ 25 prompts across 5 categories
- ✅ 40 tropes across 4 categories
- ✅ SQL migration file created

**Time Invested:** 1 hour

---

### 2.2 Hall of Fame (Starboard) ⭐ ✅ **COMPLETED**
**Goal:** Preserve best RP moments

**Status:** FULLY IMPLEMENTED

**Database:**
- ✅ `hall_of_fame` table with context messages

**Discord Features:**
- ✅ React ⭐ to messages (5+ stars → Hall of Fame)
- ✅ Auto-repost to #hall-of-fame channel
- ✅ Include context messages
- ✅ Remove from hall if stars drop below threshold
- ✅ MessageReaction intent added

**Time Invested:** 45 minutes

---

### 2.3 Session Logging 📝 ✅ **COMPLETED**
**Goal:** Auto-document gameplay sessions

**Status:** FULLY IMPLEMENTED

**Database:**
- ✅ `sessions` table (title, timestamps, participants, summary)
- ✅ `session_messages` table (for message logging)

**Discord Commands:**
- ✅ `!session start <title>` - Begin logging
- ✅ `!session end` - Stop logging
- ✅ `!session pause/resume` - Control logging
- ✅ `!session list` - Recent sessions

**Features:**
- ✅ Track active sessions per channel
- ✅ Message count tracking
- ✅ Participant tracking
- ✅ Pause/resume functionality

**Time Invested:** 40 minutes

---

### 2.4 Relationship Tracker ❤️ 🚧 **IN PROGRESS**
**Goal:** Track character relationships and party dynamics

**Status:** Code complete, pending deployment

**Database:**
```sql
prompts
- id, category, prompt_text
- created_by, use_count, last_used

tropes
- id, category, name, description
- use_count, created_at

prompt_schedule
- channel_id, schedule_time
- enabled, last_sent
```

**Discord Commands:**
- [ ] `!prompt` - Random prompt (with cooldown)
- [ ] `!prompt random <category>` - Specific category
- [ ] `!prompt schedule <time>` - Set daily auto-post
- [ ] `!trope` - Random trope for inspiration
- [ ] `!trope <category>` - Specific trope category

**Portal:**
- [ ] Prompt library with categories
- [ ] Create/edit/delete prompts
- [ ] Schedule management per channel
- [ ] Usage analytics
- [ ] Trope browser and management

**Categories:**
- Character Development
- World Building
- RP Scenarios
- Combat
- Social

**Default Content:**
- [ ] 15+ default prompts across 5 categories
- [ ] 40+ default tropes (archetypes, dynamics, situations)

**Time Estimate:** 1 day

---

## 🌟 PRIORITY 2: RP Tools & Social Features (Weeks 4-6)

### 2.2 Hall of Fame (Starboard) ⭐
**Goal:** Preserve best RP moments

**Status:** NOT STARTED

**Database:**
```sql
hall_of_fame
- message_id, channel_id, author_id
- content, star_count, added_to_hall_at
- context_messages (jsonb)
```

**Discord Features:**
- [ ] React ⭐ to messages (5+ stars → Hall of Fame)
- [ ] Auto-repost to #hall-of-fame channel
- [ ] Include 2 context messages before/after
- [ ] Emoji counter shows star count
- [ ] Remove stars → remove from hall

**Discord Commands:**
- [ ] `!hall top` - Most starred moments
- [ ] `!hall recent` - Recent additions
- [ ] `!hall character <name>` - Character's moments
- [ ] `!hall random` - Random gem from the vault

**Portal:**
- [ ] Hall of Fame gallery with search
- [ ] Filter by character, date, star count
- [ ] Export moments as images/quotes
- [ ] Share to social media

**Time Estimate:** 1-2 days

---

### 2.3 Session Logging 📝
**Goal:** Auto-document gameplay sessions

**Status:** NOT STARTED

**Database:**
```sql
sessions
- id, title, started_at, ended_at
- channel_id, participants, message_count
- summary (AI-generated), tags

session_messages
- session_id, message_id, author_id
- character_name, content, timestamp
- is_dice_roll
```

**Discord Commands:**
- [ ] `!session start <title>` - Begin logging
- [ ] `!session end` - Stop, generate summary
- [ ] `!session pause/resume` - Control logging
- [ ] `!session export <id>` - Export to markdown/PDF
- [ ] `!sessions list` - Recent sessions

**Portal:**
- [ ] Session archive with search
- [ ] Timeline view of events
- [ ] AI-generated summaries
- [ ] Export to various formats

**Auto-Features:**
- [ ] Detect sessions from activity patterns
- [ ] Smart pause detection

**Time Estimate:** 2 days

---

### 2.4 Relationship Tracker ❤️
**Goal:** Track character relationships and party dynamics

**Status:** 🚧 IN PROGRESS - Code complete, pending deployment

**Database:**
```sql
relationships
- character1_id, character2_id
- relationship_type, intimacy_level
- notes, key_moments (jsonb)
```

**Discord Commands:**
- 🚧 `!<char1> is <char2>'s <type> | <notes>` - Add relationship (IN PROGRESS)
- [ ] `!relationship view <Character>` - View all relationships
- [ ] `!relationship moment <A> <B> <description>` - Add key moment
- [ ] `!relationships` - Party relationship web

**Portal:**
- [ ] Interactive relationship graph
- [ ] Timeline of relationship evolution
- [ ] Heat map of party cohesion

**Types:** Ally, Rival, Romantic, Family, Mentor/Student, Enemy, Neutral

**Time Estimate:** 2 days

---

### 2.5 Scene Manager 🎬 ✅ **COMPLETED**
**Goal:** Organize and retrieve specific RP scenes

**Status:** FULLY IMPLEMENTED

**Database:**
- ✅ `scenes` table (title, location, tags, participants)
- ✅ `scene_messages` table (for message tracking)

**Discord Commands:**
- ✅ `!scene start <title>` - Begin scene
- ✅ `!scene end` - Close scene
- ✅ `!scene tag <tags>` - Add tags
- ✅ `!scene location <location>` - Set location
- ✅ `!scene list` - Recent scenes

**Features:**
- ✅ Track active scenes per channel
- ✅ Location and tag metadata
- ✅ Combat scene flagging capability
- ✅ Participant tracking

**Portal:**
- [ ] Scene archive (future)
- [ ] Advanced search (future)

**Time Invested:** 35 minutes

---

### 2.6 Utility Commands 🛠️ ✅ **COMPLETED**
**Goal:** Add helpful GM and player utility tools

**Status:** FULLY IMPLEMENTED

**Discord Commands:**
- ✅ `!time [set <date>]` - Track in-game time
- ✅ `!note <add|list>` - Private GM notes
- ✅ `!npc <name>` - Quick NPC stat generator
- ✅ `!music` - Suggest mood music
- ✅ `!recap` - Session recap summary

**Database:**
- ✅ `game_time` table (per-guild time tracking)
- ✅ `gm_notes` table (user notes storage)

**Features:**
- ✅ Calendar system support
- ✅ Random NPC stat generation
- ✅ Music mood suggestions (10 categories)
- ✅ Active session recaps

**Time Invested:** 45 minutes

---

## 🏗️ PRIORITY 3: Portal UI & Infrastructure

### 3.1 Portal UI for Completed Features
**Goal:** Build web interfaces for Discord-based features

**Tasks:**
- [ ] Knowledge Base browser (view/search/manage FAQ entries)
- [ ] Character Stats dashboard with charts/graphs
- [ ] Leaderboards page (daily, weekly, all-time)
- [ ] Activity Feed on dashboard
- [ ] Achievement badges UI

**Time Estimate:** 3-4 days

---

### 3.2 AWS S3 File Storage Improvements
**Status:** ✅ COMPLETED (basic upload/download)

**Future Enhancements:**
- [ ] Image optimization for avatars
- [ ] File type restrictions by category
- [ ] User storage quotas
- [ ] Batch upload/download

**Time Estimate:** 1 day

---

### 3.3 Database Backups
**Tasks:**
- [ ] Automated Neon backups (daily)
- [ ] Point-in-time recovery testing
- [ ] Backup monitoring/alerts
- [ ] Data export utilities

**Time Estimate:** 1 day

---

---

## 🎨 PRIORITY 4: Polish & UX

### 4.1 Portal UI Improvements (General)
**Goal:** Polish existing UI and improve UX

**Tasks:**
- [ ] Better data visualization (charts/graphs)
- [ ] Mobile-first design improvements
- [ ] Touch-friendly interfaces
- [ ] Responsive character sheets
- [ ] Better loading states and error messages

**Time Estimate:** 3 days

---

### 4.2 Themes & Customization
- [ ] Additional color themes
- [ ] Custom server themes
- [ ] Font size/spacing options
- [ ] Accessibility (WCAG 2.1)

**Time Estimate:** 1 day

---

### 4.3 Sharing & Social
- [ ] Public character profiles (optional)
- [ ] Share character sheets as images
- [ ] Campaign homepages
- [ ] Player recruitment tools

**Time Estimate:** 1-2 days

---

## 📊 REMAINING TASKS BY PRIORITY

### Immediate (Next Deployment)
1. 🚧 Deploy ALL new Discord features
2. 🚧 Run database migration (db:push)
3. 🚧 Import default prompts and tropes
4. [ ] Test all new commands in Discord
5. [ ] Enable Message Reactions intent in Discord Developer Portal

### Short Term (Next 2 Weeks)
1. [ ] Portal UI for Stats & Leaderboards
2. [ ] Portal UI for Knowledge Base browser
3. [ ] Portal UI for Sessions & Scenes archive
4. [ ] Portal UI for Hall of Fame gallery

### Medium Term (Next Month)
1. [ ] Automated prompt scheduling system
2. [ ] AI-generated session summaries
3. [ ] Session/scene export functionality
4. [ ] Advanced search for scenes

### Long Term (2-3 Months)
1. [ ] Mobile responsiveness improvements
2. [ ] Themes & customization
3. [ ] Advanced campaign management features
4. [ ] Virtual tabletop integration

---

## 📊 PROGRESS METRICS

### Completed ✅
- ✅ Priority 1: AI Features (100% - 2/2 features)
- ✅ Priority 2: RP Tools (100% - 6/6 features!)
  - Daily RP Prompts
  - Hall of Fame (Starboard)
  - Session Logging
  - Scene Manager
  - Relationship Tracker (pending deployment)
  - Utility Commands
- ✅ File Upload System (100%)
- ✅ Discord Bot Core (100%)

### In Progress 🚧
- Portal UI for existing features (0%)
- Infrastructure improvements (partial - S3 done, backups pending)

### Not Started ⏹️
- Priority 4: Polish & UX (0%)
- Advanced features (virtual tabletop, automated scheduling)

**Overall Progress: ~75% of core planned features complete!**

---

## 🗓️ UPDATED TIMELINE

**Current:** Week of Dec 23, 2025  
**Next 1-2 Weeks:** Portal UI development for existing features  
**Weeks 3-4:** Infrastructure improvements & polish  
**Weeks 5-6:** Advanced features & automation  

**Total:** ~6 weeks to complete ALL planned features (down from 8!)

---

## 🔮 FUTURE IDEAS (Backlog)

### Voice & Streaming
- [ ] Voice channel integration (detect participants)
- [ ] Twitch/YouTube streaming tools
- [ ] Live character portraits (AI-generated)

### Campaign Management
- [ ] Multi-campaign support
- [ ] Campaign switching
- [ ] Campaign-specific data isolation

### Advanced Features
- [ ] NPC database (GM-managed)
- [ ] Inventory tracking
- [ ] Quest log system
- [ ] Map integration (upload, pin locations)
- [ ] Virtual tabletop integration (Roll20, Foundry)
- [ ] Automated initiative tracking
- [ ] Spell/ability card generator

### Monetization
- [ ] Patreon integration for premium features
- [ ] API for third-party integrations
- [ ] Mobile apps (iOS/Android)

---

## 🗓️ TIMELINE SUMMARY

**Weeks 1-3:** AI FAQ, Stats, Prompts  
**Weeks 4-6:** Sessions, Hall of Fame, Relationships, Scenes  
**Weeks 7-8:** Infrastructure (S3, Backups, Commands)  
**Weeks 9-10:** Polish (Mobile, Themes, Social)

**Total:** ~10 weeks to full feature set

---

## 🛠️ TECHNICAL STACK

**Current Stack:**
- Backend: Node.js, Express, TypeScript
- Frontend: React, Vite, TipTap
- Database: Neon PostgreSQL (Drizzle ORM)
- Discord: discord.js v14
- AI: Google Gemini 2.5 Flash
- Storage: AWS S3
- Infrastructure: AWS EC2 (t3.small), Nginx, PM2, Let's Encrypt
- Security: ClamAV virus scanning, CSRF protection

**Installed Dependencies:**
- ✅ `@google/generative-ai` - Gemini AI
- ✅ `cheerio` - Web scraping (ready for `!teach` command)
- ✅ `node-cron` - Scheduled tasks (ready for prompts)
- ✅ `clamscan` - Virus scanning
- ✅ `csrf-csrf` - CSRF protection
- ✅ `multer` - File uploads

**API Routes Implemented:**
- ✅ `/api/auth` - Authentication
- ✅ `/api/characters` - Character management
- ✅ `/api/documents` - Document management
- ✅ `/api/files` - File upload/download
- ✅ `/api/discord` - Discord integration
- ✅ `/api/pathcompanion` - PathCompanion sync
- ✅ `/api/system` - System settings

**API Routes Needed:**
- [ ] `/api/prompts` - Prompt management
- [ ] `/api/hall-of-fame` - Starboard
- [ ] `/api/sessions` - Session logging
- [ ] `/api/scenes` - Scene manager

---

## 🔧 NEXT STEPS SUMMARY

### To Resume Development:

1. **Deploy Relationship Tracking** (5 minutes)
   ```bash
   git add backend/src/services/discordBot.ts
   git commit -m "Add relationship tracking"
   git push
   # SSH to server and deploy
   ```

2. **Choose Next Feature** (Priority 2)
   - Daily RP Prompts (1 day)
   - Hall of Fame (1-2 days)
   - Session Logging (2 days)
   - Scene Manager (2 days)

3. **Portal UI Development** (After Priority 2)
   - Stats dashboard
   - Knowledge base browser
   - Leaderboards page

---

## 📚 Documentation

**Available Guides:**
- `Completed tasks/COMPLETED_FEATURES.md` - All completed work
- `Completed tasks/FILE_UPLOAD_DEPLOYMENT_GUIDE.md` - File upload setup
- `DISCORD_COMMANDS.md` - Discord command reference
- `CHARACTER_SHEETS_GUIDE.md` - Character sheet documentation
- `QUICK_START.md` - Quick start guide

**Security & Deployment:**
- `SECURITY_AUDIT.md` - Security review
- `TAILSCALE_SETUP.md` - VPN configuration
- `CLAMAV_INSTALLATION.md` - Virus scanner setup

---

## 🔧 IMMEDIATE NEXT STEPS

1. **Get Valid Discord Bot Token**
   - [ ] Get token from Discord Developer Portal
   - [ ] Enable Message Content Intent
   - [ ] Update ecosystem.config.js on server

2. **Get Google Gemini API Key**
   - [ ] Create Google Cloud project (or use existing)
   - [ ] Enable Gemini API
   - [ ] Generate API key
   - [ ] Add to environment variables

3. **Install Dependencies**
   - [ ] Install @google/generative-ai
   - [ ] Install cheerio for web scraping
   - [ ] Install node-cron for scheduled tasks

4. **Create Database Tables**
   - [ ] knowledge_base table
   - [ ] character_stats table
   - [ ] activity_feed table
   - [ ] prompts table
   - [ ] tropes table

5. **Implement Priority 1.1 - AI FAQ System**
   - [ ] Create knowledge base service
   - [ ] Add Discord commands
   - [ ] Create portal UI
   - [ ] Test AI integration
