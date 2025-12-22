# Write Pretend - Development Roadmap

## 🎯 Phase 1: Tiptap Rich Text Bio Fields
**Status:** In Progress 🚧

Replace textarea fields with Tiptap markdown editors for rich character biographies:
- Origin story
- Greatest success
- Greatest failure
- Regret
- Trauma
- Important relationships
- Protected relationship
- Avoided relationship
- Rival
- Recent change
- Potential change
- Breaking point
- Redemption

**Requirements:**
- Install @tiptap/react and @tiptap/starter-kit
- Create reusable TiptapField component
- Replace 13 textarea fields in CharacterBio.tsx
- Maintain 1024 character limit for Discord compatibility
- Support markdown formatting (bold, italic, lists)

---

## 🤖 Phase 2: AI & Automation Features

### AI FAQ System
- Build knowledge base from character bios and session logs
- AI-powered answers to campaign questions
- `/ask` Discord command
- RAG (Retrieval Augmented Generation) with OpenAI
- Store FAQ pairs in database

### Session Logging
- Automatic transcript generation from Discord messages
- Session summaries with AI
- Tag participants and characters used
- Export to PDF/markdown
- Timeline view in web portal

### Relationship Tracking
- Track PC-to-PC relationships mentioned in chat
- Sentiment analysis (positive/negative/complicated)
- Relationship graph visualization
- Automatic updates from proxy messages
- "What does X think of Y?" queries

### Hall of Fame
- Star/react to save best moments
- Leaderboard of most-starred messages
- Filter by character, player, session
- Export highlights reel
- Automatic "Best Of" compilations

---

## 🏗️ Phase 3: Infrastructure & Scaling

### AWS S3 File Storage
- Create S3 bucket for file uploads
- Configure IAM permissions
- Update document upload endpoints
- Presigned URL downloads
- Image optimization for avatars

### Database Backups
- Automated Neon backups (daily)
- Point-in-time recovery testing
- Backup monitoring/alerts
- Disaster recovery plan
- Data export utilities

### Additional Discord Bot Commands
- `/scene` - Set current scene/location
- `/time` - Track in-game time
- `/note` - Private GM notes
- `/npc` - Quick NPC stat blocks
- `/music` - Suggest mood music
- `/recap` - AI session summary

---

## 📊 Phase 4: Analytics & Engagement

### Real-time Activity Feed
- Live updates in web portal
- Recent dice rolls
- Character creations/updates
- Session starts/ends
- WebSocket or polling implementation

### User Statistics & Leaderboards
- Most active players
- Total dice rolled
- Characters created
- Sessions participated
- Natural 20s / Natural 1s
- Longest streak
- Badges/achievements

---

## 🎨 Phase 5: Polish & Features

### Mobile Responsiveness
- Mobile-first design improvements
- Touch-friendly dice rolling
- Responsive character sheets
- PWA (Progressive Web App)

### Themes & Customization
- Additional color themes
- Custom server themes
- Font size/spacing options
- Accessibility improvements (WCAG 2.1)

### Sharing & Social
- Public character profiles (optional)
- Share character sheets as images
- Campaign homepages
- Player recruitment tools

---

## 🔮 Future Ideas (Backlog)

- Voice integration for Discord
- Live character portraits (AI-generated)
- Automated initiative tracking
- Spell/ability card generator
- Multi-campaign support
- API for third-party integrations
- Mobile apps (iOS/Android)
- Patreon integration for premium features
- Virtual tabletop integration (Roll20, Foundry VTT)
- Twitch/YouTube streaming integration

---

**Last Updated:** December 22, 2025
