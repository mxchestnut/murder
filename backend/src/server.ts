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
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import characterRoutes from './routes/characters';
import pathcompanionRoutes from './routes/pathcompanion';
import discordRoutes from './routes/discord';
import systemRoutes from './routes/system';
import filesRoutes from './routes/files';
import knowledgeBaseRoutes from './routes/knowledgeBase';
import adminRoutes from './routes/admin';
import promptsRoutes from './routes/prompts';
import importDefaultsRoutes from './routes/import-defaults';
import statsRoutes from './routes/stats';
import hallOfFameRoutes from './routes/hall-of-fame';
import memoriesRoutes from './routes/memories';
import { setupPassport } from './config/passport';
import { initializeDiscordBot } from './services/discordBot';
import { getSecretsWithFallback } from './config/secrets';
import { reinitializeDatabase, db } from './db';
import { sql } from 'drizzle-orm';
import { initializePasswordRotationTracking } from './db/passwordRotation';

async function startServer() {
  // Load secrets from AWS Secrets Manager (or .env in development)
  const secrets = await getSecretsWithFallback();

  // Reinitialize database connection with secret from AWS (in production)
  if (process.env.NODE_ENV === 'production') {
    await reinitializeDatabase(secrets.DATABASE_URL);
  }

  // Initialize Redis client
  const redisClient = createClient({
    socket: {
      host: '127.0.0.1',
      port: 6379
    }
  });

  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.on('connect', () => console.log('✓ Connected to Redis for session storage'));

  await redisClient.connect();

  const app = express();
  const PORT = process.env.PORT || 3000;

  // Set Gemini API key as environment variable for Gemini service
  process.env.GEMINI_API_KEY = secrets.GEMINI_API_KEY;

  // Initialize Discord bot with secret from AWS
  initializeDiscordBot(secrets.DISCORD_BOT_TOKEN);

  // Trust proxy (nginx)
  app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://murder.tech', 'https://www.murder.tech']
    : 'http://localhost:5173',
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

// Body parsing and cookie middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

  // Session configuration with Redis
  app.use(session({
    store: new RedisStore({
      client: redisClient,
      prefix: 'murder:sess:',
      ttl: 86400 * 30 // 30 days absolute maximum in seconds
    }),
    secret: secrets.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Refresh session on each request (activity-based)
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days, refreshed on activity
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'none' - same domain means we can use 'lax'
      domain: undefined, // Remove domain restriction - let browser handle it
      path: '/'
    }
  }));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
setupPassport();

// CSRF Protection
const csrfProtection = doubleCsrf({
  getSecret: () => secrets.SESSION_SECRET,
  getSessionIdentifier: (req) => req.session?.id || '',
  cookieName: 'murder.x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Changed from 'none' - same domain
    domain: undefined, // Remove domain restriction
    path: '/'
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

const doubleCsrfProtection = csrfProtection.doubleCsrfProtection;

// CSRF token endpoint (no protection needed for GET)
app.get('/api/csrf-token', (req, res) => {
  const token = csrfProtection.generateCsrfToken(req, res);
  res.json({ csrfToken: token });
});

// Apply CSRF protection to all API routes except auth (login/register)
// Auth routes handle their own CSRF for better UX
app.use('/api/documents', doubleCsrfProtection);
app.use('/api/characters', doubleCsrfProtection);
app.use('/api/pathcompanion', doubleCsrfProtection);
app.use('/api/discord', doubleCsrfProtection);
app.use('/api/system', doubleCsrfProtection);
app.use('/api/files', doubleCsrfProtection);
app.use('/api/knowledge-base', doubleCsrfProtection);
app.use('/api/admin', doubleCsrfProtection);
app.use('/api/prompts', doubleCsrfProtection);
app.use('/api/import-defaults', doubleCsrfProtection);
app.use('/api/stats', doubleCsrfProtection);
app.use('/api/hall-of-fame', doubleCsrfProtection);
app.use('/api/memories', doubleCsrfProtection);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/pathcompanion', pathcompanionRoutes);
app.use('/api/discord', discordRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/prompts', promptsRoutes);
app.use('/api/import-defaults', importDefaultsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/hall-of-fame', hallOfFameRoutes);
app.use('/api/memories', memoriesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve static frontend files
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });

  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Secrets loaded from: ${process.env.NODE_ENV === 'production' ? 'AWS Secrets Manager' : '.env file'}`);

    // Initialize password rotation tracking
    await initializePasswordRotationTracking();

    // Ensure Discord bot tables exist
    try {
      // HC list table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS hc_list (
          id SERIAL PRIMARY KEY,
          discord_user_id TEXT NOT NULL,
          guild_id TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_hc_list_user_guild ON hc_list(discord_user_id, guild_id);
      `);

      // Character Memories table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS character_memories (
          id SERIAL PRIMARY KEY,
          character_id INTEGER NOT NULL REFERENCES character_sheets(id) ON DELETE CASCADE,
          guild_id TEXT NOT NULL,
          memory TEXT NOT NULL,
          added_by TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_character_memories_char ON character_memories(character_id);
        CREATE INDEX IF NOT EXISTS idx_character_memories_guild ON character_memories(guild_id);
      `);

      // Prompts table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS prompts (
          id SERIAL PRIMARY KEY,
          category TEXT NOT NULL,
          prompt_text TEXT NOT NULL,
          created_by INTEGER,
          use_count INTEGER DEFAULT 0,
          last_used TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);

      // Tropes table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tropes (
          id SERIAL PRIMARY KEY,
          category TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          use_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);

      // Sessions table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS sessions (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          channel_id TEXT NOT NULL,
          guild_id TEXT NOT NULL,
          started_at TIMESTAMP DEFAULT NOW() NOT NULL,
          ended_at TIMESTAMP,
          paused_at TIMESTAMP,
          is_paused BOOLEAN DEFAULT false,
          participants TEXT,
          message_count INTEGER DEFAULT 0,
          summary TEXT,
          tags TEXT,
          created_by INTEGER
        );
      `);

      // Scenes table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS scenes (
          id SERIAL PRIMARY KEY,
          session_id INTEGER,
          title TEXT NOT NULL,
          location TEXT,
          channel_id TEXT NOT NULL,
          guild_id TEXT NOT NULL,
          started_at TIMESTAMP DEFAULT NOW() NOT NULL,
          ended_at TIMESTAMP,
          participants TEXT,
          tags TEXT
        );
      `);

      // Hall of Fame table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS hall_of_fame (
          id SERIAL PRIMARY KEY,
          message_id TEXT NOT NULL UNIQUE,
          channel_id TEXT NOT NULL,
          guild_id TEXT NOT NULL,
          author_id TEXT NOT NULL,
          character_name TEXT,
          content TEXT NOT NULL,
          star_count INTEGER DEFAULT 0,
          context_messages TEXT,
          hall_message_id TEXT,
          added_to_hall_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);

      // Bot Settings table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS bot_settings (
          id SERIAL PRIMARY KEY,
          guild_id TEXT NOT NULL UNIQUE,
          announcement_channel_id TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);

      console.log('✓ Discord bot tables verified');
    } catch (error) {
      console.error('Error creating Discord bot tables:', error);
    }
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
