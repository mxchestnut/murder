-- Add guildId to knowledge_base table for multi-tenancy
-- Each Discord server (guild) will have its own isolated knowledge base

-- Add the column (nullable first since existing data exists)
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS guild_id TEXT;

-- For any existing data, you can either:
-- 1. Delete it: DELETE FROM knowledge_base;
-- 2. Assign to a default guild: UPDATE knowledge_base SET guild_id = 'YOUR_MAIN_SERVER_ID' WHERE guild_id IS NULL;

-- After migrating existing data, make it NOT NULL
-- ALTER TABLE knowledge_base ALTER COLUMN guild_id SET NOT NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_knowledge_base_guild_id ON knowledge_base(guild_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_guild_question ON knowledge_base(guild_id, question);

-- Note: Characters remain user-owned and portable across servers
-- Only knowledge_base is scoped per guild
