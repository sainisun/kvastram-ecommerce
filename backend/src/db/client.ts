import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import 'dotenv/config';

// PostgreSQL connection using postgres.js
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/kvastram_dev';

// Determine if using Supabase (pooler connection)
const isSupabase =
  connectionString.includes('supabase.com') ||
  connectionString.includes('aws-0-');

// Connection type logging removed for security

// Create postgres client with proper configuration
const client = postgres(connectionString, {
  max: 10, // Always use 10 connections for better performance
  idle_timeout: 20,
  connect_timeout: 60,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
  prepare: false,
  // Add connection debugging
  // Debugging hooks removed
});

// Test connection function
export async function testConnection() {
  try {
    const result = await client`SELECT 1 as test`;
    // Connection successful
    return true;
  } catch (error) {
    console.error('[DB DEBUG] Connection failed:', error);
    return false;
  }
}

// Health check with retry
export async function healthCheck(retries = 3, delay = 2000): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    // Health check attempt
    if (await testConnection()) {
      return true;
    }
    if (i < retries - 1) {
      // Retrying...
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return false;
}

export const db = drizzle(client, { schema });

// Initial connection test
// Initial connection test
testConnection().then((connected) => {
  if (connected) {
    console.log('✅ Database client ready');
  } else {
    console.error('❌ Database client failed to connect');
  }
});
