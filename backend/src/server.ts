import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root FIRST, before any other imports that use env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import characterRoutes from './routes/characters';
import pathcompanionRoutes from './routes/pathcompanion';
import { setupPassport } from './config/passport';
import { initializeDiscordBot } from './services/discordBot';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Discord bot
initializeDiscordBot(process.env.DISCORD_BOT_TOKEN || '');

// Trust proxy (nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  proxy: true, // Trust the reverse proxy
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.cyarika.com' : undefined, // Share cookie across www and apex domain
    path: '/'
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
setupPassport();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/pathcompanion', pathcompanionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
