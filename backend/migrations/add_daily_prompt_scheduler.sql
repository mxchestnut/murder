-- Add daily prompt scheduler configuration to bot_settings table
ALTER TABLE bot_settings
ADD COLUMN daily_prompt_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN daily_prompt_time TIME DEFAULT '09:00:00', -- Default 9 AM server time
ADD COLUMN daily_prompt_channel_id VARCHAR(255),
ADD COLUMN last_prompt_posted TIMESTAMP;

COMMENT ON COLUMN bot_settings.daily_prompt_enabled IS 'Whether daily automated prompts are enabled for this server';
COMMENT ON COLUMN bot_settings.daily_prompt_time IS 'Time of day to post daily prompts (server local time)';
COMMENT ON COLUMN bot_settings.daily_prompt_channel_id IS 'Channel ID where daily prompts should be posted';
COMMENT ON COLUMN bot_settings.last_prompt_posted IS 'Timestamp of last prompt posted to prevent duplicates';
