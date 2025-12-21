import { Router } from 'express';
import { db } from '../db';
import { characterSheets } from '../db/schema';
import { eq } from 'drizzle-orm';
import { isAuthenticated } from '../middleware/auth';
import * as PlayFabService from '../services/playfab';

const router = Router();

// Login endpoint doesn't require Cyarika auth
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
 * Get list of characters from connected PathCompanion account
 * GET /api/pathcompanion/characters
 */
router.get('/characters', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;

    if (!user.pathCompanionSessionTicket) {
      return res.status(400).json({ 
        error: 'No PathCompanion account connected. Please connect your PathCompanion account in Settings first.' 
      });
    }

    // Get user data from PathCompanion
    const userData = await PlayFabService.getUserData(user.pathCompanionSessionTicket);

    // Filter to character entries (character1-99, gm1-99, shared1-99, portraits, etc.)
    const characterKeys = Object.keys(userData)
      .filter(key => 
        /^character\d+$/.test(key) ||  // character1, character2, etc.
        /^gm\d+$/.test(key) ||          // gm1, gm2, etc.
        /^shared\d+$/.test(key)         // shared1, shared2, etc.
      )
      .slice(0, 50); // Limit to 50 characters to avoid performance issues
    
    console.log(`Found ${characterKeys.length} character keys:`, characterKeys);
    
    const allItems = await Promise.all(
      characterKeys.map(async (key) => {
        try {
          const char = await PlayFabService.getCharacter(user.pathCompanionSessionTicket, key);
          
          // GM characters and shared characters are campaigns
          // character1, character2, etc. are player characters
          const isCampaign = /^(gm|shared)\d+$/i.test(key);
          
          return {
            id: key,
            name: char?.characterName || key,
            lastModified: userData[key].LastUpdated || null,
            isCampaign
          };
        } catch (err) {
          console.error(`Failed to get name for ${key}:`, err);
          return null;
        }
      })
    );
    
    // Separate characters and campaigns
    const characterList = allItems.filter(item => item && !item.isCampaign).map(item => ({
      id: item!.id,
      name: item!.name,
      lastModified: item!.lastModified
    }));
    
    const campaignList = allItems.filter(item => item && item.isCampaign).map(item => ({
      id: item!.id,
      name: item!.name,
      lastModified: item!.lastModified
    }));
    
    console.log(`Separated into ${characterList.length} characters and ${campaignList.length} campaigns`);

    res.json({ 
      characters: characterList,
      campaigns: campaignList
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
 * Import a character from a share key
 * POST /api/pathcompanion/character/share
 * Body: { shareKey }
 */
router.post('/character/share', async (req, res) => {
  try {
    const { shareKey } = req.body;
    
    if (!shareKey) {
      return res.status(400).json({ error: 'Share key required' });
    }

    const character = await PlayFabService.getCharacterFromShareKey(shareKey);
    res.json({ character });
  } catch (error) {
    console.error('Failed to get shared character:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get character' });
  }
});

/**
 * Import a PathCompanion character
 * POST /api/pathcompanion/import
 * Body: { characterId } - uses stored PathCompanion session
 * Requires Cyarika authentication AND PathCompanion account connection
 */
router.post('/import', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const userId = user.id;
    const { characterId } = req.body;

    if (!characterId) {
      return res.status(400).json({ error: 'Character ID is required' });
    }

    // Check if user has connected PathCompanion account
    if (!user.pathCompanionSessionTicket) {
      return res.status(400).json({ 
        error: 'No PathCompanion account connected. Please connect your PathCompanion account in Settings first.' 
      });
    }

    // Fetch the character from PathCompanion using stored session ticket
    const character = await PlayFabService.getCharacter(user.pathCompanionSessionTicket, characterId);

    if (!character) {
      return res.status(404).json({ error: 'Character not found in PathCompanion' });
    }

    // Extract ability scores
    const abilities = PlayFabService.extractAbilityScores(character.data);
    const level = PlayFabService.extractCharacterLevel(character.data);
    const combatStats = PlayFabService.extractCombatStats(character.data);
    const saves = PlayFabService.extractSavingThrows(character.data);
    const basicInfo = PlayFabService.extractBasicInfo(character.data);
    const skills = PlayFabService.extractSkills(character.data);
    const feats = PlayFabService.extractFeats(character.data);
    const specialAbilities = PlayFabService.extractSpecialAbilities(character.data);
    const weapons = PlayFabService.extractWeapons(character.data);
    const armor = PlayFabService.extractArmor(character.data);
    const spells = PlayFabService.extractSpells(character.data);

    console.log(`Extracted data for ${character.characterName}:`, {
      abilities,
      level,
      combatStats,
      saves,
      skillsCount: Object.keys(skills).length,
      featsCount: feats.length,
      weaponsCount: weapons.length
    });

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
          level: level,
          race: basicInfo.race,
          alignment: basicInfo.alignment,
          deity: basicInfo.deity,
          size: basicInfo.size,
          currentHp: combatStats.currentHp,
          maxHp: combatStats.maxHp,
          tempHp: combatStats.tempHp,
          armorClass: combatStats.armorClass,
          touchAc: combatStats.touchAc,
          flatFootedAc: combatStats.flatFootedAc,
          initiative: combatStats.initiative,
          speed: combatStats.speed,
          baseAttackBonus: combatStats.baseAttackBonus,
          cmb: combatStats.cmb,
          cmd: combatStats.cmd,
          fortitudeSave: saves.fortitudeSave,
          reflexSave: saves.reflexSave,
          willSave: saves.willSave,
          skills: JSON.stringify(skills),
          feats: JSON.stringify(feats),
          specialAbilities: JSON.stringify(specialAbilities),
          weapons: JSON.stringify(weapons),
          armor: JSON.stringify(armor),
          spells: JSON.stringify(spells),
          pathCompanionData: JSON.stringify(character.data),
          pathCompanionSession: user.pathCompanionSessionTicket,
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
        level: level,
        race: basicInfo.race,
        alignment: basicInfo.alignment,
        deity: basicInfo.deity,
        size: basicInfo.size,
        currentHp: combatStats.currentHp,
        maxHp: combatStats.maxHp,
        tempHp: combatStats.tempHp,
        armorClass: combatStats.armorClass,
        touchAc: combatStats.touchAc,
        flatFootedAc: combatStats.flatFootedAc,
        initiative: combatStats.initiative,
        speed: combatStats.speed,
        baseAttackBonus: combatStats.baseAttackBonus,
        cmb: combatStats.cmb,
        cmd: combatStats.cmd,
        fortitudeSave: saves.fortitudeSave,
        reflexSave: saves.reflexSave,
        willSave: saves.willSave,
        skills: JSON.stringify(skills),
        feats: JSON.stringify(feats),
        specialAbilities: JSON.stringify(specialAbilities),
        weapons: JSON.stringify(weapons),
        armor: JSON.stringify(armor),
        spells: JSON.stringify(spells),
        isPathCompanion: true,
        pathCompanionId: characterId,
        pathCompanionData: JSON.stringify(character.data),
        pathCompanionSession: user.pathCompanionSessionTicket,
        lastSynced: new Date()
      }).returning();
    }

    // Add computed modifiers and parse JSON fields
    const sheetWithModifiers = {
      ...sheet,
      skills: sheet.skills ? JSON.parse(sheet.skills) : {},
      weapons: sheet.weapons ? JSON.parse(sheet.weapons) : [],
      armor: sheet.armor ? JSON.parse(sheet.armor) : {},
      feats: sheet.feats ? JSON.parse(sheet.feats) : [],
      specialAbilities: sheet.specialAbilities ? JSON.parse(sheet.specialAbilities) : [],
      spells: sheet.spells ? JSON.parse(sheet.spells) : {},
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
    const level = PlayFabService.extractCharacterLevel(character.data);
    const combatStats = PlayFabService.extractCombatStats(character.data);
    const saves = PlayFabService.extractSavingThrows(character.data);
    const basicInfo = PlayFabService.extractBasicInfo(character.data);
    const skills = PlayFabService.extractSkills(character.data);
    const feats = PlayFabService.extractFeats(character.data);
    const specialAbilities = PlayFabService.extractSpecialAbilities(character.data);
    const weapons = PlayFabService.extractWeapons(character.data);
    const armor = PlayFabService.extractArmor(character.data);
    const spells = PlayFabService.extractSpells(character.data);

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
        level: level,
        race: basicInfo.race,
        alignment: basicInfo.alignment,
        deity: basicInfo.deity,
        size: basicInfo.size,
        currentHp: combatStats.currentHp,
        maxHp: combatStats.maxHp,
        tempHp: combatStats.tempHp,
        armorClass: combatStats.armorClass,
        touchAc: combatStats.touchAc,
        flatFootedAc: combatStats.flatFootedAc,
        initiative: combatStats.initiative,
        speed: combatStats.speed,
        baseAttackBonus: combatStats.baseAttackBonus,
        cmb: combatStats.cmb,
        cmd: combatStats.cmd,
        fortitudeSave: saves.fortitudeSave,
        reflexSave: saves.reflexSave,
        willSave: saves.willSave,
        skills: JSON.stringify(skills),
        feats: JSON.stringify(feats),
        specialAbilities: JSON.stringify(specialAbilities),
        weapons: JSON.stringify(weapons),
        armor: JSON.stringify(armor),
        spells: JSON.stringify(spells),
        pathCompanionData: JSON.stringify(character.data),
        lastSynced: new Date(),
        updatedAt: new Date()
      })
      .where(eq(characterSheets.id, sheetId))
      .returning();

    const updatedWithModifiers = {
      ...updated,
      skills: updated.skills ? JSON.parse(updated.skills) : {},
      weapons: updated.weapons ? JSON.parse(updated.weapons) : [],
      armor: updated.armor ? JSON.parse(updated.armor) : {},
      feats: updated.feats ? JSON.parse(updated.feats) : [],
      specialAbilities: updated.specialAbilities ? JSON.parse(updated.specialAbilities) : [],
      spells: updated.spells ? JSON.parse(updated.spells) : {},
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
