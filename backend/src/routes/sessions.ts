import express from 'express';
import { db } from '../db';
import { sessions, sessionMessages } from '../db/schema';
import { eq, desc, sql, and, isNull, isNotNull } from 'drizzle-orm';
import { isAuthenticated } from '../middleware/auth';

const router = express.Router();

// Get all RP sessions with filters
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const {
      guildId,
      channelId,
      status, // 'active', 'ended', 'paused'
      limit = '50',
      offset = '0'
    } = req.query;

    let query = db.select().from(sessions);
    const conditions = [];

    // Guild filter
    if (guildId && typeof guildId === 'string') {
      conditions.push(eq(sessions.guildId, guildId));
    }

    // Channel filter
    if (channelId && typeof channelId === 'string') {
      conditions.push(eq(sessions.channelId, channelId));
    }

    // Status filter
    if (status && typeof status === 'string') {
      if (status === 'active') {
        conditions.push(isNull(sessions.endedAt));
        conditions.push(eq(sessions.isPaused, false));
      } else if (status === 'ended') {
        conditions.push(isNotNull(sessions.endedAt));
      } else if (status === 'paused') {
        conditions.push(eq(sessions.isPaused, true));
      }
    }

    // Apply filters
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply ordering and pagination
    const limitNum = parseInt(limit as string) || 50;
    const offsetNum = parseInt(offset as string) || 0;

    const allSessions = await query
      .orderBy(desc(sessions.startedAt))
      .limit(limitNum)
      .offset(offsetNum);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sessions)
      .where(conditions.length > 0 ? and(...conditions) : sql`true`);

    res.json({
      sessions: allSessions,
      pagination: {
        total: count,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + allSessions.length < count
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get session by ID with messages
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    // Get session
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get messages for this session
    const messages = await db
      .select()
      .from(sessionMessages)
      .where(eq(sessionMessages.sessionId, sessionId))
      .orderBy(sessionMessages.timestamp);

    res.json({
      ...session,
      messages
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Get session statistics
router.get('/:id/stats', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    // Get session
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get message statistics
    const [messageStats] = await db
      .select({
        totalMessages: sql<number>`count(*)::int`,
        totalDiceRolls: sql<number>`count(*) filter (where ${sessionMessages.isDiceRoll})::int`,
        uniqueParticipants: sql<number>`count(distinct ${sessionMessages.authorId})::int`,
        uniqueCharacters: sql<number>`count(distinct ${sessionMessages.characterName})::int`
      })
      .from(sessionMessages)
      .where(eq(sessionMessages.sessionId, sessionId));

    // Calculate duration
    let duration = null;
    if (session.endedAt) {
      duration = Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000); // Duration in seconds
    }

    res.json({
      sessionId: session.id,
      title: session.title,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      isPaused: session.isPaused,
      duration,
      statistics: messageStats
    });
  } catch (error) {
    console.error('Error fetching session stats:', error);
    res.status(500).json({ error: 'Failed to fetch session statistics' });
  }
});

export default router;
