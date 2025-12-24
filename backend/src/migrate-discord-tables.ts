// Create missing Discord bot tables
import { sql as drizzleSql } from 'drizzle-orm';
import { db } from './db';
import * as fs from 'fs';
import * as path from 'path';

async function migrate() {
  try {
    const migrationSQL = fs.readFileSync(path.join(__dirname, '../migrations/create_discord_bot_tables.sql'), 'utf-8');
    
    // Execute raw SQL
    await db.execute(drizzleSql.raw(migrationSQL));
    console.log('✅ Discord bot tables created successfully');
    console.log('   - session_messages');
    console.log('   - scene_messages');
    console.log('   - gm_notes');
    console.log('   - game_time');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
