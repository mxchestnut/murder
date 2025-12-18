import { Router } from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.username, username));
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db.insert(users).values({
      username,
      password: hashedPassword,
      email
    }).returning();

    res.json({ message: 'User created successfully', userId: newUser.id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', passport.authenticate('local'), (req, res) => {
  res.json({ 
    message: 'Login successful', 
    user: { 
      id: (req.user as any).id, 
      username: (req.user as any).username 
    } 
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ 
      user: { 
        id: (req.user as any).id, 
        username: (req.user as any).username 
      } 
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

export default router;
