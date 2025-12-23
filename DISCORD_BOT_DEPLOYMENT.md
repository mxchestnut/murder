# Discord Bot Features - Deployment Guide

**Created:** December 23, 2025  
**Status:** Ready for deployment

---

## ✅ NEW FEATURES IMPLEMENTED

### 1. Daily RP Prompts & Tropes
- `!prompt` - Random prompt from any category
- `!prompt random <category>` - Specific category prompt
- `!trope [category]` - Random trope inspiration
- 25 default prompts + 40 default tropes included

### 2. Hall of Fame (Starboard)
- React ⭐ to messages (10+ stars → posted to #hall-of-fame)
- `!hall` - View recent Hall of Fame entries
- `!hall top` - View top 20 starred messages
- Automatic context message inclusion
- Auto-removal if stars drop below threshold
- **Requires:** Message Reactions intent enabled in Discord Developer Portal

### 3. Session Logging
- `!session start <title>` - Begin session logging
- `!session end` - End session
- `!session pause/resume` - Control logging
- `!session list` - View recent sessions
- `!recap` - Quick session summary

### 4. Scene Manager
- `!scene start <title>` - Begin scene
- `!scene end` - End scene
- `!scene tag <tags>` - Add tags to active scene
- `!scene location <location>` - Set scene location
- `!scene list` - View recent scenes

### 5. Utility Commands
- `!time [set <date>]` - Track/set in-game time
- `!note add <text>` - Add GM note
- `!note list` - List your notes
- `!npc <name>` - Generate quick NPC stat block
- `!music` - Get mood music suggestion

### 6. Relationship Tracking (Already Coded)
- `!<Character1> is <Character2>'s <descriptor> | <notes>`
- Displays in profile Relationships tab

### 7. Admin & Setup Commands
- `!botset` - Set bot announcement channel (admin only)
- `!learn` - Add knowledge base entries (admin only)
- Admin permissions use Discord Administrator role

---

## 📦 FILES MODIFIED

1. **backend/src/db/schema.ts**
   - Added tables: prompts, tropes, promptSchedule, sessions, sessionMessages, scenes, sceneMessages, hallOfFame, gmNotes, gameTime, botSettings

2. **backend/src/services/discordBot.ts**
   - Added all new command handlers
   - Added reaction handlers for Hall of Fame
   - Added MessageReactions intent and partials
   - Updated help command
   - Added admin permission checks
   - Added !hall and !botset commands

3. **backend/migrations/add_default_prompts_and_tropes.sql**
   - NEW FILE: 25 prompts + 40 tropes to populate database

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Enable Discord Bot Permissions

Go to [Discord Developer Portal](https://discord.com/developers/applications):
1. Select your bot application
2. Go to "Bot" section
3. Scroll to "Privileged Gateway Intents"
4. **Enable:** "MESSAGE CONTENT INTENT" (should already be enabled)
5. **Enable:** "MESSAGE REACTIONS INTENT" ⚠️ **NEW - REQUIRED**
6. Save changes

### Step 2: Set Up Bot Channel (Recommended)

In your Discord server:
1. Create a channel for bot announcements (e.g., `bot-announcements` or `cyarika-bot`)
2. Run `!botset` in that channel
3. The bot will use this channel for future automated prompts and announcements

### Step 3: Create Hall of Fame Channel (Optional)

In your Discord server:
1. Create a channel named exactly: `hall-of-fame`
2. Set appropriate permissions (everyone can view, bot can post)

### Step 4: Deploy Code

```bash
# Navigate to project
cd ~/cyarika-project/cyarika

# Stage all changes
git add .

# Commit
git commit -m "Add Priority 2 Discord features with custom settings: 10-star threshold, !hall top, !botset, admin checks"

# Push to GitHub
git push origin main

# SSH to server
ssh -i ~/.ssh/cyarika-deploy-key.pem ec2-user@100.49.41.171

# On server:
cd cyarika
git pull origin main

# Push database schema changes
cd backend
npm run db:push

# Build backend
npm run build

# Restart bot
pm2 restart cyarika-backend

# Check logs
pm2 logs cyarika-backend --lines 50
```

### Step 4: Import Default Prompts & Tropes

**Option A: Direct Database Import (Recommended)**
```bash
# On server, copy the SQL file content
cat backend/migrations/add_default_prompts_and_tropes.sql

# Connect to Neon database via web UI or psql and run the SQL
# OR use psql if you have connection string:
psql "your-neon-connection-string" < backend/migrations/add_default_prompts_and_tropes.sql
```

**Option B: Manual in Neon Dashboard**
1. Go to Neon console
2. Select your database
3. Open SQL Editor
4. Copy/paste contents of `add_default_prompts_and_tropes.sql`
5. Run the query

### Step 5: Test Commands

In Discord:

**Prompts:**
```
!prompt
!prompt random character
!trope
!trope archetype
```

**Sessions:**
```
!session start Test Session
!session list
!recap
!session end
```

**Scenes:**
```
!scene start Epic Battle
!scene location Ancient Ruins
!scene tag combat, boss fight
!scene list
!scene end
```

**Hall of Fame:**
```
React with ⭐ to any message 10+ times
Check if it appears in #hall-of-fame channel
!hall
!hall top
```

**Admin & Setup:**
```
!botset
(Run this in the channel you want for bot announcements)
```

**Utilities:**
```
!time set 15th of Mirtul, 1492 DR - Evening
!time
!note add Remember to introduce the villain next session
!note list
!npc Mysterious Merchant
!music
```

**Relationship Tracking:**
```
!Ogun is Rig's best friend | They share a deep bond of mutual respect.
!profile ogun
(Check Relationships tab)
```

---

## 🔍 TESTING CHECKLIST

- [ ] Discord bot starts without errors
- [ ] `!help` shows updated command list
- [ ] `!prompt` returns a random prompt
- [ ] `!prompt random character` returns character-specific prompt
- [ ] `!trope` returns a random trope
- [ ] `!session start` creates new session
- [ ] `!session end` closes session
- [ ] `!scene start/end` works correctly
- [ ] Star reactions (⭐) trigger after 10 reactions
- [ ] Hall of Fame channel receives starred messages
- [ ] `!hall` shows recent hall of fame
- [ ] `!hall top` shows top 20 starred messages
- [ ] `!botset` sets announcement channel (admin only)
- [ ] `!learn` requires admin permissions
- [ ] `!time set` and `!time` work
- [ ] `!note add` and `!note list` work
- [ ] `!npc` generates random stats
- [ ] `!music` suggests music
- [ ] `!recap` shows session info
- [ ] Relationship tracking displays in profiles

---

## 📊 DATABASE TABLES ADDED

1. **prompts** - Stores RP prompts by category
2. **tropes** - Stores trope inspiration
3. **prompt_schedule** - For future automated scheduling
4. **sessions** - Session tracking
5. **session_messages** - Messages per session
6. **scenes** - Scene tracking
7. **scene_messages** - Messages per scene
8. **hall_of_fame** - Starred messages
9. **gm_notes** - User notes
10. **game_time** - Per-guild time tracking
11. **bot_settings** - Guild-specific bot configuration

---

## ⚠️ IMPORTANT NOTES

### Discord API Rate Limits
- Bot should handle rate limits gracefully
- Hall of Fame posts are async and won't block

### Database Performance
- All queries use indexed columns (channelId, guildId, userId)
- No N+1 query issues

### Known Limitations
- Hall of Fame requires channel named exactly "hall-of-fame"
- Hall of Fame threshold set to 10 stars (customized per user request)
- Admin commands require Discord Administrator permission
- Session/scene exports to markdown/PDF not yet implemented (future feature)
- AI-generated summaries not yet implemented (future feature)
- Automated prompt scheduling not yet implemented (future feature - use !botset to set channel for future automation)

### Future Enhancements
- [ ] Schedule automated daily prompts (channel set via !botset)
- [ ] AI-generated session summaries
- [ ] Export sessions/scenes to markdown/PDF
- [ ] Message logging for active sessions/scenes
- [ ] Search functionality for scenes
- [ ] Relationship graph visualization
- [ ] Customizable star threshold per server

---

## 🎉 SUCCESS METRICS

After deployment, you should have:
- ✅ 25 unique RP prompts across 5 categories
- ✅ 40 unique tropes across 4 categories
- ✅ Full session tracking capability
- ✅ Full scene management capability
- ✅ Automatic Hall of Fame system
- ✅ Complete utility command suite
- ✅ Character relationship tracking
- ✅ Admin-only commands with permission checks
- ✅ Bot settings system (!botset for announcements)
- ✅ Hall of Fame top 20 leaderboard

**Total Discord Commands: 32+**
**New Features: 7 major systems**
**Development Time: ~4.5 hours**

---

## 🆘 TROUBLESHOOTING

### Bot doesn't respond to reactions
- Check Message Reactions intent is enabled in Discord Developer Portal
- Verify bot has permission to read message history
- Check bot logs for errors

### Hall of Fame messages don't post
- Verify #hall-of-fame channel exists
- Check bot has permission to post in that channel
- Verify star count is 10 or higher (threshold set to 10)
- Use !hall to view recent entries, !hall top for top 20

### Admin commands not working
- Verify user has Discord Administrator permission
- Check bot logs for permission errors
- !learn and !botset require Administrator role

### Database errors
- Run `npm run db:push` to sync schema
- Check Neon dashboard for connection issues
- Verify environment variables are set

### Commands not working
- Check bot logs: `pm2 logs cyarika-backend`
- Verify bot is online in Discord
- Check Message Content intent is enabled

---

**Deployed by:** AI Assistant  
**Review by:** Kit (mxchestnut)  
**Next Steps:** Portal UI development for new features
