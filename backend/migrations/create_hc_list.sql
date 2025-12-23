-- Create HC list table
CREATE TABLE IF NOT EXISTS hc_list (
  id SERIAL PRIMARY KEY,
  discord_user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_hc_list_user_guild ON hc_list(discord_user_id, guild_id);
