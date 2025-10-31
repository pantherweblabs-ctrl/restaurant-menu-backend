// Test database connection
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Contact@123@db.yjynnclmzueqxitqszdt.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    
    // Test if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('visitors', 'message_logs')
    `);
    
    console.log('📊 Existing tables:', tablesResult.rows.map(row => row.table_name));
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();
