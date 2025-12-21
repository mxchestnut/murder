# Character Sheets Feature - Setup Guide

## Overview
I've successfully added D&D-style character sheets to Cyarika with the following features:

- Create and manage multiple characters
- Full D&D ability scores: Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma
- Automatic modifier calculation based on D&D rules
- D20 dice rolling with modifier application
- Dice roll results posted to Discord webhook

## What Was Added

### Backend Changes

1. **Database Schema** ([backend/src/db/schema.ts](backend/src/db/schema.ts))
   - Added `character_sheets` table with:
     - Character name, class, and level
     - Six ability scores (STR, DEX, CON, INT, WIS, CHA)
     - Automatic timestamps
     - User association

2. **API Routes** ([backend/src/routes/characters.ts](backend/src/routes/characters.ts))
   - `GET /api/characters` - List all character sheets
   - `GET /api/characters/:id` - Get specific character
   - `POST /api/characters` - Create new character
   - `PUT /api/characters/:id` - Update character
   - `DELETE /api/characters/:id` - Delete character
   - `POST /api/characters/:id/roll` - Roll dice for a stat

3. **Server Registration** ([backend/src/server.ts](backend/src/server.ts))
   - Registered character routes at `/api/characters`

### Frontend Changes

1. **Character Sheets Component** ([frontend/src/components/CharacterSheets.tsx](frontend/src/components/CharacterSheets.tsx))
   - Character list sidebar
   - Create/edit character forms
   - Stat blocks with visual icons
   - Roll buttons for each ability score
   - Real-time roll result display
   - Beautiful, responsive UI

2. **Dashboard Integration** ([frontend/src/components/Dashboard.tsx](frontend/src/components/Dashboard.tsx))
   - Added "Characters" button in header (dice icon)
   - Toggle between Documents, Characters, and Messages views

### Configuration

1. **Environment Variables** ([.env.example](.env.example))
   - Added optional `DISCORD_WEBHOOK_URL` for dice roll notifications

2. **Documentation** ([README.md](README.md))
   - Updated features list
   - Added Discord webhook setup instructions

## Setup Instructions

### 1. Database Migration

You need to create the `character_sheets` table in your Neon database:

```bash
# Make sure you have a .env file with your Neon DATABASE_URL
# (You should already have this from your existing setup)

# Push the schema to Neon
cd backend
npm install  # if not already done
npm run db:push
```

**Note:** Since you're using Neon (serverless PostgreSQL), the database is always running - no need to start it!

If the push command fails, you can manually create the table using this SQL:

```sql
CREATE TABLE character_sheets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  strength INTEGER NOT NULL DEFAULT 10,
  dexterity INTEGER NOT NULL DEFAULT 10,
  constitution INTEGER NOT NULL DEFAULT 10,
  intelligence INTEGER NOT NULL DEFAULT 10,
  wisdom INTEGER NOT NULL DEFAULT 10,
  charisma INTEGER NOT NULL DEFAULT 10,
  character_class TEXT,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 2. Discord Webhook Setup (Optional)

To enable dice roll notifications to Discord:

1. Go to your Discord server
2. Navigate to: Server Settings → Integrations → Webhooks
3. Click "New Webhook" or copy an existing one
4. Copy the webhook URL
5. Add to your `.env` file:
   ```env
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN
   ```

**Note:** The feature works without Discord - rolls just won't be posted anywhere.

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install  # Make sure lucide-react icons are installed
```

### 4. Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Usage

1. Log in to Cyarika
2. Click the **🎲 Characters** button in the top navigation
3. Click the **+** button to create your first character
4. Fill in character details:
   - Name (required)
   - Class (optional, e.g., "Fighter", "Wizard")
   - Level (1-20)
   - Ability scores (1-30, default 10)
5. Click **Save**
6. Click any **Roll** button to roll a d20 + modifier for that stat
7. The result will appear at the top and (if configured) post to Discord

## How Dice Rolling Works

- Rolls a random number from 1-20 (d20)
- Calculates modifier: `floor((stat - 10) / 2)`
- Adds modifier to roll: `d20 + modifier = total`
- Displays result and sends to Discord (if configured)

Example:
- Character has Strength 16
- Modifier = (16-10)/2 = +3
- Roll: 14 + 3 = **17**

## Discord Message Format

When you roll, Discord receives:
```
🎲 **username** rolled for **Character Name**'s **STRENGTH**
Roll: 14 +3 = **17**
```

## Troubleshooting

**Characters button not showing?**
- Make sure frontend dependencies are installed
- Check browser console for errors

**Can't create characters?**
- Ensure database migration ran successfully
- Check backend logs for errors
- Verify DATABASE_URL in .env is correct

**Discord not receiving rolls?**
- Check DISCORD_WEBHOOK_URL is set correctly
- Test webhook with: `curl -X POST -H "Content-Type: application/json" -d '{"content":"Test"}' YOUR_WEBHOOK_URL`
- Rolls will still work locally without Discord

**Getting database errors?**
- Run the SQL manually (see above)
- Check PostgreSQL is running
- Verify user has permissions

## Next Steps

You can extend this feature by:
- Adding more character stats (HP, AC, etc.)
- Implementing skill checks with proficiency bonuses
- Adding inventory management
- Creating encounter tracking
- Supporting different dice types (d4, d6, d8, d12)

Enjoy your new D&D character sheets! 🎲
