import { Pool } from '@neondatabase/serverless'
import { attachDatabasePool } from '@vercel/functions'
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless'
import * as schema from './schema'

/**
 * Neon's pooled (WebSocket) driver, not the HTTP one. The HTTP driver cannot run
 * transactions, and the tests run on PGlite, which can. Using the pooled driver
 * means `db.transaction` behaves the same in tests and in production, so atomic
 * flows (link reset, starting a booth sale, mark sold plus its log row) are tested
 * the way they run.
 *
 * One pool per server instance. attachDatabasePool lets Vercel's Fluid compute close
 * idle connections before an instance is suspended.
 */
export type BoothMapDb = NeonDatabase<typeof schema>

let db: BoothMapDb | null = null

export function getDb(): BoothMapDb {
  if (db) return db
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set. Add the Neon connection string to .env.local and to Vercel.')
  }
  const pool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10_000 })
  attachDatabasePool(pool)
  db = drizzle({ client: pool, schema })
  return db
}

export { schema }
