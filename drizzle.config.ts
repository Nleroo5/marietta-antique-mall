import { loadEnvConfig } from '@next/env'
import { defineConfig } from 'drizzle-kit'

// Same env loading as Next.js, so DATABASE_URL comes from .env.local.
loadEnvConfig(process.cwd())

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/booth-map/schema.ts',
  out: './drizzle/booth-map',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  strict: true,
  verbose: true,
})
