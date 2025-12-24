import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function checkMissingTables() {
  try {
    const result = await db.execute(sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    const existingTables = new Set(result.rows.map((row: any) => row.tablename));
    
    // Tables imported by discordBot.ts
    const requiredTables = [
      'channel_character_mappings',
      'character_sheets',
      'users',
      'knowledge_base',
      'character_stats',
      'activity_feed',
      'relationships',
      'prompts',
      'tropes',
      'sessions',
      'session_messages',
      'scenes',
      'scene_messages',
      'hall_of_fame',
      'gm_notes',
      'game_time',
      'bot_settings',
      'hc_list',
      'character_memories'
    ];

    const missingTables = requiredTables.filter(table => !existingTables.has(table));

    console.log('\n🔍 Discord Bot Table Check:');
    console.log('═══════════════════════════════');
    
    if (missingTables.length === 0) {
      console.log('✅ All required tables exist!');
    } else {
      console.log('❌ Missing tables:');
      missingTables.forEach(table => console.log('   -', table));
    }
    
    console.log('\n');
    process.exit(missingTables.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMissingTables();
