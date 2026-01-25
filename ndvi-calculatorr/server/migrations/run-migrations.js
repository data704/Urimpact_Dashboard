import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - look for .env file in parent directory (server root)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
  database: process.env.DB_NAME || process.env.PGDATABASE || 'ndvi_majmaah_db',
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔌 Connecting to database...');
    console.log('   Host:', process.env.DB_HOST || process.env.PGHOST || 'localhost');
    console.log('   Database:', process.env.DB_NAME || process.env.PGDATABASE || 'ndvi_majmaah_db');
    console.log('   User:', process.env.DB_USER || process.env.PGUSER || 'postgres');
    
    // Check which tables already exist
    const tableCheckResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('departments', 'employees', 'planting_record_assignments')
    `);
    
    const existingTables = tableCheckResult.rows.map(r => r.table_name);
    console.log(`\n📊 Existing tables: ${existingTables.length > 0 ? existingTables.join(', ') : 'none'}`);
    
    const migrationsDir = __dirname;
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && file.startsWith('00'))
      .sort();
    
    // Only run migrations 003 and 004 (skip already-run migrations)
    const newMigrations = migrationFiles.filter(file => {
      if (file.includes('003-departments') && existingTables.includes('departments')) {
        console.log(`⏭️  Skipping ${file} - tables already exist`);
        return false;
      }
      if (file.includes('004-planting-record') && existingTables.includes('planting_record_assignments')) {
        console.log(`⏭️  Skipping ${file} - tables already exist`);
        return false;
      }
      // Skip migrations 001 and 002 as they're already run
      if (file.includes('001-initial') || file.includes('002-users')) {
        console.log(`⏭️  Skipping ${file} - already executed`);
        return false;
      }
      return true;
    });
    
    if (newMigrations.length === 0) {
      console.log('\n✅ All required migrations have already been run!');
      return;
    }
    
    console.log(`\n📦 Running ${newMigrations.length} new migration(s)`);
    
    for (const file of newMigrations) {
      console.log(`\n▶️  Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      await client.query(sql);
      console.log(`✅ Migration completed: ${file}`);
    }
    
    console.log('\n✅ All migrations completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
