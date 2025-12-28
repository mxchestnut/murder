# Write Pretend - Discord-Integrated Roleplay Platform

**Write Pretend** is a comprehensive roleplay platform featuring Discord bot integration, web portal for character management, document editing, and advanced AI-powered features for tabletop RPG and creative writing communities.

## Features

### Free Tier (Available to Everyone)

**Character Management**
- Create and manage characters via web portal
- Full Pathfinder character sheets with stats, skills, weapons, spells
- Character avatar upload for Discord proxying
- Export and share character sheets

**Discord Bot Integration**
- **Character Proxying** - Speak as your character with custom avatars
- **Dice Rolling** - Roll with character stats, saves, and skills
- **Character Statistics** - Track rolls, crits, fails, and messages
- **Hall of Fame** - Star messages to showcase best roleplay moments
- **GM Tools** - Time tracking, NPC generation, music suggestions

### RP Tier (Premium Subscription)

**AI-Powered Features**
- **Knowledge Base** - AI FAQ system powered by Google Gemini 2.5 Flash
- **Semantic Search** - Ask questions about D&D, Pathfinder, or your campaign with `!ask`
- **Smart Learning** - Add URLs, documents, or manual entries to your knowledge base
- **D&D Lookups** - Instant feat and spell information with AI assistance

**Advanced Character Systems**
- **Character Memories** - Track important character moments and development
- **Character Relationships** - Define and track relationships between characters
- **World Building Lore** - Tag-based lore system with cross-channel posting
- **Prompts & Tropes** - Generate creative prompts and writing inspiration

**Web Portal**
- Secure authentication with username/password
- Rich text document editor with Tiptap 3.0
- Character sheet management and editing
- Settings and account management
- Statistics dashboard and leaderboards

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
- **Domain:** writepretend.com
- **SSL:** Let's Encrypt

---

## Project Structure

```
write-pretend/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Discord bot, AI, scheduling
│   │   ├── middleware/      # Auth & tier gating
│   │   ├── db/              # Database schema (Drizzle ORM)
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

---


### Discord Bot Commands

**Account Setup**
- `!connect <username> <password>` - Link your Discord account (auto-deleted for security)

**Character Commands** (Free Tier)
- `!setchar <character name>` - Link a character to this channel for quick rolling
- `!char` - Show which character is linked to this channel
- `!profile [character name]` - View full character profile with stats, skills, and backstory
- `CharName: <message>` - Proxy as a character (sends message with character's name/avatar)
- `!CharName <stat>` - Roll for any character by name (e.g., `!Aria perception`)

**Dice Rolling & Stats** (Free Tier)
- `!roll <dice>` - Roll dice with modifiers (e.g., `!roll 1d20+5`, `!roll 2d6`)
- `!roll <stat/save/skill>` - Roll for channel's linked character (e.g., `!roll strength`, `!roll acrobatics`)
- `!stats [character name]` - View character stats (messages, rolls, crits, fails, damage)
- `!leaderboard <type>` - Top characters by: messages, rolls, crits, or fails

**Character Relationships** (RP Tier)
- `!CharName is OtherName's relationship. | Description` - Add relationship between characters
- Example: `!Aria is Ogun's mentor. | She taught him everything about the forest`

**Character Memories** (RP Tier)
- `!Memory <Character> | <memory>` - Add a memory to a character
- `!<Character> Memories` - View all memories for a character
- Example: `!Memory Ogun | Had a dream about the forest`

**World Building Lore** (RP Tier)
- `!lore <note> <tag>` - Add lore entry with a tag (posts to tagged channels)
- `!lore list [tag]` - View all lore entries (optionally filter by tag)
- `!lore delete <id>` - Remove a lore entry
- `!lore` - View lore for current channel's tag
- `!set <tag>` - Link current channel to a lore tag

**AI & Knowledge Base** (RP Tier)
- `!ask <question>` - Ask AI about D&D, Pathfinder, or your campaign
- `!feat <name>` - Look up feat information
- `!spell <name>` - Look up spell information
- `!learn <question> | <answer> [| category]` - **(Admin)** Add entry to knowledge base
- `!learnurl <url> [category]` - **(Admin)** Scrape webpage and add to knowledge base (wrap URLs in `< >`)

**Tip:** React with ⭐ to AI answers to save them to your knowledge base!

**Hall of Fame** (Free Tier)
- React with ⭐ to any message - 10+ stars posts it to the Hall of Fame channel
- `!hall` - View recent Hall of Fame entries
- `!hall top` - View top 20 most-starred messages

**GM Utility Commands** (Free Tier)
- `!time [set <date>]` - View or set in-game time/date
- `!note add <text>` - Add private GM note
- `!note list` - List all your GM notes
- `!hc <add|list|edit|delete>` - Manage headcanon list
- `!npc <name>` - Generate NPC stat block using AI
- `!music` - Get mood music suggestion for current scene
- `!recap` - Generate session recap

**Admin Commands**
- `!botset` - **(Admin)** Set channel as bot announcement channel

---

## Getting Started

### For Players

1. Visit [writepretend.com](https://writepretend.com) and create an account
2. Invite the Write Pretend bot to your Discord server
3. Link your account with `!connect <username> <password>` in Discord
4. Create characters via the web portal
5. Start roleplaying with character proxying and dice rolling!

### For RP Tier Subscribers

All free tier features, plus:
- AI-powered knowledge base and D&D lookups
- Character memories and relationship tracking
- World building lore system with tags
- Creative prompts and tropes
- Advanced statistics and analytics

Upgrade at [writepretend.com/settings](https://writepretend.com/settings)

---

## Support

- **Website:** [writepretend.com](https://writepretend.com)
- **Discord:** [Join our server](https://discord.gg/FFQ4YP7DVf)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

You are free to use, modify, and distribute this software. Contributions are welcome and will be licensed under the same terms.

---

**Made with ✨ for the roleplay community**
