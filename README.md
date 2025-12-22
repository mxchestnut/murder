# Write Pretend - AI-Powered Roleplay Platform

**Write Pretend** is a comprehensive roleplay platform featuring a Discord bot, web portal for character management, and AI-powered assistance for tabletop RPG communities.

🌐 **Website:** [writepretend.com](http://writepretend.com)

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

## Tech Stack

### Backend
- **Runtime:** Node.js, Express, TypeScript
- **Database:** PostgreSQL (Neon serverless)
- **Authentication:** Passport.js
- **Discord:** Discord.js v14
- **AI:** OpenAI GPT-4 *(planned)*
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
- **Domain:** writepretend.com

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Discord bot token
- AWS S3 credentials
- OpenAI API key *(for AI features)*

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/mxchestnut/writepretend.git
cd writepretend
```

2. **Set up git-secrets** (IMPORTANT - Prevents committing secrets)
```bash
./.git-secrets-setup.sh
```

3. **Install dependencies**
```bash
# Root dependencies
npm install

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

4. **Configure environment variables**

Create `backend/.env`:
```env
# Database
DATABASE_URL=postgresql://user:password@host/database

# Authentication
SESSION_SECRET=your_random_secret_here

# Discord Bot
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name

# API URLs
FRONTEND_URL=http://writepretend.com
API_URL=http://writepretend.com

# OpenAI (optional, for AI features)
OPENAI_API_KEY=your_openai_key
```

4. **Run database migrations**
```bash
cd backend
npm run db:push
```

5. **Start development servers**
```bash
# Backend (from backend/)
npm run dev

# Frontend (from frontend/)
npm run dev
```

## Discord Bot Setup

1. **Create Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create new application named "Write Pretend Bot"
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

## Deployment

### AWS EC2 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment instructions.

**Quick Deploy:**
```bash
# On EC2 instance
git pull
npm run build --prefix backend
npm run build --prefix frontend
pm2 restart backend
sudo cp -r frontend/dist/* /var/www/html/
```

### DNS Configuration

Route53 is already configured to point writepretend.com to your EC2 instance.

## Project Structure

```
cyarika/
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
├── WRITEPRETEND_ROADMAP.md  # Feature roadmap
├── REBRAND_TO_WRITEPRETEND.md  # Migration guide
└── README.md                # This file
```

## Roadmap

See [WRITEPRETEND_ROADMAP.md](WRITEPRETEND_ROADMAP.md) for the complete feature roadmap.

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
- `!connect <username> <password>` - Link Discord to Write Pretend
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

- **Issues:** [GitHub Issues](https://github.com/mxchestnut/writepretend/issues)
- **Discord:** Join our test server (link coming soon)
- **Website:** [writepretend.com](http://writepretend.com)

## License

Proprietary - All rights reserved

---

**Made with ✨ for the roleplay community**
