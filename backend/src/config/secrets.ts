import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

interface Secrets {
  DATABASE_URL: string;
  SESSION_SECRET: string;
  DISCORD_BOT_TOKEN: string;
  GEMINI_API_KEY: string;
}

let cachedSecrets: Secrets | null = null;

async function getSecret(secretName: string): Promise<string> {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);
    
    if (response.SecretString) {
      return response.SecretString;
    }
    
    throw new Error(`Secret ${secretName} not found or is binary`);
  } catch (error) {
    console.error(`Error fetching secret ${secretName}:`, error);
    throw error;
  }
}

export async function loadSecrets(): Promise<Secrets> {
  if (cachedSecrets) {
    return cachedSecrets;
  }

  console.log('Loading secrets from AWS Secrets Manager...');

  const [databaseUrl, sessionSecret, discordBotToken, geminiApiKey] = await Promise.all([
    getSecret('murder/database-url'),
    getSecret('murder/session-secret'),
    getSecret('murder/discord-bot-token'),
    getSecret('murder/gemini-api-key')
  ]);

  cachedSecrets = {
    DATABASE_URL: databaseUrl,
    SESSION_SECRET: sessionSecret,
    DISCORD_BOT_TOKEN: discordBotToken,
    GEMINI_API_KEY: geminiApiKey
  };

  console.log('✓ Secrets loaded successfully');
  return cachedSecrets;
}

// For local development, fall back to .env
export async function getSecretsWithFallback(): Promise<Secrets> {
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode - using .env file');
    return {
      DATABASE_URL: process.env.DATABASE_URL || '',
      SESSION_SECRET: process.env.SESSION_SECRET || '',
      DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || '',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || ''
    };
  }

  // In production, try AWS Secrets Manager first, fall back to .env
  try {
    return await loadSecrets();
  } catch (error) {
    console.warn('Failed to load from AWS Secrets Manager, falling back to .env:', error);
    return {
      DATABASE_URL: process.env.DATABASE_URL || '',
      SESSION_SECRET: process.env.SESSION_SECRET || '',
      DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || '',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || ''
    };
  }
}
