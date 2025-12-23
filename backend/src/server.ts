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
import discordRoutes from './routes/discord';
import { setupPassport } from './config/passport';
import { initializeDiscordBot } from './services/discordBot';
import { getSecretsWithFallback } from './config/secrets';
import { reinitializeDatabase } from './db';

async function startServer() {
  // Load secrets from AWS Secrets Manager (or .env in development)
  const secrets = await getSecretsWithFallback();
  
  // Reinitialize database connection with secret from AWS (in production)
  if (process.env.NODE_ENV === 'production') {
    await reinitializeDatabase(secrets.DATABASE_URL);
  }

  const app = express();
  const PORT = process.env.PORT || 3000;

  // Initialize Discord bot with secret from AWS
  initializeDiscordBot(secrets.DISCORD_BOT_TOKEN);

  // Trust proxy (nginx)
  app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for serving frontend
}));
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
    secret: secrets.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.cyarika.com' : undefined, // Share cookie across www and apex domain
      path: '/'
    }
  }));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
setupPassport();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/pathcompanion', pathcompanionRoutes);
app.use('/api/discord', discordRoutes);

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

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Secrets loaded from: ${process.env.NODE_ENV === 'production' ? 'AWS Secrets Manager' : '.env file'}`);
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
