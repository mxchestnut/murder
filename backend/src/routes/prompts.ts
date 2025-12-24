import { Router } from 'express';
import { db } from '../db/index.js';
import { prompts, tropes, promptSchedule } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { ensureAuthenticated } from '../middleware/auth.js';

const router = Router();

// Get all prompts with optional category filter
router.get('/prompts', ensureAuthenticated, async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = db.select().from(prompts);
    
    if (category && category !== 'all') {
      query = query.where(eq(prompts.category, category as string));
    }
    
    const allPrompts = await query.orderBy(desc(prompts.createdAt));
    
    res.json(allPrompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

// Get prompt categories with counts
router.get('/prompts/categories', ensureAuthenticated, async (req, res) => {
  try {
    const categories = await db
      .select({
        category: prompts.category,
        count: sql<number>`count(*)::int`,
        totalUses: sql<number>`sum(${prompts.useCount})::int`
      })
      .from(prompts)
      .groupBy(prompts.category);
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching prompt categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get most popular prompts
router.get('/prompts/popular', ensureAuthenticated, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const popular = await db
      .select()
      .from(prompts)
      .orderBy(desc(prompts.useCount))
      .limit(limit);
    
    res.json(popular);
  } catch (error) {
    console.error('Error fetching popular prompts:', error);
    res.status(500).json({ error: 'Failed to fetch popular prompts' });
  }
});

// Create new prompt (admin only)
router.post('/prompts', ensureAuthenticated, async (req, res) => {
  try {
    const { category, promptText } = req.body;
    
    if (!category || !promptText) {
      return res.status(400).json({ error: 'Category and prompt text required' });
    }
    
    const validCategories = ['character', 'world', 'combat', 'social', 'plot'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const [newPrompt] = await db.insert(prompts).values({
      category,
      promptText,
      createdBy: req.user!.id
    }).returning();
    
    res.json(newPrompt);
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ error: 'Failed to create prompt' });
  }
});

// Update prompt (admin only)
router.put('/prompts/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, promptText } = req.body;
    
    if (!category || !promptText) {
      return res.status(400).json({ error: 'Category and prompt text required' });
    }
    
    const validCategories = ['character', 'world', 'combat', 'social', 'plot'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const [updated] = await db.update(prompts)
      .set({ category, promptText })
      .where(eq(prompts.id, parseInt(id)))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

// Delete prompt (admin only)
router.delete('/prompts/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.delete(prompts)
      .where(eq(prompts.id, parseInt(id)));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
});

// ===== TROPES ROUTES =====

// Get all tropes with optional category filter
router.get('/tropes', ensureAuthenticated, async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = db.select().from(tropes);
    
    if (category && category !== 'all') {
      query = query.where(eq(tropes.category, category as string));
    }
    
    const allTropes = await query.orderBy(desc(tropes.createdAt));
    
    res.json(allTropes);
  } catch (error) {
    console.error('Error fetching tropes:', error);
    res.status(500).json({ error: 'Failed to fetch tropes' });
  }
});

// Get trope categories with counts
router.get('/tropes/categories', ensureAuthenticated, async (req, res) => {
  try {
    const categories = await db
      .select({
        category: tropes.category,
        count: sql<number>`count(*)::int`,
        totalUses: sql<number>`sum(${tropes.useCount})::int`
      })
      .from(tropes)
      .groupBy(tropes.category);
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching trope categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get most popular tropes
router.get('/tropes/popular', ensureAuthenticated, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const popular = await db
      .select()
      .from(tropes)
      .orderBy(desc(tropes.useCount))
      .limit(limit);
    
    res.json(popular);
  } catch (error) {
    console.error('Error fetching popular tropes:', error);
    res.status(500).json({ error: 'Failed to fetch popular tropes' });
  }
});

// Create new trope (admin only)
router.post('/tropes', ensureAuthenticated, async (req, res) => {
  try {
    const { category, name, description } = req.body;
    
    if (!category || !name || !description) {
      return res.status(400).json({ error: 'Category, name, and description required' });
    }
    
    const validCategories = ['archetype', 'dynamic', 'situation', 'plot'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const [newTrope] = await db.insert(tropes).values({
      category,
      name,
      description
    }).returning();
    
    res.json(newTrope);
  } catch (error) {
    console.error('Error creating trope:', error);
    res.status(500).json({ error: 'Failed to create trope' });
  }
});

// Update trope (admin only)
router.put('/tropes/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, name, description } = req.body;
    
    if (!category || !name || !description) {
      return res.status(400).json({ error: 'Category, name, and description required' });
    }
    
    const validCategories = ['archetype', 'dynamic', 'situation', 'plot'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const [updated] = await db.update(tropes)
      .set({ category, name, description })
      .where(eq(tropes.id, parseInt(id)))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: 'Trope not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating trope:', error);
    res.status(500).json({ error: 'Failed to update trope' });
  }
});

// Delete trope (admin only)
router.delete('/tropes/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.delete(tropes)
      .where(eq(tropes.id, parseInt(id)));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting trope:', error);
    res.status(500).json({ error: 'Failed to delete trope' });
  }
});

// ===== SCHEDULE ROUTES =====

// Get prompt schedule
router.get('/prompts/schedule', ensureAuthenticated, async (req, res) => {
  try {
    const schedules = await db.select().from(promptSchedule);
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching prompt schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// Create/update prompt schedule (admin only)
router.post('/prompts/schedule', ensureAuthenticated, async (req, res) => {
  try {
    const { channelId, guildId, scheduleTime, category, enabled } = req.body;
    
    if (!channelId || !guildId || !scheduleTime) {
      return res.status(400).json({ error: 'Channel ID, guild ID, and schedule time required' });
    }
    
    // Upsert schedule
    const [schedule] = await db.insert(promptSchedule).values({
      channelId,
      guildId,
      scheduleTime,
      category: category || null,
      enabled: enabled !== undefined ? enabled : true
    }).onConflictDoUpdate({
      target: promptSchedule.channelId,
      set: {
        scheduleTime,
        category: category || null,
        enabled: enabled !== undefined ? enabled : true
      }
    }).returning();
    
    res.json(schedule);
  } catch (error) {
    console.error('Error creating/updating schedule:', error);
    res.status(500).json({ error: 'Failed to save schedule' });
  }
});

// Delete prompt schedule (admin only)
router.delete('/prompts/schedule/:channelId', ensureAuthenticated, async (req, res) => {
  try {
    const { channelId } = req.params;
    
    await db.delete(promptSchedule)
      .where(eq(promptSchedule.channelId, channelId));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

export default router;
