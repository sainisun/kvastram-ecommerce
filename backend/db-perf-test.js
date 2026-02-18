const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    console.log('Testing DB Latency...');
    const start = Date.now();
    try {
        const res = await pool.query('SELECT NOW()');
        const duration = Date.now() - start;
        console.log(`✅ DB Connected! Latency: ${duration}ms`);
        console.log(`Timestamp: ${res.rows[0].now}`);
        
        // Check collections query speed (cause of timeout?)
        const startColl = Date.now();
        await pool.query('SELECT * FROM product_collections LIMIT 5');
        console.log(`✅ Collections Query Time: ${Date.now() - startColl}ms`);
        
    } catch (e) {
        console.error('❌ DB Error:', e.message);
    } finally {
        await pool.end();
    }
}

check();
