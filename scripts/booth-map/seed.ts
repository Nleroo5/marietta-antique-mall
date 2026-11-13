/**
 * Test vendors for the database named by DATABASE_URL.
 *
 *   npm run boothmap:migrate          apply migrations
 *   npm run boothmap:seed             create the two test vendors and print their links once
 *   npm run boothmap:seed -- --remove delete the test vendors and everything they posted
 *
 * The links are not stored anywhere. Copy them when they print.
 */
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

async function main() {
  // Imported after the env is loaded, so DATABASE_URL is set when the pool is created.
  const { getDb } = await import('../../lib/booth-map/db')
  const { seedTestVendors, removeTestVendors } = await import('../../lib/booth-map/seed')
  const db = getDb()

  if (process.argv.includes('--remove')) {
    const r = await removeTestVendors(db)
    console.log(`Removed ${r.vendors} test vendor(s).`)
    if (r.blobUrls.length) console.log(`Delete these ${r.blobUrls.length} photo(s) from Blob:\n  ${r.blobUrls.join('\n  ')}`)
    return
  }

  const site = process.env.BOOTH_MAP_SITE_URL || 'http://localhost:3000'
  const vendors = await seedTestVendors(db)
  console.log('\nTest vendors created. These links are shown once:\n')
  for (const v of vendors) console.log(`  ${v.name} (booth ${v.booths.join(', ')}): ${site}/v/${v.token}`)
  console.log('')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
