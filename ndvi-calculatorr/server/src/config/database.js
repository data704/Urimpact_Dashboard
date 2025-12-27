// PostgreSQL Database Configuration
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool with production-ready settings
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'ndvi_majmaah_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Maximum number of clients in the pool
  min: parseInt(process.env.DB_POOL_MIN || '2', 10), // Minimum number of clients
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10), // Close idle clients after 30s
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10), // 5s timeout for new connections
  // RDS-specific settings
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false, // Enable SSL for RDS
  // Keep-alive settings for RDS
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ PostgreSQL database connected');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err);
  process.exit(-1);
});

// Test query to verify connection with retry logic
export const testConnection = async (retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await pool.query('SELECT NOW(), version()');
      console.log('✅ Database connection test successful:', result.rows[0].now);
      console.log(`📊 PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
      return true;
    } catch (error) {
      console.error(`❌ Database connection test failed (attempt ${i + 1}/${retries}):`, error.message);
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ All database connection attempts failed');
        return false;
      }
    }
  }
  return false;
};

// Initialize database (run migrations)
export const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('🔧 Checking database schema...');
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('projects', 'analysis_results', 'majmaah_assignments', 'calculated_metrics', 'species_data')
    `);
    
    const existingTables = tablesResult.rows.map(r => r.table_name);
    console.log('📊 Existing tables:', existingTables);
    
    if (existingTables.length === 0) {
      console.log('⚠️  No tables found. Please run the migration SQL file manually:');
      console.log('   psql -U postgres -d ndvi_majmaah_db -f migrations/001-initial-schema.sql');
    } else if (existingTables.length < 5) {
      console.log('⚠️  Incomplete schema. Please run the migration SQL file.');
    } else {
      console.log('✅ Database schema is complete');
    }
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  } finally {
    client.release();
  }
};

export default pool;

