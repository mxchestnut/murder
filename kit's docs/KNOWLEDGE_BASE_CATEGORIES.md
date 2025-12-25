# Categorized Knowledge Base Commands

## Overview
The knowledge base supports categorized lookups with AI fallback for feats and spells.

## Commands

### ⚔️ !feat <name>
Look up D&D feat information.

**Examples:**
```
!feat Power Attack
!feat Great Weapon Master
!feat Lucky
```

**How it works:**
1. Searches your custom knowledge base entries first
2. If not found, asks Gemini AI for D&D feat details
3. React with ⭐ to save AI responses to your knowledge base

---

### ✨ !spell <name>
Look up spell information (D&D or other systems).

**Examples:**
```
!spell Fireball
!spell Cure Wounds
!spell Counterspell
```

**How it works:**
1. Searches your custom knowledge base entries first
2. If not found, asks Gemini AI for spell details
3. React with ⭐ to save AI responses to your knowledge base

---

## Teaching the Bot (Admins Only)

### Updated !learn command
```
!learn <question> | <answer> [| <category>]
```

**Categories:** `kink`, `feat`, `spell`, or leave blank for general knowledge

**Examples:**

**General knowledge:**
```
!learn What is AC? | Armor Class is your defense rating
```

**Spell entry:**
```
!learn Fireball | 3rd-level evocation spell. Range 150 ft. 8d6 fire damage in 20-ft radius. DEX save for half. | spell
```

**Feat entry:**
```
!learn Great Weapon Master | You can take a -5 penalty to attack rolls to add +10 to damage. When you score a critical hit or reduce a creature to 0 HP, you can make a bonus attack. | feat
```

**Kink entry:**
```
!learn Bondage | Consensual restraint using rope, cuffs, or other restraints. Requires clear communication and safe words. | kink
```

---

## AI Fallback

When you search for something not in your knowledge base:
1. Bot automatically asks Gemini AI for information
2. AI provides comprehensive answer
3. Reply includes ⭐ reaction
4. React with ⭐ within 60 seconds to save to knowledge base
5. Future searches will use your saved version instead

---

## Benefits

✅ **Quick reference** - Instant access to game mechanics and content  
✅ **Customizable** - Add your house rules and homebrewed content  
✅ **AI-powered** - Fallback to AI when info isn't available  
✅ **Community-built** - Save AI answers that work for your group  
✅ **Organized** - Categories keep different types of info separate  

---

## Database

All entries stored in `knowledge_base` table with:
- `question` - Search term (e.g., "Fireball", "Bondage")
- `answer` - Full description
- `category` - Category tag (`kink`, `feat`, `spell`, or null)
- `aiGenerated` - Boolean flag
- `upvotes` - Community voting (future feature)

---

## Next Steps

1. Try the new commands in Discord
2. Use `!learn` to add custom entries with categories
3. Save AI responses you like with ⭐ reactions
4. Build your community knowledge base!

**Pro Tip:** Start by using the commands without pre-loading data. The AI will provide answers, and you can save the good ones with ⭐!
