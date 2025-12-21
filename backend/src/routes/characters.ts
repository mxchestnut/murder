import { Router } from 'express';
import { db } from '../db';
import { characterSheets, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { isAuthenticated } from '../middleware/auth';
import { sendRollToDiscord } from '../services/discordBot';

const router = Router();

// All routes require authentication
router.use(isAuthenticated);

// Helper function to calculate D&D modifier from stat
const calculateModifier = (stat: number): number => {
  return Math.floor((stat - 10) / 2);
};

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
      avatarUrl
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

export default router;
