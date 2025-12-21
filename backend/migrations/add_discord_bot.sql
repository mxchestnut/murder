-- Rename discord_webhook_url to discord_bot_token
ALTER TABLE users RENAME COLUMN discord_webhook_url TO discord_bot_token;

-- Create channel_character_mappings table
CREATE TABLE IF NOT EXISTS channel_character_mappings (
  id SERIAL PRIMARY KEY,
  channel_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  character_id INTEGER NOT NULL REFERENCES character_sheets(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_channel_character_mappings_channel ON channel_character_mappings(channel_id, guild_id);
CREATE INDEX IF NOT EXISTS idx_channel_character_mappings_character ON channel_character_mappings(character_id);
