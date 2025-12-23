// Quick script to create HC list table
import { sql as drizzleSql } from 'drizzle-orm';
import { db } from './db';
import * as fs from 'fs';
import * as path from 'path';

async function migrate() {
  try {
    const migrationSQL = fs.readFileSync(path.join(__dirname, '../migrations/create_hc_list.sql'), 'utf-8');
    
    // Execute raw SQL
    await db.execute(drizzleSql.raw(migrationSQL));
    console.log('✅ HC list table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
