import { Router } from 'express';
import { db } from '../db';
import { characterSheets } from '../db/schema';
import { eq } from 'drizzle-orm';
import { isAuthenticated } from '../middleware/auth';
import * as PlayFabService from '../services/playfab';

const router = Router();

// All routes require authentication
router.use(isAuthenticated);

/**
 * Login to PathCompanion/PlayFab and get session
 * POST /api/pathcompanion/login
 * Body: { username, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const auth = await PlayFabService.loginToPlayFab(username, password);

    res.json({
      playfabId: auth.playfabId,
      sessionTicket: auth.sessionTicket,
      message: 'Successfully connected to PathCompanion'
    });
  } catch (error) {
    console.error('PathCompanion login error:', error);
    res.status(500).json({ 
      error: 'Failed to connect to PathCompanion',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get list of characters from PathCompanion
 * POST /api/pathcompanion/characters
 * Body: { sessionTicket }
 */
router.post('/characters', async (req, res) => {
  try {
    const { sessionTicket } = req.body;

    if (!sessionTicket) {
      return res.status(400).json({ error: 'Session ticket is required' });
    }

    const characters = await PlayFabService.getCharacterList(sessionTicket);

    res.json({
      characters: characters.map(char => ({
        characterId: char.characterId,
        name: char.characterName,
        lastModified: char.lastModified,
        // Don't send full data yet, just summary
      }))
    });
  } catch (error) {
    console.error('Failed to fetch PathCompanion characters:', error);
    res.status(500).json({ 
      error: 'Failed to fetch characters',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Import a PathCompanion character
 * POST /api/pathcompanion/import
 * Body: { sessionTicket, characterId }
 */
router.post('/import', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { sessionTicket, characterId } = req.body;

    if (!sessionTicket || !characterId) {
      return res.status(400).json({ error: 'Session ticket and character ID are required' });
    }

    // Fetch the character from PathCompanion
    const character = await PlayFabService.getCharacter(sessionTicket, characterId);

    if (!character) {
      return res.status(404).json({ error: 'Character not found in PathCompanion' });
    }

    // Extract ability scores
    const abilities = PlayFabService.extractAbilityScores(character.data);

    // Check if this character is already imported
    const existing = await db.select().from(characterSheets).where(
      eq(characterSheets.pathCompanionId, characterId)
    );

    let sheet;

    if (existing.length > 0) {
      // Update existing character
      [sheet] = await db.update(characterSheets)
        .set({
          name: character.characterName,
          strength: abilities.strength,
          dexterity: abilities.dexterity,
          constitution: abilities.constitution,
          intelligence: abilities.intelligence,
          wisdom: abilities.wisdom,
          charisma: abilities.charisma,
          characterClass: character.data.class || character.data.className,
          level: character.data.level || 1,
          pathCompanionData: JSON.stringify(character.data),
          pathCompanionSession: sessionTicket,
          lastSynced: new Date(),
          updatedAt: new Date()
        })
        .where(eq(characterSheets.id, existing[0].id))
        .returning();
    } else {
      // Create new character
      [sheet] = await db.insert(characterSheets).values({
        userId,
        name: character.characterName,
        strength: abilities.strength,
        dexterity: abilities.dexterity,
        constitution: abilities.constitution,
        intelligence: abilities.intelligence,
        wisdom: abilities.wisdom,
        charisma: abilities.charisma,
        characterClass: character.data.class || character.data.className,
        level: character.data.level || 1,
        isPathCompanion: true,
        pathCompanionId: characterId,
        pathCompanionData: JSON.stringify(character.data),
        pathCompanionSession: sessionTicket,
        lastSynced: new Date()
      }).returning();
    }

    // Add computed modifiers
    const sheetWithModifiers = {
      ...sheet,
      modifiers: {
        strength: PlayFabService.calculateModifier(sheet.strength),
        dexterity: PlayFabService.calculateModifier(sheet.dexterity),
        constitution: PlayFabService.calculateModifier(sheet.constitution),
        intelligence: PlayFabService.calculateModifier(sheet.intelligence),
        wisdom: PlayFabService.calculateModifier(sheet.wisdom),
        charisma: PlayFabService.calculateModifier(sheet.charisma)
      },
      isPathCompanion: true
    };

    res.status(201).json(sheetWithModifiers);
  } catch (error) {
    console.error('Failed to import PathCompanion character:', error);
    res.status(500).json({ 
      error: 'Failed to import character',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Sync a PathCompanion character (refresh data from PlayFab)
 * POST /api/pathcompanion/sync/:id
 */
router.post('/sync/:id', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const sheetId = parseInt(req.params.id);

    // Get the character sheet
    const [sheet] = await db.select().from(characterSheets).where(
      eq(characterSheets.id, sheetId)
    );

    if (!sheet) {
      return res.status(404).json({ error: 'Character sheet not found' });
    }

    if (sheet.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!sheet.isPathCompanion || !sheet.pathCompanionId || !sheet.pathCompanionSession) {
      return res.status(400).json({ error: 'Not a PathCompanion character or missing session' });
    }

    // Fetch fresh data from PathCompanion
    const character = await PlayFabService.getCharacter(
      sheet.pathCompanionSession,
      sheet.pathCompanionId
    );

    if (!character) {
      return res.status(404).json({ error: 'Character not found in PathCompanion' });
    }

    // Extract updated ability scores
    const abilities = PlayFabService.extractAbilityScores(character.data);

    // Update the character sheet
    const [updated] = await db.update(characterSheets)
      .set({
        name: character.characterName,
        strength: abilities.strength,
        dexterity: abilities.dexterity,
        constitution: abilities.constitution,
        intelligence: abilities.intelligence,
        wisdom: abilities.wisdom,
        charisma: abilities.charisma,
        characterClass: character.data.class || character.data.className,
        level: character.data.level || 1,
        pathCompanionData: JSON.stringify(character.data),
        lastSynced: new Date(),
        updatedAt: new Date()
      })
      .where(eq(characterSheets.id, sheetId))
      .returning();

    const updatedWithModifiers = {
      ...updated,
      modifiers: {
        strength: PlayFabService.calculateModifier(updated.strength),
        dexterity: PlayFabService.calculateModifier(updated.dexterity),
        constitution: PlayFabService.calculateModifier(updated.constitution),
        intelligence: PlayFabService.calculateModifier(updated.intelligence),
        wisdom: PlayFabService.calculateModifier(updated.wisdom),
        charisma: PlayFabService.calculateModifier(updated.charisma)
      }
    };

    res.json(updatedWithModifiers);
  } catch (error) {
    console.error('Failed to sync PathCompanion character:', error);
    res.status(500).json({ 
      error: 'Failed to sync character',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
