-- Add Discord webhook URL to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_webhook_url TEXT;
