import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function checkTables() {
  try {
    const result = await db.execute(sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    console.log('\n📊 Tables in Neon database:');
    console.log('═══════════════════════════════');
    result.rows.forEach((row: any) => console.log('  ✓', row.tablename));
    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTables();
