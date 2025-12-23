# Cyar'ika Discord Bot Commands

## AI FAQ System

### !ask [question]
Ask the bot a question about D&D 5e or Pathfinder. The bot will:
1. First search the knowledge base for existing answers
2. If not found, use Google Gemini AI to generate an answer
3. React with ⭐ to save AI-generated answers to the knowledge base

**Example:**
```
!ask What is the grapple condition in Pathfinder?
!ask How do I calculate saving throws?
```

### !learn [question | answer]
*Admin only* - Manually add an entry to the knowledge base.

**Example:**
```
!learn What is the party's current quest? | Find the lost artifact of Zephyr
```

## Character Stats Tracking

### !stats [character name]
View statistics for a character, including:
- Total messages sent (proxy messages)
- Total dice rolls
- Natural 20s count
- Natural 1s count  
- Total damage dealt

If no character name is provided, shows stats for the character linked to the current channel.

**Example:**
```
!stats
!stats Aria Moonwhisper
```

### !leaderboard [category]
Show top 10 characters by category:
- `messages` - Most proxy messages sent
- `rolls` - Most dice rolls
- `crits` - Most Natural 20s
- `fails` - Most Natural 1s
- `damage` - Most total damage dealt

**Example:**
```
!leaderboard messages
!leaderboard crits
```

## Character Management

### !setchar [character name]
Link a character to the current Discord channel.

**Example:**
```
!setchar Aria Moonwhisper
```

### !char
Show which character is linked to the current channel.

### !profile
View full profile of the linked character.

## Dice Rolling

### !roll [stat/save/skill name]
Roll for the character linked to the channel.

**Example:**
```
!roll strength
!roll fortitude
!roll acrobatics
```

### [Character Name]: [stat/save/skill]
Roll for any character by name.

**Example:**
```
Aria: perception
Kael: reflex
```

## Proxy Messages

### [Character Name]: [message]
Send a message as a character (uses character's avatar and name).

**Example:**
```
Aria: "I search the room for traps."
Kael: "I ready my sword."
```

## PathCompanion Integration

### !connect [character ID]
Link a character to their PathCompanion profile.

**Example:**
```
!connect 12345
```

### !syncall
Sync all characters' stats from PathCompanion.

## General

### !help
Show list of available commands.

---

## Automatic Stat Tracking

The bot automatically tracks:
- Every proxy message sent by a character
- Every dice roll (including Natural 20s and Natural 1s)
- Damage dealt (when specified in rolls)

This data powers the `!stats` and `!leaderboard` commands.
