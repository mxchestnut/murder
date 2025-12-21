# PathCompanion Integration - Testing Guide

## Prerequisites

1. **PathCompanion Account**
   - You need a PathCompanion.com account with at least one character
   - Have your username and password ready

2. **Environment Setup**
   - Backend server running on port 3001
   - Frontend dev server running on port 5173
   - Neon database connected (check .env)

3. **Optional: Discord Webhook**
   - Configure DISCORD_WEBHOOK_URL in .env for dice roll notifications

## Starting the Application

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

Expected output:
```
Server running on port 3001
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

## Testing PathCompanion Import

### Step 1: Navigate to Character Sheets
1. Open http://localhost:5173 in your browser
2. Login with your Cyarika credentials
3. Click on "Character Sheets" in the dashboard

### Step 2: Import from PathCompanion
1. Click the **Download icon** (↓) in the character list header
2. A modal titled "Import from PathCompanion" should appear

### Step 3: Login to PathCompanion
1. Enter your PathCompanion username
2. Enter your PathCompanion password
3. Click "Login to PathCompanion"

**Expected Results:**
- ✅ Login button becomes disabled while processing
- ✅ After 1-2 seconds, character list appears
- ✅ Modal shows "Select a character to import:"

**Troubleshooting:**
- ❌ If login fails, check console for errors
- ❌ Verify username/password are correct
- ❌ Check backend logs for PlayFab errors

### Step 4: Select Character to Import
1. Click on one of your PathCompanion characters
2. Wait for import to complete

**Expected Results:**
- ✅ Character appears in the left sidebar
- ✅ Character has an **External Link badge** (🔗)
- ✅ Character shows correct name, class, and level
- ✅ Modal automatically closes

**Troubleshooting:**
- ❌ If import hangs, check network tab in dev tools
- ❌ Verify backend API is running
- ❌ Check database connection

### Step 5: View Character Stats
1. Click on the imported character in the sidebar
2. Character sheet should display in the main panel

**Expected Results:**
- ✅ All 6 ability scores displayed (STR, DEX, CON, INT, WIS, CHA)
- ✅ Ability modifiers calculated correctly
- ✅ Character name, class, and level shown at top
- ✅ PathCompanion badge visible

### Step 6: Test Dice Rolling
1. Click on any ability modifier (e.g., STR +3)
2. Check the roll result

**Expected Results:**
- ✅ Roll popup shows "d20 + modifier = total"
- ✅ Total is mathematically correct (random 1-20 + modifier)
- ✅ If Discord webhook configured, message sent to Discord

**Example:**
```
Strength Roll
d20 + 3 = 18
(rolled 15 + 3 modifier)
```

### Step 7: Sync Character Updates
1. Go to PathCompanion.com and update your character
   - Change ability scores, level up, etc.
2. Return to Cyarika
3. Click the **Refresh icon** (↻) next to the character

**Expected Results:**
- ✅ Character data updates
- ✅ Ability scores reflect changes
- ✅ Level and class update if changed
- ✅ Last synced timestamp updates

## Testing Multiple Characters

1. Import another character from PathCompanion
2. Both characters should appear in sidebar
3. Click between them to switch active character
4. Each character should maintain its own stats

## Testing Manual vs. PathCompanion Characters

1. Create a manual character using the **+ button**
2. Import a PathCompanion character
3. Compare the two in the sidebar

**Differences:**
- Manual character: No external link badge, no refresh button
- PathCompanion character: Has external link badge, has refresh button
- Both support dice rolling
- Both can be deleted

## Database Verification

Check that data is correctly stored:

```bash
# Connect to Neon database
psql "postgresql://neondb_owner:npg_RkD5GsQSg4wl@ep-floral-surf-ad39gk34-pooler.us-east-1.aws.neon.tech/neondb"

# Query character sheets
SELECT id, name, "characterClass", level, "isPathCompanion", "pathCompanionId" 
FROM character_sheets;
```

**Expected Results:**
- Manual characters: `isPathCompanion` = false, `pathCompanionId` = null
- PathCompanion characters: `isPathCompanion` = true, `pathCompanionId` = character ID

## API Testing with curl

### Login
```bash
curl -X POST http://localhost:3001/api/pathcompanion/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

**Expected Response:**
```json
{
  "sessionTicket": "encrypted_session_token"
}
```

### Get Characters
```bash
curl -X POST http://localhost:3001/api/pathcompanion/characters \
  -H "Content-Type: application/json" \
  -d '{
    "sessionTicket": "session_token_from_login"
  }'
```

**Expected Response:**
```json
{
  "characters": [
    {
      "CharacterId": "abc123",
      "CharacterName": "Valeros the Brave",
      "CharacterType": "Fighter"
    }
  ]
}
```

## Known Issues & Limitations

### Current Limitations
1. **Read-only**: Cannot update PathCompanion characters from Cyarika
2. **Session expiry**: PlayFab sessions may expire, requiring re-login
3. **Basic stats only**: Only ability scores imported currently
4. **No skills/feats**: Advanced character data not yet imported

### Common Issues

**Issue: "Login failed"**
- Solution: Verify PathCompanion credentials
- Solution: Check internet connection
- Solution: Verify PlayFab Title ID is BCA4C

**Issue: "No characters found"**
- Solution: Create a character in PathCompanion first
- Solution: Try logging out and back in
- Solution: Check PlayFab UserData contains characters

**Issue: "Import hangs indefinitely"**
- Solution: Check browser console for errors
- Solution: Verify backend is running
- Solution: Check network tab for failed requests

**Issue: "Sync button does nothing"**
- Solution: Session may have expired, re-import character
- Solution: Check backend logs for errors
- Solution: Verify character still exists in PathCompanion

## Success Criteria

✅ **Login**: Successfully authenticate with PathCompanion  
✅ **List**: See all PathCompanion characters  
✅ **Import**: Add characters to Cyarika  
✅ **Display**: View character stats correctly  
✅ **Roll**: Dice rolling works with modifiers  
✅ **Sync**: Update character data from PathCompanion  
✅ **Badges**: Visual indicators show PathCompanion characters  
✅ **Database**: Data persists correctly  

## Next Steps

After successful testing:
1. Test with multiple PathCompanion accounts
2. Test edge cases (deleted characters, level 1 vs level 20)
3. Add more character data (skills, feats, spells)
4. Implement two-way sync (update PathCompanion from Cyarika)
5. Add character comparison tools

## Support

If you encounter issues:
1. Check backend logs: `cd backend && npm run dev`
2. Check browser console: F12 → Console tab
3. Verify environment variables in `.env`
4. Test API endpoints with curl
5. Check database connection to Neon

## Developer Notes

### PlayFab SDK Details
- Title ID: BCA4C (PathCompanion)
- SDK Version: ^2.187.251205
- Auth method: LoginWithPlayFab
- Data storage: UserData system

### Character Data Structure
```javascript
{
  CharacterId: "unique_id",
  CharacterName: "Character Name",
  CharacterType: "Class Name",
  abilityScores: {
    strength: 16,
    dexterity: 14,
    constitution: 15,
    intelligence: 10,
    wisdom: 12,
    charisma: 8
  },
  level: 5
}
```

### Modifier Calculation
```javascript
Math.floor((abilityScore - 10) / 2)
```

Examples:
- Score 10 → Modifier +0
- Score 16 → Modifier +3
- Score 8 → Modifier -1
