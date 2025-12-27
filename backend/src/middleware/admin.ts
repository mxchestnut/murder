import { Request, Response, NextFunction } from 'express';

// Middleware to check if user is an admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  console.log('[ADMIN MIDDLEWARE] isAuthenticated:', req.isAuthenticated());
  console.log('[ADMIN MIDDLEWARE] user:', req.user);

  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = req.user as any;
  console.log('[ADMIN MIDDLEWARE] user.isAdmin:', user.isAdmin);
  console.log('[ADMIN MIDDLEWARE] user object keys:', Object.keys(user));

  if (!user.isAdmin) {
    console.log('[ADMIN MIDDLEWARE] BLOCKED - user.isAdmin is:', user.isAdmin);
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  console.log('[ADMIN MIDDLEWARE] ALLOWED - proceeding');
  next();
};
