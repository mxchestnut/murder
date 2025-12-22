-- Add bio fields to character_sheets table
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS pronouns TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS sexuality TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS age TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS height TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS weight TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS appearance TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS personality TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS backstory TEXT;
