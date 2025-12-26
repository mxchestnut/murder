-- Drop the old character_id unique constraint
ALTER TABLE character_stats DROP CONSTRAINT IF EXISTS character_stats_character_id_key;
ALTER TABLE character_stats DROP CONSTRAINT IF EXISTS character_stats_character_id_unique;
