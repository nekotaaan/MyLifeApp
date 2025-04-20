import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool with error handling
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Add connection pool settings for stability
  max: 10, // maximum number of clients
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // how long to wait for a connection
});

// Handle connection pool errors to prevent application crashes
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
  // Don't crash the application, just log the error
});

export const db = drizzle(pool, { schema });