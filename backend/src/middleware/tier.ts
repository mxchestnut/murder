import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user has RP tier access
 * Requires isAuthenticated middleware to be called first
 */
export function requireRpTier(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if user has RP tier or admin access
  if (user.subscriptionTier === 'rp' || user.isAdmin) {
    return next();
  }

  return res.status(403).json({
    error: 'RP tier required',
    message: 'This feature requires an RP tier subscription. Upgrade to access prompts, tropes, and advanced RP tools.'
  });
}

/**
 * Helper function to check if a user has RP tier access
 * Used in services and Discord bot
 */
export function hasRpTier(user: { subscriptionTier?: string; isAdmin?: boolean }): boolean {
  return user.subscriptionTier === 'rp' || user.isAdmin === true;
}

/**
 * Get user tier from Discord user ID
 * Returns the user's subscription tier or null if not found
 */
export async function getUserTierFromDiscord(db: any, discordUserId: string): Promise<string | null> {
  const { users } = await import('../db/schema.js');
  const { eq } = await import('drizzle-orm');

  const result = await db
    .select({ subscriptionTier: users.subscriptionTier, isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.discordUserId, discordUserId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  // Admins always have access to all tiers
  if (result[0].isAdmin) {
    return 'rp';
  }

  return result[0].subscriptionTier || 'free';
}
