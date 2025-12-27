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

/**
 * Check if a Discord guild has access to premium features (Write Pretend bot)
 * Returns true if the guild owner or any admin member has an active RP subscription
 */
export async function checkGuildPremiumAccess(db: any, guild: any): Promise<{ hasAccess: boolean; reason?: string }> {
  try {
    const { users } = await import('../db/schema.js');
    const { eq, or, and } = await import('drizzle-orm');

    // Get guild owner
    const ownerId = guild.ownerId;

    // Check if owner has RP tier
    const ownerTier = await getUserTierFromDiscord(db, ownerId);
    if (ownerTier === 'rp') {
      return { hasAccess: true };
    }

    // If owner doesn't have it, check if any admins have RP tier
    // Note: This requires fetching members, which we'll do in the bot itself
    // For now, we'll just check the owner
    return {
      hasAccess: false,
      reason: 'Server owner needs an active RP subscription at my1e.party to use Write Pretend bot features.'
    };

  } catch (error) {
    console.error('Error checking guild premium access:', error);
    return { hasAccess: false, reason: 'Error verifying subscription status.' };
  }
}
