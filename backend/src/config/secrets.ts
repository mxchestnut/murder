import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

interface Secrets {
  DATABASE_URL: string;
  SESSION_SECRET: string;
  DISCORD_BOT_TOKEN: string;
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

  const [databaseUrl, sessionSecret, discordBotToken] = await Promise.all([
    getSecret('cyarika/database-url'),
    getSecret('cyarika/session-secret'),
    getSecret('cyarika/discord-bot-token')
  ]);

  cachedSecrets = {
    DATABASE_URL: databaseUrl,
    SESSION_SECRET: sessionSecret,
    DISCORD_BOT_TOKEN: discordBotToken
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
      DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || ''
    };
  }

  return loadSecrets();
}
