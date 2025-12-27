# Murder - Discord-Integrated Roleplay Platform

**Murder** is a comprehensive roleplay platform featuring a Discord bot, web portal for character management, document editing, and PathCompanion integration for tabletop RPG communities.

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
- **AI FAQ System** - AI-powered knowledge base
- **Hall of Fame** - Star messages for best moments

### ✨ Web Portal
- Secure authentication with username/password
- Rich text document editor with Tiptap 3.0
- Character sheet management and editing
- Settings and account management
- Real-time activity feed *(coming soon)*
- User statistics and leaderboards *(coming soon)*

### 🧠 AI Features
- Natural language FAQ system powered by Google Gemini
- Learn from URLs and documents (`!learnurl`)
- Save helpful AI responses to knowledge base
- Semantic search across your content with `!ask`

---

## Tech Stack

### Backend
- **Runtime:** Node.js, Express, TypeScript
- **Database:** PostgreSQL (AWS RDS)
- **Authentication:** Passport.js
- **Discord:** Discord.js v14
- **AI:** Google Gemini 2.5 Flash
- **Storage:** AWS S3

### Frontend
- **Framework:** React, TypeScript
- **Build Tool:** Vite
- **Editor:** Tiptap 3.0
- **Styling:** Custom CSS with light or dark theme

### Infrastructure
- **Hosting:** AWS EC2
- **Storage:** AWS S3
- **DNS:** AWS Route53
- **Domain:** murder.tech
- **SSL:** Let's Encrypt

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
└── README.md                # This file
```

## Roadmap

### Current Focus

### Upcoming Features

## Commands Reference

### Discord Bot Commands -- Some Need Testing

**Account Setup**
- `!connect <username> <password>` - Link your Discord account to Murder (auto-deleted for security)
- `!syncall` - Refresh character list from PathCompanion

**Character Commands**
- `!setchar <character name>` - Link a character to this channel for quick rolling
- `!char` - Show which character is linked to this channel
- `!profile [character name]` - View full character profile with stats, skills, and backstory
- `CharName: <message>` - Proxy as a character (sends message with character's name/avatar)
- `!CharName <stat>` - Roll for any character by name (e.g., `!Aria perception`)

**Dice Rolling & Stats**
- `!roll <dice>` - Roll dice with modifiers (e.g., `!roll 1d20+5`, `!roll 2d6`)
- `!roll <stat/save/skill>` - Roll for channel's linked character (e.g., `!roll strength`, `!roll acrobatics`)
- `!stats [character name]` - View character stats (messages, rolls, crits, fails, damage)
- `!leaderboard <type>` - Top characters by: messages, rolls, crits, or fails

**AI & Knowledge Base**
- `!ask <question>` - Ask AI about D&D, Pathfinder, or your campaign
- `!feat <name>` - Look up feat information
- `!spell <name>` - Look up spell information
- `!learn <question> | <answer> [| category]` - **(Admin)** Add entry to knowledge base
- `!learnurl <url> [category]` - **(Admin)** Scrape webpage and add to knowledge base (wrap URLs in `< >`)

**Tip:** React with ⭐ to AI answers to save them to your knowledge base!

**Character Memories**
- `!Memory <Character> | <memory>` - Add a memory to a character
- `!<Character> Memories` - View all memories for a character
- Example: `!Memory Ogun | Had a dream about the forest`

**Hall of Fame**
- React with ⭐ to any message - 10+ stars posts it to the Hall of Fame channel
- `!hall` - View recent Hall of Fame entries
- `!hall top` - View top 20 most-starred messages

**Utility Commands**
- `!time [set <date>]` - View or set in-game time/date
- `!note add <text>` - Add private GM note
- `!note list` - List all your GM notes
- `!hc <add|list|edit|delete>` - Manage headcanon list
- `!npc <name>` - Generate NPC stat block using AI
- `!music` - Get mood music suggestion for current scene
- `!recap` - Generate session recap

**Admin Commands**
- `!botset` - **(Admin)** Set channel as bot announcement channel

## Support

- **Issues:** [GitHub Issues](https://github.com/mxchestnut/murder/issues)
- **Discord:** [Join our server] (https://discord.gg/FFQ4YP7DVf)
- **Website:** [murder.tech](https://murder.tech)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

You are free to use, modify, and distribute this software. Contributions are welcome and will be licensed under the same terms.

---

**Made with ✨ for the roleplay community**
