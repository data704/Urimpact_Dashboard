import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'ndvi_majmaah_db',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database:', process.env.PGHOST);
    
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const file of migrationFiles) {
      console.log('Running migration:', file);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      await client.query(sql);
      console.log('Migration completed:', file);
    }
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
