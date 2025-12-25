# Murder Tech - Development Roadmap

**Last Updated:** December 24, 2025  
**Current Phase:** Priority 3 Complete - Ready for Priority 4

> 📝 **Note:** Completed features have been moved to `COMPLETED_FEATURES.md`

---

## 📍 Current Status

**Overall Completion:** ~87% of core platform  
**Discord Commands:** 32+ implemented  
**Database Tables:** 22 tables (all Discord bot tables migrated)  

### ✅ Completed Phases
- ✅ Phase 0: Infrastructure & Setup
- ✅ Priority 1: AI Features (FAQ System, Character Stats & Leaderboards)
- ✅ Priority 2: RP Tools & Social Features (Prompts, Hall of Fame, Sessions, Scenes, Relationships, Utilities)
- ✅ Priority 3: Portal UI Enhancements (Stats Dashboard, Prompt Library, Hall of Fame Gallery, Character Memories)
- ✅ File Upload with virus scanning

---

## 🏗️ Infrastructure Improvements

### AWS S3 Enhancements
- [ ] Add image optimization for avatars
- [ ] Implement file type restrictions by category
- [ ] Add user storage quotas
- [ ] Build batch upload/download functionality
- **Estimate:** 1 day

### Database Management
- [x] All Discord bot database tables created and migrated
- [x] Relationship tracking table created
- [x] Session messages, scene messages, GM notes, game time tables created
- [ ] **CHECK NEON CONSOLE:** Verify PITR enabled and retention period (see NEON_BACKUP_GUIDE.md)
- [ ] Test point-in-time recovery
- [ ] Set up optional weekly manual SQL exports (if desired)
- [ ] Configure backup monitoring/alerts
- [ ] Create data export utilities
- **Estimate:** 1 day
- **Note:** Neon likely has automatic backups already - just need to verify settings

---

## 🎨 Priority 4: Polish & UX

### Portal UI Improvements
- [ ] Improve data visualization (charts/graphs)
- [ ] Enhance mobile-first design
- [ ] Create touch-friendly interfaces
- [ ] Make character sheets responsive
- [ ] Improve loading states and error messages
- **Estimate:** 3 days

### Themes & Customization
- [ ] Add additional color themes
- [ ] Create custom server themes
- [ ] Add font size/spacing options
- [ ] Ensure accessibility (WCAG 2.1 compliance)
- **Estimate:** 1 day

### Sharing & Social Features
- [ ] Create public character profiles (optional)
- [ ] Add share character sheets as images
- [ ] Build campaign homepages
- [ ] Create player recruitment tools
- **Estimate:** 1-2 days

---

## 🔮 Advanced Features (Future Backlog)

### Automated Scheduling
- [ ] Daily prompt auto-posting
- [ ] Weekly recap generation
- [ ] Birthday/anniversary notifications
- [ ] Custom scheduled events

### Advanced AI Features
- [ ] Session recap AI summaries
- [ ] NPC dialogue generation
- [ ] Plot suggestion engine
- [ ] Character arc analysis

### Export & Archive
- [ ] Export sessions to PDF/markdown
- [ ] Generate session reports
- [ ] Archive management
- [ ] Backup/restore functionality

### Mobile Optimization
- [ ] Full responsive portal design
- [ ] Mobile-friendly Discord commands
- [ ] Push notifications for important events

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

## 🗓️ Timeline Estimate

**Next 1-2 Weeks:** Infrastructure improvements & Priority 4 polish  
**Weeks 3-4:** Advanced features & automation  
**Weeks 5-6:** Additional backlog features as needed  

**Total:** ~4-6 weeks to complete Priority 4 and infrastructure improvements

---

## 🛠️ Technical Stack

**Current:**
- Backend: Node.js, Express, TypeScript, Passport.js
- Frontend: React, Vite, TipTap 3.0
- Database: Neon PostgreSQL (Drizzle ORM)
- Discord: discord.js v14
- AI: Google Gemini 2.5 Flash
- Storage: AWS S3
- Infrastructure: AWS EC2 (t3.small), Nginx, PM2, Let's Encrypt
- Security: ClamAV virus scanning, CSRF protection

**API Routes Needed:**
- [ ] `/api/prompts` - Prompt management
- [ ] `/api/hall-of-fame` - Starboard
- [ ] `/api/sessions` - Session logging
- [ ] `/api/scenes` - Scene manager

**API Routes Needed:**
- [ ] `/api/prompts` - Prompt management
- [ ] `/api/hall-of-fame` - Starboard
- [ ] `/api/sessions` - Session logging
- [ ] `/api/scenes` - Scene manager
