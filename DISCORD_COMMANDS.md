# Cyar'ika Discord Bot Commands

Complete reference for all Discord bot commands and features.

---

## 🔗 Account Setup

### !connect <username> <password>
Link your Discord account to your PathCompanion account. **This command is automatically deleted for security.**

**Example:**
```
!connect myusername mypassword
```

### !syncall
Refresh your character list from PathCompanion. Shows all synced characters.

**Example:**
```
!syncall
```

---

## 🎭 Character Commands

### !setchar <character name>
Link a character to the current Discord channel for quick rolling.

**Example:**
```
!setchar Aria Moonwhisper
```

### !char
Show which character is currently linked to this channel.

### !profile [character name]
View full character profile with tabbed interface showing:
- Identity (name, race, class, level, alignment, deity)
- Combat (HP, AC, saves, BAB, CMB/CMD, initiative)
- Goals (personal goals and party objectives)
- Personality (traits, ideals, bonds, flaws)
- Appearance (physical description)
- Skills (all skills with bonuses)
- Backstory (character history)
- Relationships (connections to other characters)
- Beliefs (philosophy and worldview)
- Public/Private info
- Growth (character development)
- Legacy (impact on the world)

**Example:**
```
!profile
!profile Aria Moonwhisper
```

### [Character Name]: [message]
Proxy as a character - sends message with character's name and avatar.

**Example:**
```
Aria: "I search the room for traps."
Kael: "I ready my sword."
```

---

## 🎲 Dice Rolling & Stats

### !roll <dice>
Roll dice with modifiers.

**Examples:**
```
!roll 1d20+5
!roll 2d6
!roll 1d20
```

### !roll <stat/save/skill>
Roll for the character linked to this channel.

**Examples:**
```
!roll strength
!roll fortitude
!roll acrobatics
!roll perception
```

### [Character Name] <stat/save/skill>
Roll for any character by name.

**Examples:**
```
!Aria perception
!Kael strength
```

### !stats [character name]
View character statistics including:
- Total messages sent (proxy messages)
- Total dice rolls
- Natural 20s count
- Natural 1s count
- Total damage dealt

**Example:**
```
!stats
!stats Aria Moonwhisper
```

### !leaderboard <type>
View top characters by category. Types: `messages`, `rolls`, `crits`, `fails`, `damage`

**Examples:**
```
!leaderboard messages
!leaderboard crits
!leaderboard damage
```

---

## 💭 AI & Knowledge Base

### !ask <question>
Ask the AI anything about D&D, Pathfinder, or your campaign. Searches knowledge base first, then uses Gemini AI as fallback.

**Examples:**
```
!ask How does sneak attack work?
!ask What is AC?
```

### !kink <name>
Look up kink/fetish information. Searches your knowledge base first, then asks AI.

**Examples:**
```
!kink bondage
!kink roleplay
```

### !feat <name>
Look up D&D/Pathfinder feat information. Searches your knowledge base first, then asks AI.

**Examples:**
```
!feat Weapon Finesse
!feat Great Weapon Master
!feat Power Attack
```

### !spell <name>
Look up spell information. Searches your knowledge base first, then asks AI.

**Examples:**
```
!spell Fireball
!spell Cure Wounds
!spell Counterspell
```

### !learn <question> | <answer> [| category]
**Admin only** - Add an entry to the knowledge base. Optional categories: `kink`, `feat`, `spell`

**Examples:**
```
!learn What is AC? | Armor Class is your defense rating
!learn Fireball | 3rd-level evocation spell... | spell
!learn Great Weapon Master | Take -5 to hit for +10 damage | feat
```

**💡 Tip:** React with ⭐ to AI answers to save them to your knowledge base!

---

## 🎬 RP Tools & Inspiration

### !prompt [random <category>]
Get a random RP prompt. Categories: `character`, `world`, `combat`, `social`, `plot`

**Examples:**
```
!prompt
!prompt random character
!prompt random plot
```

### !trope [category]
Get random trope inspiration. Categories: `archetype`, `plot`, `relationship`, `setting`

**Examples:**
```
!trope
!trope archetype
!trope plot
```

---

## 📝 Session & Scene Tracking

### !session start <title>
Start logging a new session. All messages in the channel will be tracked.

**Example:**
```
!session start The Hunt for the Crimson Amulet
```

### !session end
End the current session logging.

### !session pause
Temporarily pause session logging.

### !session resume
Resume session logging.

### !session list
Show recent sessions.

### !recap
Generate a quick recap of the current/last session.

---

### !scene start <title>
Start a new scene within a session.

**Example:**
```
!scene start Ambush in the Forest
```

### !scene end
End the current scene.

### !scene tag <tags>
Add tags to the current scene (comma-separated).

**Example:**
```
!scene tag combat, boss fight, dramatic
```

### !scene location <location>
Set the location for the current scene.

**Example:**
```
!scene location Ancient Ruins of Zephyr
```

### !scene list
Show recent scenes.

---

## ⭐ Hall of Fame (Starboard)

React with ⭐ to any message! When a message gets **10+ stars**, it's automatically posted to #hall-of-fame channel.

### !hall
View recent Hall of Fame entries.

### !hall top
View top 20 most-starred messages of all time.

**Features:**
- Includes context messages (before and after)
- Shows original channel and author
- Automatically removed if stars drop below 10
- Permanent record of epic moments!

---

## 🛠️ Utility Commands

### !time [set <date>]
Track or set in-game time/date.

**Examples:**
```
!time
!time set 15th of Mirtul, 1492 DR - Evening
```

### !note add <text>
Add a private GM note (only you can see your notes).

**Example:**
```
!note add Remember to introduce the villain next session
```

### !note list
List all your GM notes.

### !npc <name>
Generate a quick NPC stat block using AI.

**Example:**
```
!npc Mysterious Merchant
```

### !music
Get a mood music suggestion for the current scene.

---

## 👥 Relationship Tracking

### !<Character1> is <Character2>'s <descriptor> | <notes>
Add a relationship between characters. Displays in the Relationships tab of !profile.

**Examples:**
```
!Aria is Kael's best friend | They share a deep bond of mutual respect.
!Ogun is Rig's rival | Competing for the captain's approval.
```

---

## ⚙️ Admin Commands

### !botset
**Admin only** - Set the current channel as the bot announcement channel for future automated features.

### !learn <question> | <answer> [| category]
**Admin only** - Add knowledge base entries (see AI & Knowledge Base section above).

---

## 🎉 Automatic Features

The bot automatically tracks:
- ✅ Every proxy message sent by characters
- ✅ Every dice roll (including Natural 20s and Natural 1s)
- ✅ Damage dealt in combat
- ✅ Session messages when logging is active
- ✅ Scene participation and dialogue

This data powers `!stats`, `!leaderboard`, `!recap`, and relationship tracking.

---

## 📊 Full Command List

**Account & Setup:** `!connect`, `!syncall`, `!botset`  
**Characters:** `!setchar`, `!char`, `!profile`, `CharName: message`  
**Dice & Stats:** `!roll`, `!stats`, `!leaderboard`  
**AI & Knowledge:** `!ask`, `!kink`, `!feat`, `!spell`, `!learn`  
**RP Tools:** `!prompt`, `!trope`  
**Sessions:** `!session start/end/pause/resume/list`, `!recap`  
**Scenes:** `!scene start/end/tag/location/list`  
**Hall of Fame:** React ⭐, `!hall`, `!hall top`  
**Utilities:** `!time`, `!note`, `!npc`, `!music`  
**Relationships:** `!CharName is CharName's descriptor | notes`  
**Help:** `!help`

**Total Commands:** 35+

---

## 💡 Pro Tips

- React ⭐ to AI answers to save them to your knowledge base
- Use `!profile` for detailed character sheets
- Start sessions with `!session start` to track campaign progress
- Tag scenes for better organization and searchability
- The bot learns from your `!learn` commands - teach it your homebrew rules!
- Hall of Fame keeps your best RP moments forever

---

**Need help?** Use `!help` in Discord for a quick command overview!
