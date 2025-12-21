# PathCompanion Integration Guide

## Overview
Cyarika now integrates with PathCompanion.com to import Pathfinder 2e character sheets directly from your PathCompanion account.

## How It Works
PathCompanion uses Microsoft PlayFab as its backend service. With developer permission, we can use the PlayFab Client SDK to:
1. Authenticate users with their PathCompanion credentials
2. Fetch character lists from their account
3. Import character data including stats and abilities
4. Sync updates from PathCompanion

## Setup

### Backend Configuration
The backend uses the PlayFab SDK with Title ID `BCA4C` (PathCompanion's publicly visible title ID).

**Environment Variables**: None required - PlayFab Title ID is public.

**Dependencies**:
```bash
cd backend
npm install playfab-sdk
```

### Database Schema
The `character_sheets` table includes PathCompanion-specific fields:
- `isPathCompanion`: Boolean flag indicating imported character
- `pathCompanionId`: Character ID from PathCompanion
- `pathCompanionData`: Full JSON data from PathCompanion
- `pathCompanionSession`: User's PlayFab session (encrypted)
- `lastSynced`: Timestamp of last sync

## Using PathCompanion Import

### Step 1: Login to PathCompanion
1. Click the **Download** icon in the character list header
2. Enter your PathCompanion username and password
3. Click "Login to PathCompanion"

### Step 2: Select Character to Import
1. After successful login, you'll see your PathCompanion characters
2. Click on a character to import it
3. The character will be added to your Cyarika character list

### Step 3: Sync Updates
1. PathCompanion characters have a **Refresh** icon next to them
2. Click the refresh icon to sync latest updates from PathCompanion
3. This updates stats, abilities, and other character data

## Features

### Imported Data
- Character name
- Class and level
- Ability scores (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma)
- Ability modifiers (automatically calculated)
- Full character data stored as JSON for future features

### Visual Indicators
- PathCompanion characters display an **External Link** badge
- Sync button available only for imported characters
- Last synced timestamp tracked in database

### Dice Rolling
- Works exactly the same as manual characters
- Click any ability modifier to roll d20 + modifier
- Results sent to Discord webhook (if configured)

## API Endpoints

### POST /api/pathcompanion/login
Login to PathCompanion account
```json
{
  "username": "your_username",
  "password": "your_password"
}
```

**Response**:
```json
{
  "sessionTicket": "encrypted_session_token"
}
```

### POST /api/pathcompanion/characters
Get user's character list (requires session)
```json
{
  "sessionTicket": "session_token"
}
```

**Response**:
```json
{
  "characters": [
    {
      "CharacterId": "character_id",
      "CharacterName": "Character Name",
      "CharacterType": "Class"
    }
  ]
}
```

### POST /api/pathcompanion/import
Import a character (requires session)
```json
{
  "sessionTicket": "session_token",
  "characterId": "character_id"
}
```

**Response**: Returns full character sheet object

### POST /api/pathcompanion/sync/:id
Sync character updates from PathCompanion

**Response**: Returns updated character sheet

## Technical Details

### PlayFab SDK
We use the official `playfab-sdk` npm package:
```javascript
import PlayFab from 'playfab-sdk/Scripts/PlayFab/PlayFab';
import PlayFabClient from 'playfab-sdk/Scripts/PlayFab/PlayFabClient';

PlayFab.settings.titleId = 'BCA4C'; // PathCompanion Title ID
```

### Authentication Flow
1. User provides username/password
2. Backend calls `PlayFabClient.LoginWithPlayFab()`
3. PlayFab returns SessionTicket
4. SessionTicket stored encrypted in database
5. All subsequent API calls use SessionTicket

### Data Extraction
Character data is stored in PlayFab's UserData system:
- `CharacterList`: Array of character IDs
- `Character_{id}`: Full character JSON data

We extract:
- Ability scores from `abilityScores` object
- Character name, class, level from top-level fields
- Calculate modifiers using D&D formula: `Math.floor((score - 10) / 2)`

## Security Considerations

### Safe Practices
✅ Developer permission granted by PathCompanion team  
✅ Title ID is publicly visible (safe to use)  
✅ Session tickets encrypted in database  
✅ Passwords never stored  
✅ API calls authenticated via session tickets  

### What NOT to Do
❌ Don't share session tickets  
❌ Don't expose PathCompanion passwords  
❌ Don't modify character data on PathCompanion (read-only)  

## Troubleshooting

### Login Failed
- Verify username/password are correct
- Check that PathCompanion account is active
- Ensure backend has `playfab-sdk` installed

### No Characters Found
- Check that you have characters in PathCompanion
- Try logging out and back in
- Verify character data exists in PathCompanion account

### Sync Failed
- Session may have expired - try re-importing
- Character may have been deleted in PathCompanion
- Check backend logs for PlayFab errors

## Future Enhancements

Potential additions:
- Two-way sync (update PathCompanion from Cyarika)
- Import skills, feats, and spells
- Real-time character updates
- Support for multiple PathCompanion accounts
- Character comparison tools

## Credits

Built with permission from PathCompanion developers using the PlayFab platform.
