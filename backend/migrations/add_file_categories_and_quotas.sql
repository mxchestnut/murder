-- Add file categories, thumbnails, and user storage quotas

-- Add category to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'document';
-- Categories: 'avatar', 'image', 'document', 'other'

-- Add thumbnail support
ALTER TABLE files ADD COLUMN IF NOT EXISTS thumbnail_s3_key TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS is_optimized BOOLEAN DEFAULT false;

-- Add storage quotas to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS storage_quota_bytes BIGINT DEFAULT 1073741824; -- 1GB default
ALTER TABLE users ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_user_category ON files(user_id, category);
CREATE INDEX IF NOT EXISTS idx_files_deleted ON files(deleted_at);
