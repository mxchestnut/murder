import { Router } from 'express';
import { db } from '../db';
import { characterSheets, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { isAuthenticated } from '../middleware/auth';
import { sendRollToDiscord } from '../services/discordBot';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Serve avatar files (public - no authentication required for Discord webhooks)
router.get('/avatars/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, '../../uploads/avatars', filename);

  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).json({ error: 'Avatar not found' });
  }
});

// All other routes require authentication
router.use(isAuthenticated);

// Helper function to calculate D&D modifier from stat
const calculateModifier = (stat: number): number => {
  return Math.floor((stat - 10) / 2);
};

// Avatar upload endpoint
router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    console.log('Avatar upload request received');
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);

    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the URL to access the uploaded file
    const avatarUrl = `/api/characters/avatars/${req.file.filename}`;
    console.log('Avatar uploaded successfully:', avatarUrl);
    res.json({ url: avatarUrl });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Get all character sheets for the current user
router.get('/', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const sheets = await db.select().from(characterSheets).where(
      eq(characterSheets.userId, userId)
    );

    // Add computed modifiers and parse JSON fields
    const sheetsWithModifiers = sheets.map(sheet => ({
      ...sheet,
      skills: sheet.skills ? JSON.parse(sheet.skills) : {},
      weapons: sheet.weapons ? JSON.parse(sheet.weapons) : [],
      armor: sheet.armor ? JSON.parse(sheet.armor) : {},
      feats: sheet.feats ? JSON.parse(sheet.feats) : [],
      specialAbilities: sheet.specialAbilities ? JSON.parse(sheet.specialAbilities) : [],
      spells: sheet.spells ? JSON.parse(sheet.spells) : {},
      modifiers: {
        strength: calculateModifier(sheet.strength),
        dexterity: calculateModifier(sheet.dexterity),
        constitution: calculateModifier(sheet.constitution),
        intelligence: calculateModifier(sheet.intelligence),
        wisdom: calculateModifier(sheet.wisdom),
        charisma: calculateModifier(sheet.charisma)
      }
    }));

    res.json(sheetsWithModifiers);
  } catch (error) {
    console.error('Error fetching character sheets:', error);
    res.status(500).json({ error: 'Failed to fetch character sheets' });
  }
});

// Get a specific character sheet
router.get('/:id', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const sheetId = parseInt(req.params.id);

    const [sheet] = await db.select().from(characterSheets).where(
      and(
        eq(characterSheets.id, sheetId),
        eq(characterSheets.userId, userId)
      )
    );

    if (!sheet) {
      return res.status(404).json({ error: 'Character sheet not found' });
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
        strength: calculateModifier(sheet.strength),
        dexterity: calculateModifier(sheet.dexterity),
        constitution: calculateModifier(sheet.constitution),
        intelligence: calculateModifier(sheet.intelligence),
        wisdom: calculateModifier(sheet.wisdom),
        charisma: calculateModifier(sheet.charisma)
      }
    };

    res.json(sheetWithModifiers);
  } catch (error) {
    console.error('Error fetching character sheet:', error);
    res.status(500).json({ error: 'Failed to fetch character sheet' });
  }
});

// Create a new character sheet
router.post('/', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const {
      name,
      strength = 10,
      dexterity = 10,
      constitution = 10,
      intelligence = 10,
      wisdom = 10,
      charisma = 10,
      characterClass,
      level = 1,
      race,
      alignment,
      deity,
      size = 'Medium',
      currentHp = 0,
      maxHp = 0,
      tempHp = 0,
      armorClass = 10,
      touchAc = 10,
      flatFootedAc = 10,
      initiative = 0,
      speed = 30,
      baseAttackBonus = 0,
      cmb = 0,
      cmd = 10,
      fortitudeSave = 0,
      reflexSave = 0,
      willSave = 0,
      skills,
      weapons,
      armor,
      feats,
      specialAbilities,
      spells,
      avatarUrl
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Character name is required' });
    }

    const [newSheet] = await db.insert(characterSheets).values({
      userId,
      name,
      strength,
      dexterity,
      constitution,
      intelligence,
      wisdom,
      charisma,
      characterClass,
      level,
      race,
      alignment,
      deity,
      size,
      currentHp,
      maxHp,
      tempHp,
      armorClass,
      touchAc,
      flatFootedAc,
      initiative,
      speed,
      baseAttackBonus,
      cmb,
      cmd,
      fortitudeSave,
      reflexSave,
      willSave,
      skills: skills ? JSON.stringify(skills) : null,
      weapons: weapons ? JSON.stringify(weapons) : null,
      armor: armor ? JSON.stringify(armor) : null,
      feats: feats ? JSON.stringify(feats) : null,
      specialAbilities: specialAbilities ? JSON.stringify(specialAbilities) : null,
      spells: spells ? JSON.stringify(spells) : null,
      avatarUrl: avatarUrl || null
    }).returning();

    // Add computed modifiers and parse JSON fields
    const sheetWithModifiers = {
      ...newSheet,
      skills: newSheet.skills ? JSON.parse(newSheet.skills) : {},
      weapons: newSheet.weapons ? JSON.parse(newSheet.weapons) : [],
      armor: newSheet.armor ? JSON.parse(newSheet.armor) : {},
      feats: newSheet.feats ? JSON.parse(newSheet.feats) : [],
      specialAbilities: newSheet.specialAbilities ? JSON.parse(newSheet.specialAbilities) : [],
      spells: newSheet.spells ? JSON.parse(newSheet.spells) : {},
      modifiers: {
        strength: calculateModifier(newSheet.strength),
        dexterity: calculateModifier(newSheet.dexterity),
        constitution: calculateModifier(newSheet.constitution),
        intelligence: calculateModifier(newSheet.intelligence),
        wisdom: calculateModifier(newSheet.wisdom),
        charisma: calculateModifier(newSheet.charisma)
      }
    };

    res.status(201).json(sheetWithModifiers);
  } catch (error) {
    console.error('Error creating character sheet:', error);
    res.status(500).json({ error: 'Failed to create character sheet' });
  }
});

// Update a character sheet
router.put('/:id', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const sheetId = parseInt(req.params.id);

    // Verify ownership
    const [existing] = await db.select().from(characterSheets).where(
      and(
        eq(characterSheets.id, sheetId),
        eq(characterSheets.userId, userId)
      )
    );

    if (!existing) {
      return res.status(404).json({ error: 'Character sheet not found' });
    }

    const {
      name,
      strength,
      dexterity,
      constitution,
      intelligence,
      wisdom,
      charisma,
      characterClass,
      level,
      race,
      alignment,
      deity,
      size,
      currentHp,
      maxHp,
      tempHp,
      armorClass,
      touchAc,
      flatFootedAc,
      initiative,
      speed,
      baseAttackBonus,
      cmb,
      cmd,
      fortitudeSave,
      reflexSave,
      willSave,
      skills,
      weapons,
      armor,
      feats,
      specialAbilities,
      spells,
      avatarUrl,
      // Basic Identity
      fullName,
      titles,
      species,
      ageDescription,
      culturalBackground,
      pronouns,
      genderIdentity,
      sexuality,
      occupation,
      currentLocation,
      // Goals & Motivations
      currentGoal,
      longTermDesire,
      coreMotivation,
      deepestFear,
      coreBelief,
      coreMisconception,
      moralCode,
      alignmentTendency,
      // Personality
      personalityOneSentence,
      keyVirtues,
      keyFlaws,
      stressBehavior,
      habitsOrTells,
      speechStyle,
      // Appearance
      physicalPresence,
      identifyingTraits,
      clothingAesthetic,
      // Skills & Abilities
      notableEquipment,
      skillsReliedOn,
      skillsAvoided,
      // Backstory (Markdown)
      origin,
      greatestSuccess,
      greatestFailure,
      regret,
      trauma,
      // Relationships (Markdown)
      importantRelationships,
      protectedRelationship,
      avoidedRelationship,
      rival,
      affiliatedGroups,
      // Beliefs
      beliefsPhilosophy,
      // Public vs Private
      publicFacade,
      hiddenAspect,
      secret,
      // Growth & Change (Markdown)
      recentChange,
      potentialChange,
      breakingPoint,
      redemption,
      // Legacy
      symbolOrMotif,
      legacy,
      rememberedAs
    } = req.body;

    const [updatedSheet] = await db.update(characterSheets)
      .set({
        ...(name !== undefined && { name }),
        ...(strength !== undefined && { strength }),
        ...(dexterity !== undefined && { dexterity }),
        ...(constitution !== undefined && { constitution }),
        ...(intelligence !== undefined && { intelligence }),
        ...(wisdom !== undefined && { wisdom }),
        ...(charisma !== undefined && { charisma }),
        ...(characterClass !== undefined && { characterClass }),
        ...(level !== undefined && { level }),
        ...(race !== undefined && { race }),
        ...(alignment !== undefined && { alignment }),
        ...(deity !== undefined && { deity }),
        ...(size !== undefined && { size }),
        ...(currentHp !== undefined && { currentHp }),
        ...(maxHp !== undefined && { maxHp }),
        ...(tempHp !== undefined && { tempHp }),
        ...(armorClass !== undefined && { armorClass }),
        ...(touchAc !== undefined && { touchAc }),
        ...(flatFootedAc !== undefined && { flatFootedAc }),
        ...(initiative !== undefined && { initiative }),
        ...(speed !== undefined && { speed }),
        ...(baseAttackBonus !== undefined && { baseAttackBonus }),
        ...(cmb !== undefined && { cmb }),
        ...(cmd !== undefined && { cmd }),
        ...(fortitudeSave !== undefined && { fortitudeSave }),
        ...(reflexSave !== undefined && { reflexSave }),
        ...(willSave !== undefined && { willSave }),
        ...(skills !== undefined && { skills: JSON.stringify(skills) }),
        ...(weapons !== undefined && { weapons: JSON.stringify(weapons) }),
        ...(armor !== undefined && { armor: JSON.stringify(armor) }),
        ...(feats !== undefined && { feats: JSON.stringify(feats) }),
        ...(specialAbilities !== undefined && { specialAbilities: JSON.stringify(specialAbilities) }),
        ...(spells !== undefined && { spells: JSON.stringify(spells) }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        // Basic Identity
        ...(fullName !== undefined && { fullName }),
        ...(titles !== undefined && { titles }),
        ...(species !== undefined && { species }),
        ...(ageDescription !== undefined && { ageDescription }),
        ...(culturalBackground !== undefined && { culturalBackground }),
        ...(pronouns !== undefined && { pronouns }),
        ...(genderIdentity !== undefined && { genderIdentity }),
        ...(sexuality !== undefined && { sexuality }),
        ...(occupation !== undefined && { occupation }),
        ...(currentLocation !== undefined && { currentLocation }),
        // Goals & Motivations
        ...(currentGoal !== undefined && { currentGoal }),
        ...(longTermDesire !== undefined && { longTermDesire }),
        ...(coreMotivation !== undefined && { coreMotivation }),
        ...(deepestFear !== undefined && { deepestFear }),
        ...(coreBelief !== undefined && { coreBelief }),
        ...(coreMisconception !== undefined && { coreMisconception }),
        ...(moralCode !== undefined && { moralCode }),
        ...(alignmentTendency !== undefined && { alignmentTendency }),
        // Personality
        ...(personalityOneSentence !== undefined && { personalityOneSentence }),
        ...(keyVirtues !== undefined && { keyVirtues }),
        ...(keyFlaws !== undefined && { keyFlaws }),
        ...(stressBehavior !== undefined && { stressBehavior }),
        ...(habitsOrTells !== undefined && { habitsOrTells }),
        ...(speechStyle !== undefined && { speechStyle }),
        // Appearance
        ...(physicalPresence !== undefined && { physicalPresence }),
        ...(identifyingTraits !== undefined && { identifyingTraits }),
        ...(clothingAesthetic !== undefined && { clothingAesthetic }),
        // Skills & Abilities
        ...(notableEquipment !== undefined && { notableEquipment }),
        ...(skillsReliedOn !== undefined && { skillsReliedOn }),
        ...(skillsAvoided !== undefined && { skillsAvoided }),
        // Backstory (Markdown)
        ...(origin !== undefined && { origin }),
        ...(greatestSuccess !== undefined && { greatestSuccess }),
        ...(greatestFailure !== undefined && { greatestFailure }),
        ...(regret !== undefined && { regret }),
        ...(trauma !== undefined && { trauma }),
        // Relationships (Markdown)
        ...(importantRelationships !== undefined && { importantRelationships }),
        ...(protectedRelationship !== undefined && { protectedRelationship }),
        ...(avoidedRelationship !== undefined && { avoidedRelationship }),
        ...(rival !== undefined && { rival }),
        ...(affiliatedGroups !== undefined && { affiliatedGroups }),
        // Beliefs
        ...(beliefsPhilosophy !== undefined && { beliefsPhilosophy }),
        // Public vs Private
        ...(publicFacade !== undefined && { publicFacade }),
        ...(hiddenAspect !== undefined && { hiddenAspect }),
        ...(secret !== undefined && { secret }),
        // Growth & Change (Markdown)
        ...(recentChange !== undefined && { recentChange }),
        ...(potentialChange !== undefined && { potentialChange }),
        ...(breakingPoint !== undefined && { breakingPoint }),
        ...(redemption !== undefined && { redemption }),
        // Legacy
        ...(symbolOrMotif !== undefined && { symbolOrMotif }),
        ...(legacy !== undefined && { legacy }),
        ...(rememberedAs !== undefined && { rememberedAs }),
        updatedAt: new Date()
      })
      .where(eq(characterSheets.id, sheetId))
      .returning();

    // Add computed modifiers and parse JSON fields
    const sheetWithModifiers = {
      ...updatedSheet,
      skills: updatedSheet.skills ? JSON.parse(updatedSheet.skills) : {},
      weapons: updatedSheet.weapons ? JSON.parse(updatedSheet.weapons) : [],
      armor: updatedSheet.armor ? JSON.parse(updatedSheet.armor) : {},
      feats: updatedSheet.feats ? JSON.parse(updatedSheet.feats) : [],
      specialAbilities: updatedSheet.specialAbilities ? JSON.parse(updatedSheet.specialAbilities) : [],
      spells: updatedSheet.spells ? JSON.parse(updatedSheet.spells) : {},
      modifiers: {
        strength: calculateModifier(updatedSheet.strength),
        dexterity: calculateModifier(updatedSheet.dexterity),
        constitution: calculateModifier(updatedSheet.constitution),
        intelligence: calculateModifier(updatedSheet.intelligence),
        wisdom: calculateModifier(updatedSheet.wisdom),
        charisma: calculateModifier(updatedSheet.charisma)
      }
    };

    res.json(sheetWithModifiers);
  } catch (error) {
    console.error('Error updating character sheet:', error);
    res.status(500).json({ error: 'Failed to update character sheet' });
  }
});

// Delete a character sheet
router.delete('/:id', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const sheetId = parseInt(req.params.id);

    // Verify ownership
    const [existing] = await db.select().from(characterSheets).where(
      and(
        eq(characterSheets.id, sheetId),
        eq(characterSheets.userId, userId)
      )
    );

    if (!existing) {
      return res.status(404).json({ error: 'Character sheet not found' });
    }

    await db.delete(characterSheets).where(eq(characterSheets.id, sheetId));

    res.json({ message: 'Character sheet deleted successfully' });
  } catch (error) {
    console.error('Error deleting character sheet:', error);
    res.status(500).json({ error: 'Failed to delete character sheet' });
  }
});

// Roll dice and send to Discord
router.post('/:id/roll', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const username = (req.user as any).username;
    const sheetId = parseInt(req.params.id);
    const { stat, rollType, skillName } = req.body;
    // stat: 'strength', 'dexterity', etc.
    // rollType: 'ability', 'save', 'skill', 'attack', 'advantage', 'disadvantage'
    // skillName: for skill checks

    if (!stat && !skillName) {
      return res.status(400).json({ error: 'Stat name or skill name is required' });
    }

    // Get the character sheet
    const [sheet] = await db.select().from(characterSheets).where(
      and(
        eq(characterSheets.id, sheetId),
        eq(characterSheets.userId, userId)
      )
    );

    if (!sheet) {
      return res.status(404).json({ error: 'Character sheet not found' });
    }

    // Get user's Discord webhook
    const [user] = await db.select({ botToken: users.discordBotToken }).from(users).where(eq(users.id, userId));
    const hasBotToken = !!user?.botToken;

    let diceRoll: number;
    let total: number;
    let modifier: number = 0;
    let rollDescription: string;

    // Handle different roll types
    if (rollType === 'advantage' || rollType === 'disadvantage') {
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      diceRoll = rollType === 'advantage' ? Math.max(roll1, roll2) : Math.min(roll1, roll2);

      if (stat) {
        const validStats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        if (!validStats.includes(stat)) {
          return res.status(400).json({ error: 'Invalid stat name' });
        }
        const statValue = sheet[stat as keyof typeof sheet] as number;
        modifier = calculateModifier(statValue);
      }

      total = diceRoll + modifier;
      rollDescription = `${rollType === 'advantage' ? 'Advantage' : 'Disadvantage'} (${roll1}, ${roll2})`;
    } else if (rollType === 'skill' && skillName) {
      // Skill check
      diceRoll = Math.floor(Math.random() * 20) + 1;
      const skills = sheet.skills ? JSON.parse(sheet.skills) : {};
      const skillData = skills[skillName];
      modifier = skillData ? (skillData.total || 0) : 0;
      total = diceRoll + modifier;
      rollDescription = `${skillName} check`;
    } else if (rollType === 'save') {
      // Saving throw
      diceRoll = Math.floor(Math.random() * 20) + 1;
      const saveMap: { [key: string]: keyof typeof sheet } = {
        'fortitude': 'fortitudeSave',
        'reflex': 'reflexSave',
        'will': 'willSave'
      };
      const saveKey = saveMap[stat];
      modifier = saveKey ? (sheet[saveKey] as number || 0) : 0;
      total = diceRoll + modifier;
      rollDescription = `${stat.charAt(0).toUpperCase() + stat.slice(1)} save`;
    } else {
      // Standard ability check or attack
      diceRoll = Math.floor(Math.random() * 20) + 1;

      if (stat) {
        const validStats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        if (!validStats.includes(stat)) {
          return res.status(400).json({ error: 'Invalid stat name' });
        }
        const statValue = sheet[stat as keyof typeof sheet] as number;
        modifier = calculateModifier(statValue);
      }

      total = diceRoll + modifier;
      rollDescription = stat ? `${stat.toUpperCase()} check` : 'Check';
    }

    // Send to Discord via bot if configured
    let sentToDiscord = false;
    if (hasBotToken) {
      try {
        const rollData = {
          rollDescription,
          diceRoll,
          modifier,
          total
        };
        sentToDiscord = await sendRollToDiscord(sheetId, rollData);
      } catch (error) {
        console.error('Error sending to Discord via bot:', error);
      }
    }

    res.json({
      character: sheet.name,
      stat,
      skillName,
      rollType,
      rollDescription,
      modifier,
      diceRoll,
      total,
      sentToDiscord
    });
  } catch (error) {
    console.error('Error rolling dice:', error);
    res.status(500).json({ error: 'Failed to roll dice' });
  }
});

// Link an existing character to PathCompanion and sync data
router.post('/:id/link-pathcompanion', async (req, res) => {
  try {
    const sheetId = parseInt(req.params.id);
    const { pathCompanionCharacterId } = req.body;
    const userId = (req.user as any).id;

    if (!pathCompanionCharacterId) {
      return res.status(400).json({ error: 'PathCompanion character ID is required' });
    }

    // Get the character sheet
    const sheets = await db.select().from(characterSheets).where(
      and(
        eq(characterSheets.id, sheetId),
        eq(characterSheets.userId, userId)
      )
    );

    if (sheets.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Get user's PathCompanion session
    const userRecords = await db.select().from(users).where(eq(users.id, userId));
    if (userRecords.length === 0 || !userRecords[0].pathCompanionSessionTicket) {
      return res.status(400).json({
        error: 'PathCompanion session not found. Please log in to PathCompanion first.'
      });
    }

    const sessionTicket = userRecords[0].pathCompanionSessionTicket;

    // Import PathCompanion data (using existing logic from pathcompanion routes)
    const PlayFabService = require('../services/playfab');
    const character = await PlayFabService.getCharacter(sessionTicket, pathCompanionCharacterId);

    if (!character) {
      return res.status(404).json({ error: 'PathCompanion character not found' });
    }

    // Extract all data
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

    // Update the character with PathCompanion data
    await db.update(characterSheets)
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
        avatarUrl: basicInfo.avatarUrl || sheets[0].avatarUrl, // Keep existing avatar if PathCompanion doesn't have one
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
        pathCompanionSession: sessionTicket,
        pathCompanionId: pathCompanionCharacterId,
        isPathCompanion: true,
        lastSynced: new Date(),
        updatedAt: new Date()
      })
      .where(eq(characterSheets.id, sheetId));

    // Fetch and return updated character
    const updated = await db.select().from(characterSheets).where(
      eq(characterSheets.id, sheetId)
    );

    const updatedSheet = {
      ...updated[0],
      skills: updated[0].skills ? JSON.parse(updated[0].skills) : {},
      weapons: updated[0].weapons ? JSON.parse(updated[0].weapons) : [],
      armor: updated[0].armor ? JSON.parse(updated[0].armor) : {},
      feats: updated[0].feats ? JSON.parse(updated[0].feats) : [],
      specialAbilities: updated[0].specialAbilities ? JSON.parse(updated[0].specialAbilities) : [],
      spells: updated[0].spells ? JSON.parse(updated[0].spells) : {},
      modifiers: {
        strength: calculateModifier(updated[0].strength),
        dexterity: calculateModifier(updated[0].dexterity),
        constitution: calculateModifier(updated[0].constitution),
        intelligence: calculateModifier(updated[0].intelligence),
        wisdom: calculateModifier(updated[0].wisdom),
        charisma: calculateModifier(updated[0].charisma)
      }
    };

    res.json(updatedSheet);
  } catch (error) {
    console.error('Error linking to PathCompanion:', error);
    res.status(500).json({ error: 'Failed to link character to PathCompanion' });
  }
});

export default router;
