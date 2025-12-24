// Add file categories, thumbnails, and user storage quotas
import { sql as drizzleSql } from 'drizzle-orm';
import { db } from './db';
import * as fs from 'fs';
import * as path from 'path';

async function migrate() {
  try {
    const migrationSQL = fs.readFileSync(path.join(__dirname, '../migrations/create_files_table.sql'), 'utf-8');
    
    // Execute raw SQL
    await db.execute(drizzleSql.raw(migrationSQL));
    console.log('✅ Files table created successfully with categories and quotas');
    console.log('   - Created files table with category field');
    console.log('   - Added thumbnail support');
    console.log('   - Added storage quotas to users table');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
