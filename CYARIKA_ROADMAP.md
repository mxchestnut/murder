# Cyar'ika - Development Roadmap

**Last Updated:** December 23, 2025  
**Current Phase:** Priority 2 Complete - Ready for Priority 3

> 📝 **Note:** Completed features have been moved to `Completed tasks/COMPLETED_FEATURES.md`

---

## 📍 Current Status

**Overall Completion:** ~80% of core platform  
**Discord Commands:** 32+ implemented  
**Database Tables:** 20+ tables  

### ✅ Completed Phases
- ✅ Phase 0: Infrastructure & Setup
- ✅ Priority 1: AI Features (FAQ System, Character Stats & Leaderboards)
- ✅ Priority 2: RP Tools & Social Features (Prompts, Hall of Fame, Sessions, Scenes, Relationships, Utilities)
- ✅ File Upload with virus scanning

---

## 🎯 Priority 3: Portal UI Enhancements

### Stats Dashboard 📊
- [ ] Build charts/graphs for character statistics
- [ ] Create activity timeline visualization
- [ ] Add leaderboards with filtering (daily, weekly, all-time)
- [ ] Implement character comparison tools
- [ ] Build damage/rolls distribution charts
- **Estimate:** 2-3 days

### Sessions & Scenes Archive 📖
- [ ] Build session list with search/filter
- [ ] Create session detail view with messages
- [ ] Implement scene browser and timeline
- [ ] Add export sessions to markdown/PDF
- [ ] Build AI-generated session summaries
- **Estimate:** 2-3 days

### Hall of Fame Gallery ⭐
- [ ] Create gallery view of Hall of Fame messages
- [ ] Add filter by character, date, star count
- [ ] Implement export as images/quotes
- [ ] Build social sharing features
- [ ] Add random "gem from the vault" feature
- **Estimate:** 1-2 days

### Prompt & Trope Library 💭
- [ ] Build browse interface for all prompts by category
- [ ] Implement add/edit/delete prompts (admin)
- [ ] Create trope browser with descriptions
- [ ] Add usage analytics (most popular prompts)
- [ ] Build schedule management for auto-posting
- **Estimate:** 1-2 days

---

## 🏗️ Infrastructure Improvements

### AWS S3 Enhancements
- [ ] Add image optimization for avatars
- [ ] Implement file type restrictions by category
- [ ] Add user storage quotas
- [ ] Build batch upload/download functionality
- **Estimate:** 1 day

### Database Backups
- [ ] Set up automated Neon backups (daily)
- [ ] Test point-in-time recovery
- [ ] Configure backup monitoring/alerts
- [ ] Create data export utilities
- **Estimate:** 1 day

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

**Next 1-2 Weeks:** Portal UI development for existing features (Priority 3)  
**Weeks 3-4:** Infrastructure improvements & polish  
**Weeks 5-6:** Advanced features & automation  

**Total:** ~6 weeks to complete all planned Priority 3-4 features

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
