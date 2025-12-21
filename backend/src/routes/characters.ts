import { Router } from 'express';
import { db } from '../db';
import { characterSheets } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { isAuthenticated } from '../middleware/auth';

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

    // Add computed modifiers to each sheet
    const sheetsWithModifiers = sheets.map(sheet => ({
      ...sheet,
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

    // Add computed modifiers
    const sheetWithModifiers = {
      ...sheet,
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
      level = 1
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
      level
    }).returning();

    // Add computed modifiers
    const sheetWithModifiers = {
      ...newSheet,
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
      level
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
        updatedAt: new Date()
      })
      .where(eq(characterSheets.id, sheetId))
      .returning();

    // Add computed modifiers
    const sheetWithModifiers = {
      ...updatedSheet,
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
    const { stat } = req.body; // stat should be 'strength', 'dexterity', etc.

    if (!stat) {
      return res.status(400).json({ error: 'Stat name is required' });
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

    // Get the stat value
    const validStats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    if (!validStats.includes(stat)) {
      return res.status(400).json({ error: 'Invalid stat name' });
    }

    const statValue = sheet[stat as keyof typeof sheet] as number;
    const modifier = calculateModifier(statValue);
    
    // Roll d20
    const diceRoll = Math.floor(Math.random() * 20) + 1;
    const total = diceRoll + modifier;

    // Prepare Discord message
    const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
    const message = {
      content: `🎲 **${username}** rolled for **${sheet.name}**'s **${stat.toUpperCase()}**\n` +
               `Roll: ${diceRoll} ${modifierStr} = **${total}**`
    };

    // Send to Discord if webhook is configured
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (discordWebhookUrl) {
      try {
        const response = await fetch(discordWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });

        if (!response.ok) {
          console.error('Failed to send to Discord:', await response.text());
        }
      } catch (error) {
        console.error('Error sending to Discord:', error);
        // Continue anyway - we'll still return the roll result
      }
    } else {
      console.warn('DISCORD_WEBHOOK_URL not configured - skipping Discord notification');
    }

    res.json({
      character: sheet.name,
      stat,
      statValue,
      modifier,
      diceRoll,
      total,
      sentToDiscord: !!discordWebhookUrl
    });
  } catch (error) {
    console.error('Error rolling dice:', error);
    res.status(500).json({ error: 'Failed to roll dice' });
  }
});

export default router;
