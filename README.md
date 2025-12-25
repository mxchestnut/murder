# Murder - Discord-Integrated Roleplay Platform

**Murder** is a comprehensive roleplay platform featuring a Discord bot, web portal for character management, document editing, and PathCompanion integration for tabletop RPG communities.

🌐 **Website:** [murder.tech](https://murder.tech)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (AWS RDS)
- Discord bot token
- AWS S3 credentials
- Google Gemini API key *(optional)*

### Local Development Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/mxchestnut/murder.git
   cd murder
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Set up git-secrets** (IMPORTANT)
   ```bash
   ./.git-secrets-setup.sh
   ```

3. **Configure environment** - Create `backend/.env`:
   ```env
   DATABASE_URL=postgresql://user:password@host/database
   SESSION_SECRET=your_random_secret_here
   DISCORD_BOT_TOKEN=your_bot_token
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   AWS_S3_BUCKET=your_bucket_name
   ```

4. **Initialize database**
   ```bash
   cd backend
   npm run db:push
   ```

5. **Start development**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

6. **Access the app**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Production Deployment (AWS)

**Current Production:**
- **URL:** https://murder.tech
- **Server:** AWS EC2 (t2.micro free tier)
- **Database:** AWS RDS PostgreSQL
- **Storage:** AWS S3
- **DNS:** Route53

**Deploy Updates:**
```bash
# From your local machine
git push origin main

# SSH to server
ssh -i ~/.ssh/murder-tech-key.pem ubuntu@44.210.148.206

# Pull and rebuild
cd murder-tech
git pull
cd backend && npm run build
pm2 restart murder-tech-backend

# Update frontend if needed
cd ../frontend && npm run build
sudo cp -r dist/* /var/www/html/
```

---

## Features

### 🎭 Character Management
- Create and manage characters via web portal
- Full Pathfinder character sheets with stats, skills, weapons, spells
- Import characters from PathCompanion (optional)
- Character avatar upload for Discord proxying
- Export and share character sheets

### 🤖 Discord Bot Integration
- **Character Proxying** - Speak as your character with custom avatars
- **Dice Rolling** - Roll with character stats, saves, and skills
- **AI FAQ System** *(coming soon)* - AI-powered knowledge base
- **Session Logging** *(coming soon)* - Automatic session transcripts
- **Relationship Tracking** *(coming soon)* - Track PC relationships
- **Hall of Fame** *(coming soon)* - Star messages for best moments

### ✨ Web Portal
- Secure authentication with username/password
- Rich text document editor with Tiptap 3.0
- Character sheet management and editing
- Settings and account management
- Real-time activity feed *(coming soon)*
- User statistics and leaderboards *(coming soon)*

### 🧠 AI Features *(coming soon)*
- Natural language FAQ system
- Learn from URLs and documents
- Save helpful AI responses to knowledge base
- Semantic search across your content

---

## Tech Stack

### Backend
- **Runtime:** Node.js, Express, TypeScript
- **Database:** PostgreSQL (AWS RDS)
- **Authentication:** Passport.js
- **Discord:** Discord.js v14
- **AI:** Google Gemini 2.5 Flash *(optional)*
- **Storage:** AWS S3

### Frontend
- **Framework:** React, TypeScript
- **Build Tool:** Vite
- **Editor:** Tiptap 3.0
- **Styling:** Custom CSS with dark theme

### Infrastructure
- **Hosting:** AWS EC2 (free tier)
- **Storage:** AWS S3
- **DNS:** AWS Route53
- **Domain:** murder.tech
- **SSL:** Let's Encrypt

---

## Discord Bot Setup

1. **Create Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create new application named "Murder Bot"
   - Go to Bot section, create bot, copy token to `.env`

2. **Set Bot Permissions**
   - View Channels
   - Send Messages
   - Manage Messages
   - Manage Webhooks
   - Read Message History

3. **Invite Bot to Server**
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=155156081664&scope=bot
   ```

4. **Link Your Account**
   ```
   !connect <username> <password>
   ```

5. **Test Commands**
   ```
   !help          # Show all commands
   !syncall       # Refresh character list
   !setchar Test  # Link channel to character
   Test: hello!   # Proxy as character
   ```

---

## Project Structure

```
murder-tech/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Discord bot, PlayFab, etc.
│   │   ├── middleware/      # Auth middleware
│   │   ├── db/              # Database schema
│   │   └── server.ts        # Express app
│   ├── drizzle/             # Database migrations
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── utils/           # API client
│   │   └── App.tsx
│   └── package.json
├── kit's docs/              # Project documentation
└── README.md                # This file
```

## Roadmap

See [kit's docs/MURDER_ROADMAP.md](kit's%20docs/MURDER_ROADMAP.md) for the complete feature roadmap.

### Current Focus
**Phase 1.1** - AI-Powered FAQ System
- Natural language question answering
- Learn from URLs and documents
- Save AI responses to knowledge base
- Discord commands: `!ask`, `!learn`, `!teach`

### Upcoming Features
- **Phase 1.2** - User stats and activity feed
- **Phase 1.3** - Daily RP prompts
- **Phase 2** - Hall of Fame (starboard)
- **Phase 3** - Session logging, relationship tracking, scene management

## Commands Reference

### Discord Bot Commands

**Account Setup:**
- `!connect <username> <password>` - Link Discord to Murder
- `!syncall` - Refresh character list

**Character Commands:**
- `!setchar <name>` - Link channel to character
- `!char` - Show linked character
- `CharName: message` - Proxy as character
- `!CharName <stat>` - Roll for any character

**Dice Rolling:**
- `!roll <stat>` - Roll ability check
- `!roll <save>` - Roll saving throw
- `!roll <skill>` - Roll skill check

**Help:**
- `!help` - Show all commands

## Security

### 🔒 Protecting Secrets

This project uses [git-secrets](https://github.com/awslabs/git-secrets) to prevent accidentally committing sensitive information.

**Setup (Required for Contributors):**
```bash
./.git-secrets-setup.sh
```

**What's Protected:**
- Database connection strings
- API tokens and secrets
- Discord bot tokens
- AWS credentials
- Session secrets

**Before Committing:**
```bash
git secrets --scan
```

The `.gitallowed` file contains approved patterns for example/template values in documentation.

**Never commit:**
- Real `.env` files
- Private keys (`.pem`, `.key`)
- Real database passwords
- Production tokens

## Contributing

Contributions are welcome! Please ensure:
1. git-secrets is installed and configured
2. All tests pass
3. No secrets are committed
4. Code follows the existing style

## Support

- **Issues:** [GitHub Issues](https://github.com/mxchestnut/murder/issues)
- **Discord:** Join our server (link coming soon)
- **Website:** [murder.tech](https://murder.tech)

## License

Proprietary - All rights reserved

---

**Made with ✨ for the roleplay community**
