require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
    try {
        // Add missing columns to product_collections table
        await pool.query('ALTER TABLE product_collections ADD COLUMN IF NOT EXISTS image TEXT');
        console.log('✅ image column added');
        
        await pool.query('ALTER TABLE product_collections ADD COLUMN IF NOT EXISTS metadata JSONB');
        console.log('✅ metadata column added');
        
        // Verify
        const result = await pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position', ['product_collections']);
        console.log('📋 product_collections columns:', result.rows.map(r => r.column_name).join(', '));
    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await pool.end();
    }
}

fix();
