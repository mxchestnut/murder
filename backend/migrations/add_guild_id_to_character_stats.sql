-- Add guild_id to character_stats for server-specific tracking
ALTER TABLE character_stats ADD COLUMN IF NOT EXISTS guild_id VARCHAR(255) NOT NULL DEFAULT '';

-- Drop the unique constraint on character_id since characters can have stats in multiple servers
ALTER TABLE character_stats DROP CONSTRAINT IF EXISTS character_stats_character_id_unique;

-- Add composite unique constraint for character_id + guild_id
ALTER TABLE character_stats ADD CONSTRAINT character_stats_character_guild_unique UNIQUE (character_id, guild_id);
