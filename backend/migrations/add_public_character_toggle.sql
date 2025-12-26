-- Add isPublic field to characters table for public character profiles
ALTER TABLE characters
ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

-- Add index for faster queries on public characters
CREATE INDEX idx_characters_public ON characters(is_public) WHERE is_public = TRUE;

-- Add public_slug for shareable URLs (unique, human-readable)
ALTER TABLE characters
ADD COLUMN public_slug VARCHAR(255) UNIQUE;

-- Add views counter for public profiles
ALTER TABLE characters
ADD COLUMN public_views INTEGER DEFAULT 0;

COMMENT ON COLUMN characters.is_public IS 'Whether this character profile is publicly viewable';
COMMENT ON COLUMN characters.public_slug IS 'Unique slug for public profile URL (e.g., /public/aria-stormwind)';
COMMENT ON COLUMN characters.public_views IS 'Number of times the public profile has been viewed';
