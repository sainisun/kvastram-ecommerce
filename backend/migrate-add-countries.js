// Migration script: Add countries column to regions table
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  statement_timeout: 60000 // 60 seconds
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting migration...');
    
    // Check if column exists first
    console.log('📋 Checking if countries column exists...');
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'regions' AND column_name = 'countries'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Countries column already exists!');
      return;
    }
    
    // Add the column
    console.log('➕ Adding countries column to regions table...');
    await client.query('ALTER TABLE "regions" ADD COLUMN "countries" jsonb;');
    console.log('✅ Column added successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate()
  .then(() => {
    console.log('\n🎉 Migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
