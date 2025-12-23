// Quick script to create HC list table
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

const DATABASE_URL = process.env.DATABASE_URL || '';

async function migrate() {
  const sql = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(sql);
  
  const migrationSQL = fs.readFileSync(path.join(__dirname, '../migrations/create_hc_list.sql'), 'utf-8');
  
  await sql.unsafe(migrationSQL);
  console.log('✅ HC list table created successfully');
  
  await sql.end();
}

migrate().catch(console.error);
