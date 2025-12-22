# PathKeeper Discord Bot - Feature Roadmap

## Overview
PathKeeper is a Pathfinder-focused Discord bot integrated with the Cyarika portal, designed to enhance tabletop RPG sessions with character management, AI-powered assistance, and comprehensive session tracking.

---

## 🎯 Phase 1 - Core Features (Priority)

### 1.1 AI-Powered FAQ System ⭐ **HIGHEST PRIORITY**
**Goal:** Create an intelligent knowledge base that learns from URLs and user interactions

**Database Schema:**
```sql
knowledge_base
- id (serial primary key)
- question (text, indexed for search)
- answer (text)
- source_url (text, nullable)
- created_by (integer, references users.id)
- created_at (timestamp)
- upvotes (integer, default 0)
- ai_generated (boolean, default false)
- category (text, nullable)
```

**Discord Commands:**
- `!ask <question>` - Search DB first, fallback to AI if not found
- `!learn <question> | <answer>` - Admins manually add knowledge
- `!teach <url>` - AI scrapes URL and extracts knowledge
- `!kb search <keyword>` - Search knowledge base
- `!kb stats` - Show knowledge base statistics
- React ⭐ to AI answer → automatically saves to DB

**Portal Features:**
- Knowledge base browser with search/filter
- Add/edit/delete entries
- Category management
- Bulk import from CSV
- Analytics (most asked questions, gaps in knowledge)

**AI Integration:**
- Use OpenAI API (GPT-4) for answering questions
- Web scraping with Cheerio for URL content extraction
- Semantic search using embeddings (optional Phase 2)

---

### 1.2 User Stats & Activity Feed 📊
**Goal:** Track player engagement and create shareable statistics

**Database Schema:**
```sql
user_stats
- id (serial primary key)
- discord_user_id (text, references users.discord_user_id)
- total_messages (integer, default 0)
- total_dice_rolls (integer, default 0)
- nat20_count (integer, default 0)
- nat1_count (integer, default 0)
- character_usage (jsonb) -- {character_id: message_count}
- sessions_participated (integer, default 0)
- first_seen (timestamp)
- last_active (timestamp)

activity_feed
- id (serial primary key)
- user_id (integer, references users.id)
- activity_type (text) -- 'message', 'roll', 'milestone', etc.
- description (text)
- metadata (jsonb) -- flexible data storage
- created_at (timestamp)
```

**Discord Commands:**
- `!stats` - Show personal statistics
- `!stats @user` - View another user's stats
- `!leaderboard messages` - Top messagers
- `!leaderboard rolls` - Most dice rolls
- `!leaderboard crits` - Most nat 20s
- `!leaderboard fails` - Most nat 1s (hall of shame!)

**Portal Features:**
- Real-time activity feed on dashboard
- User statistics dashboard with charts
- Leaderboards (daily, weekly, all-time)
- Achievement badges (first nat20, 100 messages, etc.)
- Exportable reports

**Tracked Events:**
- Every message sent
- Every dice roll (with result)
- Character proxy usage
- Session participation
- Knowledge base contributions

---

### 1.3 Daily Prompts 💭
**Goal:** Inspire roleplay and character development with automated prompts

**Database Schema:**
```sql
prompts
- id (serial primary key)
- category (text) -- 'character_dev', 'world_building', 'rp_scenario', 'combat', 'social'
- prompt_text (text)
- created_by (integer, references users.id)
- is_active (boolean, default true)
- use_count (integer, default 0)
- last_used (timestamp, nullable)

prompt_schedule
- id (serial primary key)
- channel_id (text)
- schedule_time (time) -- e.g., '09:00:00' for 9 AM
- enabled (boolean, default true)
- last_sent (timestamp, nullable)
```

**Discord Commands:**
- `!prompt` - Get random prompt (respects cooldown)
- `!prompt random <category>` - Random from specific category
- `!prompt list` - Browse all categories
- `!prompt add <category> | <text>` - Admins add new prompts
- `!prompt schedule <time>` - Set daily auto-post time

**Portal Features:**
- Prompt library with categories
- Create/edit/delete prompts
- Schedule management per Discord channel
- Usage analytics (which prompts are most popular)

**Categories:**
- **Character Development:** "What secret does your character keep from the party?"
- **World Building:** "Describe a legend from your character's homeland"
- **RP Scenarios:** "Your character witnesses an injustice. What do they do?"
- **Combat:** "Describe your character's signature fighting style"
- **Social:** "What would your character do at a royal ball?"

---

## 🌟 Phase 2 - Enhanced Features

### 2.1 Hall of Fame (Starboard) ⭐
**Goal:** Preserve and celebrate the best RP moments

**Database Schema:**
```sql
hall_of_fame
- id (serial primary key)
- message_id (text, unique)
- channel_id (text)
- author_id (text)
- content (text)
- star_count (integer, default 0)
- added_to_hall_at (timestamp)
- context_messages (jsonb) -- previous/next messages for context
- metadata (jsonb) -- attachments, embeds, etc.
```

**Discord Features:**
- React ⭐ to messages (configurable threshold, e.g., 3 stars)
- Auto-forward to #hall-of-fame channel
- Include message context (2-3 messages before/after)
- Beautiful embed with author, timestamp, stars
- Jump to original message link

**Portal Features:**
- Hall of Fame archive with search
- Filter by date, author, star count
- Export memorable moments to PDF/markdown
- Share links to individual moments

**Configuration:**
- Star threshold (default: 3)
- Hall of Fame channel
- Excluded channels
- Max context messages

---

## 🎮 Phase 3 - RP-Specific Features

### 3.1 Session Logging 📝
**Goal:** Automatically document gameplay sessions for posterity

**Database Schema:**
```sql
sessions
- id (serial primary key)
- title (text)
- started_at (timestamp)
- ended_at (timestamp, nullable)
- channel_id (text)
- participants (text[]) -- discord user IDs
- message_count (integer, default 0)
- summary (text, nullable) -- AI-generated summary
- tags (text[])

session_messages
- id (serial primary key)
- session_id (integer, references sessions.id)
- message_id (text)
- author_id (text)
- character_name (text, nullable) -- if proxy message
- content (text)
- timestamp (timestamp)
- is_dice_roll (boolean, default false)
```

**Discord Commands:**
- `!session start <title>` - Begin logging session
- `!session end` - Stop logging, generate summary
- `!session pause` - Pause logging (for OOC chat)
- `!session resume` - Resume logging
- `!session info` - Show current session details
- `!sessions list` - List recent sessions
- `!session export <id>` - Export to markdown/PDF

**Portal Features:**
- Session archive with search
- Auto-generated AI summaries
- Timeline view of events
- Filter by date, participants, tags
- Export sessions to various formats

**Auto-Detection:**
- Detect RP sessions based on activity patterns
- Suggest starting session logging when multiple users active
- Smart pause detection (long gaps in messages)

---

### 3.2 Relationship Tracker ❤️
**Goal:** Track character relationships and party dynamics

**Database Schema:**
```sql
relationships
- id (serial primary key)
- character1_id (integer, references character_sheets.id)
- character2_id (integer, references character_sheets.id)
- relationship_type (text) -- 'ally', 'rival', 'romantic', 'family', 'neutral', 'enemy'
- intimacy_level (integer, 1-10) -- closeness
- notes (text)
- key_moments (jsonb[]) -- array of {date, description, impact}
- created_at (timestamp)
- updated_at (timestamp)
- UNIQUE(character1_id, character2_id)
```

**Discord Commands:**
- `!relationship add <Char A> <Char B> <type> <notes>` - Create relationship
- `!relationship update <Char A> <Char B> <type/level/notes>` - Update
- `!relationship view <Character>` - Show all relationships for a character
- `!relationship moment <Char A> <Char B> <description>` - Add key moment
- `!relationships` - Show party relationship web

**Portal Features:**
- Interactive relationship graph/network visualization
- Filter by relationship type
- Timeline of relationship evolution
- Add/edit relationships via UI
- Relationship "heat map" showing party cohesion

**Relationship Types:**
- Ally (trusted companion)
- Rival (friendly competition)
- Romantic (love interest)
- Family (blood or chosen)
- Mentor/Student
- Enemy (active opposition)
- Neutral (acquaintance)

---

### 3.3 Scene Manager 🎬
**Goal:** Organize and retrieve specific RP scenes

**Database Schema:**
```sql
scenes
- id (serial primary key)
- title (text)
- description (text, nullable)
- started_at (timestamp)
- ended_at (timestamp, nullable)
- channel_id (text)
- participants (text[]) -- discord user IDs
- tags (text[])
- location (text, nullable)
- is_combat (boolean, default false)
- summary (text, nullable) -- AI-generated
- thumbnail_url (text, nullable)

scene_messages
- id (serial primary key)
- scene_id (integer, references scenes.id)
- message_id (text)
- author_id (text)
- character_name (text, nullable)
- content (text)
- timestamp (timestamp)
```

**Discord Commands:**
- `!scene start <title>` - Begin tagging scene
- `!scene end` - Close current scene
- `!scene tag <tags>` - Add tags to current scene
- `!scene location <location>` - Set scene location
- `!scene description <text>` - Add scene description
- `!scene list` - List recent scenes
- `!scene find <keyword>` - Search scenes
- `!scene replay <id>` - Replay scene messages

**Portal Features:**
- Scene archive with grid/list view
- Thumbnail generation from scene content
- Advanced search (by tag, location, participant, date)
- Scene collections/playlists
- Export scenes as story chapters

**Auto-Features:**
- Suggest scene start based on narrative cues
- Auto-tag combat scenes (when dice rolls increase)
- Generate scene thumbnails using DALL-E or midjourney
- AI-powered scene summaries

---

## 🔧 Technical Implementation Notes

### Required Dependencies
```json
{
  "openai": "^4.0.0",           // AI integration
  "cheerio": "^1.0.0-rc.12",    // Web scraping
  "node-cron": "^3.0.0",        // Scheduled prompts
  "axios": "^1.6.0",            // HTTP requests
  "pg": "^8.11.0"               // PostgreSQL (already installed)
}
```

### Database Migrations
- Each phase will include migration scripts
- Use Drizzle ORM for schema management
- Maintain backwards compatibility

### API Structure
```
/api/knowledge - FAQ system endpoints
/api/stats - User statistics endpoints
/api/prompts - Prompt management endpoints
/api/hall-of-fame - Starboard endpoints
/api/sessions - Session logging endpoints
/api/relationships - Relationship tracker endpoints
/api/scenes - Scene manager endpoints
```

### Security Considerations
- Admin-only commands (learn, teach, etc.)
- Rate limiting on AI queries
- Input validation and sanitization
- XSS protection for web scraping
- GDPR compliance for user data

---

## 📊 Success Metrics

### Phase 1 Goals
- [ ] 50+ knowledge base entries within first month
- [ ] AI answers 80%+ of questions correctly
- [ ] Daily active users increase by 30%
- [ ] Average session length increases by 20%

### Phase 2 Goals
- [ ] 20+ Hall of Fame moments per month
- [ ] 90% user engagement with prompts

### Phase 3 Goals
- [ ] All sessions logged and summarized
- [ ] Relationship web covers all PCs
- [ ] 100+ scenes archived

---

## 🗓️ Timeline Estimates

**Phase 1.1 (AI FAQ):** 2-3 days
**Phase 1.2 (Stats):** 1-2 days
**Phase 1.3 (Prompts):** 1 day

**Phase 2 (Hall of Fame):** 1 day

**Phase 3.1 (Sessions):** 2 days
**Phase 3.2 (Relationships):** 2 days
**Phase 3.3 (Scenes):** 2 days

**Total Estimated Time:** 11-14 days

---

## 🎉 Future Enhancements (Phase 4+)

- Voice channel integration (detect who's in voice)
- Campaign management (multiple campaigns, campaign-specific data)
- NPC database (similar to characters, but GM-managed)
- Inventory tracking
- Quest log system
- Map integration (upload maps, pin locations)
- Music bot integration
- Automated backup/restore
- Multi-server support
- API for third-party integrations

---

**Last Updated:** December 22, 2024
**Status:** Phase 1.1 In Progress
**Next Milestone:** AI FAQ System MVP
