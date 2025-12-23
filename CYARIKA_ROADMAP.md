# Cyar'ika - Master Roadmap

**Last Updated:** December 23, 2025  
**Current Phase:** Discord Bot Enhancement Complete - Ready for Priority 1

---

## 📍 CURRENT CHECKPOINT (Dec 23, 2025 - 11:45 PM)

### What We Just Completed:
1. ✅ **HTML Stripping** - All profile fields now strip HTML tags from TipTap editor
2. ✅ **Race Parsing** - Race field parses JSON to show readable name
3. ✅ **Relationship Tracking System** - BUILT BUT NOT DEPLOYED
   - Command: `!<character> is <character>'s <descriptor> | <notes>`
   - Example: `!Ogun is Rig's best friend. | They admire each other.`
   - Database: Uses existing `relationships` table
   - Profile: Displays tracked relationships in Relationships tab
   - Status: Code complete, builds successfully, ready to commit and deploy

### Next Steps When Resuming:
1. **IMMEDIATE**: Commit and deploy relationship tracking
   ```bash
   cd ~/cyarika-project/cyarika
   git add backend/src/services/discordBot.ts
   git commit -m "Add relationship tracking command and profile display"
   git push
   ssh -i ~/.ssh/cyarika-deploy-key.pem ec2-user@100.49.41.171 "cd cyarika && git pull && cd backend && npm run build && pm2 restart cyarika-backend"
   ```
2. **TEST**: `!Ogun is Rig's best friend. | They admire each other.`
3. **VERIFY**: `!profile ogun` should show relationship in Relationships tab

### Technical Notes:
- Modified `discordBot.ts` with async buildEmbed function
- Relationship parsing happens BEFORE name-based rolling check
- Uses fuzzy matching for character names (normalizeString)
- Stores character1Id, character2Id, relationshipType, notes
- Profile queries both directions (where character is char1 OR char2)

---

## ✅ COMPLETED

### Phase 0: Infrastructure & Setup (Dec 23, 2025)
- ✅ AWS EC2 instance (t3.small, Amazon Linux 2023)
- ✅ Domain setup (cyarika.com via Route 53)
- ✅ SSL certificate (Let's Encrypt, auto-renewing)
- ✅ Neon PostgreSQL database
- ✅ Discord bot created (Cyar'ika#0881)
- ✅ Repository cloned from Write Pretend as independent project
- ✅ Custom color scheme (lavender/dark theme)
- ✅ Character bio system with extensive fields
- ✅ Tabbed interface (Stats & Combat / Biography & Personality)
- ✅ PathCompanion integration (sync FROM only, no export)
- ✅ Full-width layout for character panels
- ✅ Login rebranded to Cyar'ika

### Discord Bot Enhancements (Dec 23, 2025)
- ✅ Database password rotation handled (Neon credentials updated)
- ✅ Skills JSON parsing (roll commands now work with PathCompanion data)
- ✅ Name-based rolling (`!CharName perception` works in ANY channel)
- ✅ Tabbed profile UI (12 tabs matching portal structure)
- ✅ Interactive button navigation (5-minute timeout, user-locked)
- ✅ Avatar URL conversion to absolute paths
- ✅ HTML tag stripping from all profile fields
- ✅ Race JSON parsing (shows clean race name)
- ✅ AI FAQ system (`!ask`, `!learn` with knowledge base + Gemini fallback)
- ✅ Character stats tracking (`!stats`, `!leaderboard` with activity logging)
- ✅ Gemini safety filters lowered to BLOCK_NONE (adult content server)
- ⏸️ **Relationship tracking** - Code complete, needs deployment (see checkpoint above)

---

## 🎯 PRIORITY 1: AI-Powered Features & Core Engagement (Next 2-3 Weeks)

### 1.1 AI-Powered FAQ System ✅ **COMPLETED**
**Goal:** Build intelligent knowledge base that learns from URLs and interactions

**Database:**
```sql
knowledge_base
- id, question, answer, source_url
- created_by, created_at, upvotes
- ai_generated (boolean)
- category (text)
```

**Discord Commands:**
- ✅ `!ask <question>` - Search DB, fallback to AI
- ✅ `!learn <question> | <answer>` - Manual entry (admin)
- [ ] `!teach <url>` - AI scrapes and learns from URL
- [ ] `!kb search <keyword>` - Search knowledge base
- [ ] React ⭐ to save AI answer to DB

**Portal:**
- [ ] Knowledge base browser with search/filter
- [ ] Add/edit/delete entries
- [ ] Category management
- [ ] Analytics (most asked questions)

**Tech:** Google Gemini 2.5 Flash API, Cheerio for web scraping

**Status:** Core commands done, portal UI pending

---

### 1.2 Character Stats & Leaderboards ✅ **COMPLETED**
**Goal:** Track character activity and create engaging leaderboards

**Database:**
```sql
character_stats
- character_id, total_messages, total_dice_rolls
- nat20_count, nat1_count, total_damage_dealt
- last_active, created_at

activity_feed
- character_id, activity_type, description
- metadata (jsonb), timestamp
```

**Discord Commands:**
- ✅ `!stats` - Stats for character linked to channel
- ✅ `!stats <character_name>` - Stats for any character
- ✅ `!leaderboard messages` - Most active characters
- ✅ `!leaderboard rolls` - Most dice rolls
- ✅ `!leaderboard crits` - Most nat20s
- ✅ `!leaderboard fails` - Most nat1s (fun shame!)

**Portal:**
- [ ] Real-time activity feed on dashboard
- [ ] Character statistics page with charts
- [ ] Leaderboards (daily, weekly, all-time)
- [ ] Character achievement badges

**Tracked Events:**
- ✅ Every proxy message sent as character
- ✅ Every dice roll made by character
- ✅ Nat20s and Nat1s (with timestamps)
- ✅ Session participation

**Status:** Discord commands done, portal UI pending

---

### 1.3 Daily RP Prompts 💭
**Goal:** Inspire roleplay with automated prompts

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

### 2.1 Hall of Fame (Starboard) ⭐
**Goal:** Preserve best RP moments

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

### 2.2 Session Logging 📝
**Goal:** Auto-document gameplay sessions

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

### 2.3 Relationship Tracker ❤️
**Goal:** Track character relationships and party dynamics

**Database:**
```sql
relationships
- character1_id, character2_id
- relationship_type, intimacy_level
- notes, key_moments (jsonb)
```

**Discord Commands:**
- [ ] `!relationship add <A> <B> <type> <notes>`
- [ ] `!relationship view <Character>`
- [ ] `!relationship moment <A> <B> <description>`
- [ ] `!relationships` - Party relationship web

**Portal:**
- [ ] Interactive relationship graph
- [ ] Timeline of relationship evolution
- [ ] Heat map of party cohesion

**Types:** Ally, Rival, Romantic, Family, Mentor/Student, Enemy, Neutral

**Time Estimate:** 2 days

---

### 2.4 Scene Manager 🎬
**Goal:** Organize and retrieve specific RP scenes

**Database:**
```sql
scenes
- id, title, description
- started_at, ended_at, channel_id
- participants, tags, location
- is_combat, summary

scene_messages
- scene_id, message_id, author_id
- character_name, content, timestamp
```

**Discord Commands:**
- [ ] `!scene start <title>` - Begin tagging
- [ ] `!scene end` - Close scene
- [ ] `!scene tag/location/description` - Add metadata
- [ ] `!scene list` - Recent scenes
- [ ] `!scene find <keyword>` - Search
- [ ] `!scene replay <id>` - Replay messages

**Portal:**
- [ ] Scene archive with grid/list view
- [ ] Advanced search
- [ ] Export as story chapters

**Auto-Features:**
- [ ] Detect scene starts from narrative cues
- [ ] Auto-tag combat scenes
- [ ] AI-powered summaries

**Time Estimate:** 2 days

---

## 🏗️ PRIORITY 3: Infrastructure (Weeks 7-8)

### 3.1 AWS S3 File Storage
**Tasks:**
- [ ] Create S3 bucket for uploads
- [ ] Configure IAM permissions
- [ ] Update document upload endpoints
- [ ] Presigned URL downloads
- [ ] Image optimization for avatars

**Time Estimate:** 1 day

---

### 3.2 Database Backups
**Tasks:**
- [ ] Automated Neon backups (daily)
- [ ] Point-in-time recovery testing
- [ ] Backup monitoring/alerts
- [ ] Data export utilities

**Time Estimate:** 1 day

---

### 3.3 Additional Discord Commands
**Commands to Add:**
- [ ] `!time` - Track in-game time
- [ ] `!note` - Private GM notes
- [ ] `!npc` - Quick NPC stat blocks
- [ ] `!music` - Suggest mood music
- [ ] `!recap` - AI session summary

**Time Estimate:** 1 day

---

## 🎨 PRIORITY 4: Polish & UX (Weeks 9-10)

### 4.1 Portal UI Improvements
**Goal:** Polish Stats, Prompts, and Hall of Fame interfaces

**Stats UI:**
- [ ] Better data visualization (charts/graphs)
- [ ] More engaging leaderboard design
- [ ] Activity feed improvements
- [ ] Character comparison views

**Prompts UI:**
- [ ] Better layout and card design
- [ ] Category filtering improvements
- [ ] Usage analytics visualization
- [ ] More intuitive add/edit forms

**Hall of Fame UI:**
- [ ] Gallery view with moment cards
- [ ] Character filtering
- [ ] Star count visualization
- [ ] Export/share options

**Time Estimate:** 3 days

---

### 4.2 Mobile Responsiveness
- [ ] Mobile-first design improvements
- [ ] Touch-friendly dice rolling
- [ ] Responsive character sheets
- [ ] PWA (Progressive Web App)

**Time Estimate:** 2 days

---

### 4.3 Themes & Customization
- [ ] Additional color themes
- [ ] Custom server themes
- [ ] Font size/spacing options
- [ ] Accessibility (WCAG 2.1)

**Time Estimate:** 1 day

---

### 4.4 Sharing & Social
- [ ] Public character profiles (optional)
- [ ] Share character sheets as images
- [ ] Campaign homepages
- [ ] Player recruitment tools

**Time Estimate:** 1-2 days

---

## 📊 SUCCESS METRICS

### Priority 1 (Core AI & Engagement)
- [ ] AI FAQ system with Gemini integration
- [ ] Knowledge base functional with web admin
- [ ] Character stats tracking all activity
- [ ] Discord commands working for all features
- [ ] Prompts system with 15+ prompts and 40+ tropes

### Priority 2 (RP Tools)
- [ ] 50+ knowledge base entries in first month
- [ ] AI answers 80%+ correctly
- [ ] Daily active users +30%
- [ ] Average session length +20%
- [ ] All sessions logged with summaries
- [ ] 20+ Hall of Fame moments/month
- [ ] Relationship web covers all PCs
- [ ] 100+ scenes archived

### Phase 3 (Infrastructure)
- [ ] Zero data loss incidents
- [ ] 99.9% uptime
- [ ] <2s page load times

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
- Infrastructure: AWS EC2 (t3.small), Nginx, PM2, Let's Encrypt

**New Dependencies Needed:**
```json
{
  "@google/generative-ai": "^0.1.0",  // Gemini AI integration
  "cheerio": "^1.0.0-rc.12",          // Web scraping
  "node-cron": "^3.0.0",              // Scheduled tasks
  "axios": "^1.6.0"                   // HTTP requests (already installed)
}
```

**API Structure:**
- `/api/knowledge` - FAQ system
- `/api/stats` - User statistics
- `/api/prompts` - Prompt management
- `/api/hall-of-fame` - Starboard
- `/api/sessions` - Session logging
- `/api/relationships` - Relationship tracker
- `/api/scenes` - Scene manager

**Security:**
- Admin-only commands (learn, teach, etc.)
- Rate limiting on AI queries
- Input validation/sanitization
- GDPR compliance for user data

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
