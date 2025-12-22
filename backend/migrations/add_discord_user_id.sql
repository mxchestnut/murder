-- Add Discord user ID for linking Discord accounts to Cyarika
ALTER TABLE users ADD COLUMN discord_user_id TEXT UNIQUE;

-- Create index for faster Discord user lookups
CREATE INDEX idx_users_discord_user_id ON users(discord_user_id);
