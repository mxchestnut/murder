import express from 'express';
import { db } from '../db';
import { scenes, sceneMessages } from '../db/schema';
import { eq, desc, sql, and, isNull, isNotNull } from 'drizzle-orm';
import { isAuthenticated } from '../middleware/auth';

const router = express.Router();

// Get all RP scenes with filters
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const {
      guildId,
      channelId,
      location,
      isCombat, // 'true' or 'false'
      status, // 'active' or 'ended'
      limit = '50',
      offset = '0'
    } = req.query;

    let query = db.select().from(scenes);
    const conditions = [];

    // Guild filter
    if (guildId && typeof guildId === 'string') {
      conditions.push(eq(scenes.guildId, guildId));
    }

    // Channel filter
    if (channelId && typeof channelId === 'string') {
      conditions.push(eq(scenes.channelId, channelId));
    }

    // Location filter
    if (location && typeof location === 'string') {
      conditions.push(eq(scenes.location, location));
    }

    // Combat filter
    if (isCombat && typeof isCombat === 'string') {
      conditions.push(eq(scenes.isCombat, isCombat === 'true'));
    }

    // Status filter
    if (status && typeof status === 'string') {
      if (status === 'active') {
        conditions.push(isNull(scenes.endedAt));
      } else if (status === 'ended') {
        conditions.push(isNotNull(scenes.endedAt));
      }
    }

    // Apply filters
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply ordering and pagination
    const limitNum = parseInt(limit as string) || 50;
    const offsetNum = parseInt(offset as string) || 0;

    const allScenes = await query
      .orderBy(desc(scenes.startedAt))
      .limit(limitNum)
      .offset(offsetNum);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(scenes)
      .where(conditions.length > 0 ? and(...conditions) : sql`true`);

    res.json({
      scenes: allScenes,
      pagination: {
        total: count,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + allScenes.length < count
      }
    });
  } catch (error) {
    console.error('Error fetching scenes:', error);
    res.status(500).json({ error: 'Failed to fetch scenes' });
  }
});

// Get scene by ID with messages
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const sceneId = parseInt(id);

    if (isNaN(sceneId)) {
      return res.status(400).json({ error: 'Invalid scene ID' });
    }

    // Get scene
    const [scene] = await db
      .select()
      .from(scenes)
      .where(eq(scenes.id, sceneId))
      .limit(1);

    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    // Get messages for this scene
    const messages = await db
      .select()
      .from(sceneMessages)
      .where(eq(sceneMessages.sceneId, sceneId))
      .orderBy(sceneMessages.timestamp);

    res.json({
      ...scene,
      messages
    });
  } catch (error) {
    console.error('Error fetching scene:', error);
    res.status(500).json({ error: 'Failed to fetch scene' });
  }
});

// Get scene statistics
router.get('/:id/stats', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const sceneId = parseInt(id);

    if (isNaN(sceneId)) {
      return res.status(400).json({ error: 'Invalid scene ID' });
    }

    // Get scene
    const [scene] = await db
      .select()
      .from(scenes)
      .where(eq(scenes.id, sceneId))
      .limit(1);

    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    // Get message statistics
    const [messageStats] = await db
      .select({
        totalMessages: sql<number>`count(*)::int`,
        uniqueParticipants: sql<number>`count(distinct ${sceneMessages.authorId})::int`,
        uniqueCharacters: sql<number>`count(distinct ${sceneMessages.characterName})::int`
      })
      .from(sceneMessages)
      .where(eq(sceneMessages.sceneId, sceneId));

    // Calculate duration
    let duration = null;
    if (scene.endedAt) {
      duration = Math.floor((scene.endedAt.getTime() - scene.startedAt.getTime()) / 1000); // Duration in seconds
    }

    res.json({
      sceneId: scene.id,
      title: scene.title,
      location: scene.location,
      isCombat: scene.isCombat,
      startedAt: scene.startedAt,
      endedAt: scene.endedAt,
      duration,
      statistics: messageStats
    });
  } catch (error) {
    console.error('Error fetching scene stats:', error);
    res.status(500).json({ error: 'Failed to fetch scene statistics' });
  }
});

// Get all unique locations across scenes
router.get('/locations/all', isAuthenticated, async (req, res) => {
  try {
    const { guildId } = req.query;

    // Build where conditions
    const conditions = [isNotNull(scenes.location)];
    if (guildId && typeof guildId === 'string') {
      conditions.push(eq(scenes.guildId, guildId));
    }

    const locations = await db
      .selectDistinct({ location: scenes.location })
      .from(scenes)
      .where(and(...conditions))
      .orderBy(scenes.location);

    res.json({
      locations: locations.map(l => l.location).filter(Boolean)
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

export default router;
