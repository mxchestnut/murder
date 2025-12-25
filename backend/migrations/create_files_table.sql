-- Create files table with categories, thumbnails, and user storage quotas

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  s3_key TEXT NOT NULL UNIQUE,
  s3_bucket TEXT NOT NULL,
  document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  virus_scan_status TEXT DEFAULT 'pending',
  virus_scan_details TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP,

  -- New fields for categories and optimization
  category TEXT DEFAULT 'document',
  thumbnail_s3_key TEXT,
  thumbnail_url TEXT,
  is_optimized BOOLEAN DEFAULT false
);

-- Add storage quotas to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS storage_quota_bytes BIGINT DEFAULT 1073741824; -- 1GB default
ALTER TABLE users ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_user_category ON files(user_id, category);
CREATE INDEX IF NOT EXISTS idx_files_deleted ON files(deleted_at);
CREATE INDEX IF NOT EXISTS idx_files_document ON files(document_id);
