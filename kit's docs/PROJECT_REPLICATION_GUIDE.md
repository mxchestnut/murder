# Cyar'ika Project Replication Guide

**Last Updated:** December 25, 2025  
**Project Version:** v2.0.0  
**Purpose:** Complete guide for forking and rebranding this project

---

## 📋 Project Overview

**Cyar'ika** is a Discord-integrated roleplay platform with character management, document editing, and PathCompanion integration.

### Core Features
- Username/password authentication (Passport.js)
- Tiptap 3.0 rich text editor with full extensions
- Discord bot integration (character proxying, dice rolling, AI FAQ)
- Character management with bio/personality fields
- PathCompanion sync for combat stats
- Document management with nested folders
- File upload/download with S3 storage
- Hall of Fame photo gallery (Pinterest-style)
- Knowledge base with Gemini AI integration
- Storage quotas and image optimization

---

## 🏗️ Tech Stack

### Backend
- **Runtime:** Node.js 20.x
- **Framework:** Express 4.22.1
- **Language:** TypeScript
- **Authentication:** Passport.js (local strategy)
- **Database ORM:** Drizzle ORM 0.29.5
- **Session Store:** Redis (connect-redis)
- **Process Manager:** PM2

### Frontend
- **Framework:** React 18.3.1
- **Language:** TypeScript
- **Build Tool:** Vite 5.4.21
- **Router:** React Router DOM 6.30.2
- **Editor:** Tiptap 3.0
- **Icons:** Lucide React 0.562.0

### Database
- **Production:** AWS RDS PostgreSQL 16.6
- **Instance:** db.t4g.micro (1 vCPU, 1 GB RAM)
- **Storage:** 20 GB GP3 SSD
- **Backups:** 7-day automated (03:00 UTC)

### Infrastructure
- **Hosting:** AWS EC2 t3.small (Amazon Linux 2023)
- **Storage:** AWS S3 (files, images, avatars)
- **Secrets:** AWS Secrets Manager
- **DNS:** Route 53
- **Reverse Proxy:** Nginx with SSL/TLS
- **VPN:** Tailscale (admin access)

### Third-Party APIs
- **Discord:** Discord.js v14
- **AI:** Google Gemini 2.5 Flash
- **Game Integration:** PlayFab (PathCompanion)

---

## 🗄️ Database Schema

### Critical Tables (23 Total)

**Authentication & Users:**
- `users` - User accounts, passwords, PathCompanion credentials
- `system_settings` - Password rotation tracking

**Characters & Sheets:**
- `character_sheets` - Character data (name, class, level, bio, personality)
- `character_stats` - Dice rolls, damage dealt, activity tracking
- `character_memories` - Character-specific notes and memories
- `relationships` - Character relationship tracking

**Discord Integration:**
- `channel_character_mappings` - Discord channel to character bindings
- `bot_settings` - Discord bot configuration
- `sessions` - RP session tracking
- `session_messages` - Session message history
- `scenes` - Scene management
- `scene_messages` - Scene message history
- `game_time` - In-game time tracking
- `gm_notes` - GM-only notes

**Content Management:**
- `documents` - Rich text documents with Tiptap
- `shared_documents` - Document sharing permissions
- `files` - S3 file metadata (with categories, quotas, optimization)
- `hall_of_fame` - Featured images/moments
- `hc_list` - Headcanon tracking

**AI & Knowledge:**
- `knowledge_base` - FAQ database for Discord bot
- `prompts` - RP writing prompts (25 default)
- `tropes` - Story tropes (33 default)
- `activity_feed` - User activity tracking

---

## 🔐 Security Configuration

### Secrets (AWS Secrets Manager)

**Required Secrets:**
```
cyarika/database-url
cyarika/session-secret
cyarika/discord-bot-token
cyarika/gemini-api-key
```

**Additional Environment Variables:**
```bash
NODE_ENV=production
PORT=3000
AWS_REGION=us-east-1
PATHCOMPANION_ENCRYPTION_KEY=<32-byte-hex>
```

### Security Features
- ✅ bcrypt password hashing (12 rounds)
- ✅ CSRF protection (double-submit cookie)
- ✅ Helmet.js security headers with CSP
- ✅ CORS restricted to production domains
- ✅ Rate limiting (100 req/15min per IP)
- ✅ HTTP-only, secure cookies
- ✅ RDS encryption at rest (AWS KMS)
- ✅ SSL/TLS in transit
- ✅ VPC-only database access
- ✅ Input validation and type checking
- ✅ ClamAV virus scanning on uploads
- ✅ MIME type validation by category

### Password Requirements
- Minimum 8 characters
- bcrypt hashed with 12 rounds
- Username 3-50 characters
- Email format validation

---

## 🚀 AWS Infrastructure Details

### EC2 Instance
- **ID:** i-0a7d5f108d60dab09
- **Type:** t3.small
- **OS:** Amazon Linux 2023
- **Public IP:** 98.92.57.204 (changes on restart - consider Elastic IP)
- **Tailscale IP:** 100.83.245.45 (stable)
- **Region:** us-east-1
- **Security Group:** sg-068344f8a044ec991
- **SSH Key:** cyarika-deploy-key.pem

### RDS Database
- **Instance ID:** cyarika-db
- **Endpoint:** cyarika-db.csdgukyoelj0.us-east-1.rds.amazonaws.com:5432
- **Database:** cyarika
- **Engine:** PostgreSQL 16.6
- **Instance Class:** db.t4g.micro
- **Storage:** 20 GB GP3 SSD (3000 IOPS, 125 MB/s)
- **VPC:** vpc-0af3bd99650024a69
- **Security Group:** sg-0bc62749afe4f64d8
- **Subnet Group:** cyarika-db-subnet-group (3 AZs)
- **Public Access:** Disabled
- **SSL:** Required (rejectUnauthorized: false in code)
- **Backup Window:** 03:00-04:00 UTC
- **Maintenance:** Sunday 04:00-05:00 UTC

### Route 53 DNS
- **Hosted Zone:** Z01482473LHFKM7LFNJKR
- **Domain:** cyarika.com
- **Records:** A records for cyarika.com and www.cyarika.com
- **TTL:** 300 seconds

### S3 Storage
- **Bucket Structure:** `{category}/{userId}/{filename}`
- **Categories:** avatar, image, document, other
- **Features:** Image optimization, thumbnails, virus scanning
- **Quotas:** 1GB per user default

---

## 📁 Critical File Locations

### Backend Entry Points
```
backend/src/server.ts          # Main application server
backend/src/services/discordBot.ts  # Discord bot logic
backend/src/config/secrets.ts  # AWS Secrets Manager integration
backend/src/config/passport.ts # Authentication strategy
backend/src/db/index.ts        # Database connection with SSL
backend/src/db/schema.ts       # Drizzle schema definitions
```

### Frontend Entry Points
```
frontend/src/App.tsx           # Main React app
frontend/src/components/Dashboard.tsx  # Main dashboard
frontend/src/components/Editor.tsx     # Tiptap editor
frontend/src/utils/api.ts      # API client with CSRF
```

### Configuration Files
```
backend/tsconfig.json          # TypeScript config
backend/drizzle.config.ts      # Database migrations config
ecosystem.config.js            # PM2 process config
nginx.conf                     # Nginx reverse proxy config
deploy.sh                      # Deployment script
```

### Migrations
```
backend/migrations/            # All SQL migrations (15 files)
  - create_relationships_table.sql
  - create_discord_bot_tables.sql
  - create_files_table.sql
  - add_file_categories_and_quotas.sql
  - (and 11 more)
```

---

## 🔄 Deployment Process

### Standard Deployment (from local machine)
```bash
./deploy.sh
```

**This script does:**
1. SSH to server via cyarika.com domain
2. Git pull latest code
3. Build backend TypeScript
4. Restart PM2 process

### Manual Deployment Steps
```bash
# 1. SSH to server
ssh ec2-user@cyarika.com

# 2. Navigate to project
cd /home/ec2-user/cyarika

# 3. Pull latest code
git pull

# 4. Build backend
cd backend
npm run build

# 5. Restart PM2
pm2 restart cyarika-backend

# 6. Check status
pm2 status
pm2 logs cyarika-backend --lines 50
```

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'cyarika-backend',
    script: './backend/dist/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

**PM2 Auto-Start:**
```bash
# Already configured via systemd
sudo systemctl status pm2-ec2-user.service
```

---

## 🤖 Discord Bot Setup

### Bot Configuration
- **Framework:** Discord.js v14
- **Intents:** GUILDS, GUILD_MESSAGES, MESSAGE_CONTENT
- **Permissions:** Send Messages, Embed Links, Attach Files

### Key Commands
```
!roll XdY+Z        # Dice rolling with stat tracking
!feat              # Random RP prompt
!trope             # Random story trope
!ask <question>    # AI FAQ (Gemini + Knowledge Base)
!learn Q | A       # Add to knowledge base (admin)
!stats             # View character statistics
!top               # Leaderboard
```

### Character Commands
```
!setchar <name>    # Bind character to channel
!clearchar         # Unbind character from channel
!Duane <message>   # Proxy message as character
```

### Relationship Tracking
```
!Duane is Elystrix's bodyguard | They're inseparable.
!relationship Duane            # View relationships
```

### Database Integration
- All dice rolls tracked in `character_stats`
- Messages stored in `session_messages` and `scene_messages`
- Knowledge base queries log to activity feed
- Character proxying uses `channel_character_mappings`

---

## 🎨 Frontend Architecture

### Component Structure
```
Dashboard.tsx          # Main layout with sidebar
  ├─ Sidebar.tsx       # Navigation
  ├─ Editor.tsx        # Tiptap document editor
  ├─ CharacterSheets.tsx  # Character CRUD
  ├─ CharacterBio.tsx  # Bio editor with Tiptap
  ├─ FileManager.tsx   # S3 file upload/download
  ├─ PhotoGallery.tsx  # Pinterest-style gallery
  ├─ KnowledgeBase.tsx # FAQ management
  ├─ PromptsTropes.tsx # Writing prompts
  ├─ StatsDashboard.tsx # Character stats
  ├─ AdminPanel.tsx    # User management
  └─ Settings.tsx      # User preferences
```

### Tiptap Configuration
```typescript
// Full extension suite
extensions: [
  StarterKit,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Underline,
  Link.configure({ openOnClick: false }),
  Image,
  Color,
  Highlight.configure({ multicolor: true }),
  TextStyle,
  Table.configure({ resizable: true }),
  TableRow,
  TableCell,
  TableHeader
]
```

### API Client Pattern
```typescript
// All requests include CSRF token
import { api } from '../utils/api';

const response = await api.post('/endpoint', data);
```

---

## 🔌 PathCompanion Integration

### PlayFab API
- **Title ID:** Stored in PathCompanion code
- **Authentication:** Username/password encrypted with AES-256-CBC
- **Session Management:** SessionTicket stored in users table
- **Auto-Refresh:** Session refreshed on character sheet access

### Synced Data
- Character name, class, race, level
- Ability scores (STR, DEX, CON, INT, WIS, CHA)
- Combat stats (AC, HP, initiative)
- Skills and proficiencies
- Equipment and inventory

### Code Locations
```
backend/src/services/playfab.ts    # PlayFab API client
backend/src/routes/pathcompanion.ts # Sync endpoints
```

---

## 📝 Important Code Patterns

### Database Connection (SSL Configuration)
```typescript
// backend/src/db/index.ts
export let db = drizzle(new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }  // Critical for RDS
}));

// Allows reconnection after Secrets Manager loads
export async function reinitializeDatabase(newUrl: string) {
  db = drizzle(new Pool({
    connectionString: newUrl,
    ssl: { rejectUnauthorized: false }
  }));
}
```

### CSRF Protection
```typescript
// Backend
const csrfProtection = doubleCsrf({
  getSecret: () => secrets.SESSION_SECRET,
  getSessionIdentifier: (req) => req.session?.id || '',
  // ... config
});

// Frontend
await fetchCsrfToken(); // On app init
api.post('/endpoint', data); // Automatically includes token
```

### File Upload with Optimization
```typescript
// 1. Virus scan (ClamAV)
// 2. MIME type validation
// 3. Quota check
// 4. Image optimization (Sharp -> WebP)
// 5. Thumbnail generation (300px)
// 6. Avatar cropping (512px circular)
// 7. S3 upload
// 8. Database record
```

### Session Management
```typescript
// Redis-backed sessions
// 7-day rolling expiration
// HTTP-only, secure cookies
// SameSite: 'lax'
```

---

## 🔧 Environment Setup for New Fork

### Step 1: AWS Account Setup
1. Create AWS account (free tier eligible)
2. Create IAM user with permissions:
   - EC2 (full)
   - RDS (full)
   - S3 (full)
   - Secrets Manager (full)
   - Route 53 (full)
3. Generate access keys for AWS CLI

### Step 2: Domain & DNS
1. Purchase domain (Route 53 or external)
2. Create hosted zone in Route 53
3. Point nameservers to Route 53

### Step 3: RDS Database
1. Create PostgreSQL 16.x instance (db.t4g.micro)
2. Set master username/password
3. Create database named after project
4. Configure security group (port 5432 from EC2 only)
5. Create subnet group across 3 AZs
6. Enable automated backups (7-day retention)
7. Disable public access

### Step 4: EC2 Instance
1. Launch t3.small instance (Amazon Linux 2023)
2. Generate SSH key pair
3. Configure security group:
   - SSH (22) from your IP
   - HTTP (80) from anywhere
   - HTTPS (443) from anywhere
4. Associate Elastic IP (optional but recommended)
5. Install Node.js, npm, PM2, Git, PostgreSQL client
6. Install and configure Nginx with SSL (certbot)

### Step 5: S3 Bucket
1. Create bucket (private)
2. Configure CORS for web access
3. Set up lifecycle policies (optional)
4. Create IAM role for EC2 with S3 access

### Step 6: Secrets Manager
1. Create secrets:
   - `{project}/database-url`
   - `{project}/session-secret`
   - `{project}/discord-bot-token`
   - `{project}/gemini-api-key`
2. Grant EC2 IAM role access to secrets

### Step 7: Discord Bot
1. Create Discord application
2. Create bot user
3. Enable MESSAGE CONTENT intent
4. Copy bot token to Secrets Manager
5. Generate OAuth2 invite URL with permissions:
   - Send Messages
   - Embed Links
   - Attach Files
   - Read Message History

### Step 8: Google AI (Gemini)
1. Get Gemini API key from Google AI Studio
2. Store in Secrets Manager
3. Configure safety settings in code if needed

### Step 9: Deploy Application
1. Clone repository to EC2
2. Run `npm install` in backend and frontend
3. Build frontend: `npm run build`
4. Build backend: `npm run build`
5. Configure PM2 with ecosystem.config.js
6. Start PM2: `pm2 start ecosystem.config.js`
7. Enable PM2 startup: `pm2 startup systemd`
8. Configure Nginx reverse proxy
9. Set up SSL with certbot

### Step 10: Database Migration
1. Connect to RDS from EC2
2. Run all migrations in order from `backend/migrations/`
3. Verify tables with `\dt` in psql
4. Create admin user (update code with your credentials)

---

## 📊 Database Migration History

**Executed in this order:**
1. Initial schema (Drizzle schema.ts)
2. `add_admin_role.sql` - Admin user support
3. `add_discord_user_id.sql` - Discord account linking
4. `add_discord_webhook.sql` - Webhook support
5. `add_discord_bot.sql` - Bot settings table
6. `create_hc_list.sql` - Headcanon tracking
7. `add_default_prompts_and_tropes.sql` - Default content
8. `add_character_bio_fields.sql` - Bio/personality fields
9. `expand_character_bio_fields.sql` - Extended bio fields
10. `add_character_sheet_fields.sql` - PathCompanion fields
11. `add_avatar_url.sql` - Character avatars
12. `add_answer_html.sql` - Rich text KB answers
13. `create_relationships_table.sql` - Character relationships
14. `create_discord_bot_tables.sql` - Session/scene tracking
15. `create_files_table.sql` - File management
16. `add_file_categories_and_quotas.sql` - S3 enhancements

---

## 🐛 Known Issues & Technical Debt

### Development Dependencies (Non-Critical)
- **esbuild** vulnerability (MODERATE) - Only affects dev environment
- **matrix-js-sdk** vulnerabilities (HIGH) - Unused, can be removed
- These are NOT in production build

### Pre-existing TypeScript Warnings
- Some routes use `parseInt` vs `Number.parseInt` (lint warnings)
- Some imports use `'crypto'` vs `'node:crypto'` (style preference)
- Sharp Buffer type compatibility (functional, no runtime issue)

### Frontend Build Configuration
- Vite CSP needs adjustment if tightening security headers
- Consider moving to React 19 in future (breaking changes)

### Backend Improvements Considered
- Add Zod or express-validator to all routes (partially implemented)
- Implement per-user rate limiting (currently per-IP)
- Add request logging for security monitoring
- Set up CloudWatch alarms for failed logins

---

## 🎯 Critical Configuration Values

### Session Cookie
```typescript
{
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/'
}
```

### CORS Origins
```typescript
origin: process.env.NODE_ENV === 'production' 
  ? ['https://cyarika.com', 'https://www.cyarika.com']
  : 'http://localhost:5173'
```

### Rate Limiting
```typescript
{
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false
}
```

### File Upload Limits
```typescript
{
  maxFileSize: 50 * 1024 * 1024, // 50 MB
  defaultQuota: 1073741824,      // 1 GB per user
}
```

---

## 📚 Key Dependencies

### Backend Critical
```json
{
  "@aws-sdk/client-s3": "^3.958.0",
  "@aws-sdk/client-secrets-manager": "^3.958.0",
  "bcryptjs": "^2.4.3",
  "discord.js": "^14.16.3",
  "drizzle-orm": "^0.29.5",
  "express": "^4.22.1",
  "express-session": "^1.18.1",
  "helmet": "^8.1.0",
  "passport": "^0.7.0",
  "pg": "^8.13.1",
  "redis": "^4.7.0",
  "sharp": "^0.33.5"
}
```

### Frontend Critical
```json
{
  "react": "^18.3.1",
  "react-router-dom": "^6.30.2",
  "@tiptap/react": "^2.10.4",
  "@tiptap/starter-kit": "^2.10.4",
  "axios": "^1.7.9",
  "vite": "^5.4.21"
}
```

---

## 🔄 Rebranding Checklist

### Code Changes
- [ ] Update project name in `package.json` (both frontend/backend)
- [ ] Update `README.md` with new project details
- [ ] Search & replace "Cyar'ika" / "cyarika" throughout codebase
- [ ] Update domain in CORS configuration
- [ ] Update domain in nginx.conf
- [ ] Update Discord bot name and avatar
- [ ] Update frontend title and meta tags

### AWS Infrastructure
- [ ] Create new RDS instance with new name
- [ ] Create new S3 bucket with new name
- [ ] Create new EC2 instance (or rename)
- [ ] Update Route 53 with new domain
- [ ] Create new Secrets Manager secrets with new prefix
- [ ] Update security group names

### External Services
- [ ] Create new Discord bot application
- [ ] Get new Gemini API key (optional)
- [ ] Create new PlayFab title (if using PathCompanion)

### Documentation
- [ ] Update all documentation with new branding
- [ ] Update deployment scripts with new domain
- [ ] Update ecosystem.config.js app name

---

## 🚨 Critical Security Notes

### Never Commit These
- `.env` file (in .gitignore)
- SSH keys (*.pem files)
- RDS passwords
- Discord bot tokens
- Gemini API keys
- AWS access keys

### Encryption Keys
- `PATHCOMPANION_ENCRYPTION_KEY` must be 64-character hex (32 bytes)
- Generate with: `openssl rand -hex 32`
- Store securely, losing this key means losing encrypted passwords

### Database Access
- NEVER enable public access to RDS
- Always connect from EC2 within VPC
- Use SSL/TLS connections
- Rotate RDS password quarterly

### Session Secret
- Generate with: `openssl rand -base64 32`
- Changing this invalidates all sessions
- Keep consistent across deployments

---

## 📈 Performance Considerations

### Database
- Indexes on foreign keys (already in schema)
- Connection pooling (pg Pool)
- Consider read replicas if traffic grows

### S3
- CloudFront CDN for image delivery (future)
- Lifecycle policies for old files
- Optimize images before upload (Sharp)

### Redis
- Session TTL: 30 days max, 7 days rolling
- Consider Redis clustering for scale

### EC2
- t3.small adequate for low-medium traffic
- Consider t3.medium or c6i.large for high traffic
- Monitor CloudWatch metrics

---

## 🆘 Common Issues & Solutions

### "Self-signed certificate in certificate chain"
**Solution:** Use `ssl: { rejectUnauthorized: false }` in database connection

### "Connection timeout" to RDS
**Solution:** Check security group allows EC2 security group on port 5432

### PM2 doesn't start on boot
**Solution:** Run `pm2 startup systemd` and `pm2 save`

### Frontend not loading after deployment
**Solution:** Check nginx is serving built files from `frontend/dist`

### Discord bot not responding
**Solution:** 
1. Check bot is logged in: `pm2 logs cyarika-backend | grep "Discord bot logged in"`
2. Verify MESSAGE_CONTENT intent enabled
3. Check bot has permissions in server

### CSRF token errors
**Solution:** Ensure `fetchCsrfToken()` called before any POST requests

---

## 📞 Support Resources

### Documentation
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Discord.js Guide](https://discordjs.guide/)
- [Tiptap Docs](https://tiptap.dev/docs)
- [AWS RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)

### Useful Commands
```bash
# Check PM2 status
pm2 status
pm2 logs cyarika-backend --lines 100

# Check database
psql $DATABASE_URL -c '\dt'

# Check Redis
redis-cli ping

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check SSL certificate
certbot certificates

# Check disk space
df -h

# Check memory
free -h

# Check RDS from EC2
psql -h cyarika-db.csdgukyoelj0.us-east-1.rds.amazonaws.com \
     -U postgres -d cyarika -c 'SELECT version();'
```

---

## ✅ Pre-Launch Checklist

- [ ] All environment variables set in Secrets Manager
- [ ] Database migrations run successfully
- [ ] Admin user created
- [ ] Discord bot invited to server
- [ ] SSL certificate installed and auto-renewal configured
- [ ] PM2 configured for auto-start
- [ ] Nginx reverse proxy working
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] File upload quotas set
- [ ] Virus scanning working (ClamAV)
- [ ] Backups verified (RDS automated backups)
- [ ] DNS records propagated
- [ ] Default prompts/tropes imported
- [ ] Security audit completed
- [ ] Documentation updated with new branding

---

## 🎓 Architecture Decisions

### Why Drizzle ORM over Prisma?
- Lighter weight, better performance
- Direct SQL access when needed
- Type-safe without code generation step

### Why RDS over Neon?
- Better backup retention (7 days vs 6 hours)
- More control over configuration
- Free tier for 12 months
- Industry-standard solution

### Why Redis for Sessions?
- PM2 doesn't share memory between processes
- Faster than database-backed sessions
- Easy to scale horizontally

### Why Sharp for Image Processing?
- Fastest Node.js image library
- High-quality WebP conversion
- Memory efficient

### Why Nginx over direct Express?
- SSL termination
- Static file serving
- Better performance
- Industry standard

### Why PM2 over systemd?
- Better Node.js process management
- Built-in clustering support
- Easy log management
- Zero-downtime reloads

---

**End of Guide**

*This document contains everything needed to replicate the Cyar'ika architecture. For specific implementation details, refer to the actual codebase and the other documentation files in this folder.*

*Good luck with your fork! 🚀*
