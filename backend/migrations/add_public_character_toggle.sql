-- Add isPublic field to character_sheets table for public character profiles
ALTER TABLE character_sheets
ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

-- Add index for faster queries on public characters
CREATE INDEX idx_character_sheets_public ON character_sheets(is_public) WHERE is_public = TRUE;

-- Add public_slug for shareable URLs (unique, human-readable)
ALTER TABLE character_sheets
ADD COLUMN public_slug VARCHAR(255) UNIQUE;

-- Add views counter for public profiles
ALTER TABLE character_sheets
ADD COLUMN public_views INTEGER DEFAULT 0;

COMMENT ON COLUMN character_sheets.is_public IS 'Whether this character profile is publicly viewable';
COMMENT ON COLUMN character_sheets.public_slug IS 'Unique slug for public profile URL (e.g., /public/aria-stormwind)';
COMMENT ON COLUMN character_sheets.public_views IS 'Number of times the public profile has been viewed';
