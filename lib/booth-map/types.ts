import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import type * as schema from './schema'

/**
 * Any Drizzle Postgres database with this schema: Neon's pooled driver in the app,
 * PGlite in tests. Both support db.transaction.
 */
export type AnyDb = PgDatabase<PgQueryResultHKT, typeof schema>

export interface VendorSession {
  vendorId: string
  deviceId: string
  displayName: string
  consentAt: Date | null
  booths: { id: string; number: string }[]
}
