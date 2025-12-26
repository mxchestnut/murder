-- Find and drop the old character_id unique constraint
DO $$
BEGIN
    -- Try to drop the old unique constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'character_stats_character_id_key'
        AND conrelid = 'character_stats'::regclass
    ) THEN
        ALTER TABLE character_stats DROP CONSTRAINT character_stats_character_id_key;
        RAISE NOTICE 'Dropped constraint character_stats_character_id_key';
    END IF;
END $$;
