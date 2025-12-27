import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

interface Secrets {
  DATABASE_URL: string;
  SESSION_SECRET: string;
  DISCORD_BOT_TOKEN: string;
  GEMINI_API_KEY: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_RP_TIER_PRICE_ID?: string;
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

  // Load required secrets
  const [databaseUrl, sessionSecret, discordBotToken, geminiApiKey] = await Promise.all([
    getSecret('murder/database-url'),
    getSecret('murder/session-secret'),
    getSecret('murder/discord-bot-token'),
    getSecret('murder/gemini-api-key')
  ]);

  // Try to load optional Stripe secrets
  let stripeSecrets: {
    STRIPE_SECRET_KEY?: string;
    STRIPE_PUBLISHABLE_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    STRIPE_RP_TIER_PRICE_ID?: string;
  } = {};

  try {
    const [stripeSecretKey, stripePublishableKey, stripeWebhookSecret, stripeRpTierPriceId] = await Promise.all([
      getSecret('murder/stripe-secret-key'),
      getSecret('murder/stripe-publishable-key'),
      getSecret('murder/stripe-webhook-secret'),
      getSecret('murder/stripe-rp-tier-price-id')
    ]);

    stripeSecrets = {
      STRIPE_SECRET_KEY: stripeSecretKey,
      STRIPE_PUBLISHABLE_KEY: stripePublishableKey,
      STRIPE_WEBHOOK_SECRET: stripeWebhookSecret,
      STRIPE_RP_TIER_PRICE_ID: stripeRpTierPriceId
    };
    console.log('✓ Stripe secrets loaded');
  } catch (error) {
    console.warn('⚠ Stripe secrets not available - subscription features disabled');
  }

  cachedSecrets = {
    DATABASE_URL: databaseUrl,
    SESSION_SECRET: sessionSecret,
    DISCORD_BOT_TOKEN: discordBotToken,
    GEMINI_API_KEY: geminiApiKey,
    ...stripeSecrets
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
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
      STRIPE_RP_TIER_PRICE_ID: process.env.STRIPE_RP_TIER_PRICE_ID || ''
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
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
      STRIPE_RP_TIER_PRICE_ID: process.env.STRIPE_RP_TIER_PRICE_ID || ''
    };
  }
}
