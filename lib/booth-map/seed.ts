import { eq, inArray, or } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import * as schema from './schema'
import { generateToken, hashToken } from './tokens'

type AnyDb = PgDatabase<PgQueryResultHKT, typeof schema>

/**
 * Booth numbers 9001-9003 can't collide with the mall's real booths, and is_test
 * keeps these vendors off every public page. Remove them with removeTestVendors().
 */
export const TEST_VENDORS = [
  { name: 'TEST Vendor A', displayName: 'Test Vendor A', booths: ['9001'] },
  { name: 'TEST Vendor B', displayName: 'Test Vendor B', booths: ['9002', '9003'] },
] as const

export interface SeededVendor {
  vendorId: string
  name: string
  booths: string[]
  /** Shown once. Only its hash is stored. */
  token: string
}

/**
 * Build step 1: two test vendors with tokens (SPEC section 10). Vendor B has two
 * booths so the booth picker on the upload page can be tested. Runs in one
 * transaction, and refuses to run twice.
 */
export async function seedTestVendors(db: AnyDb): Promise<SeededVendor[]> {
  return db.transaction(async (tx) => {
    const numbers = TEST_VENDORS.flatMap((v) => [...v.booths])
    const existing = await tx.select({ number: schema.booths.number }).from(schema.booths).where(inArray(schema.booths.number, numbers))
    if (existing.length > 0) {
      throw new Error(`Test booths already exist (${existing.map((b) => b.number).join(', ')}). Seed has already run.`)
    }
    const out: SeededVendor[] = []
    for (const v of TEST_VENDORS) {
      const token = generateToken()
      const [vendor] = await tx
        .insert(schema.vendors)
        .values({ name: v.name, displayName: v.displayName, tokenHash: hashToken(token), isTest: true })
        .returning({ id: schema.vendors.id })
      await tx.insert(schema.booths).values(v.booths.map((number) => ({ number, vendorId: vendor.id })))
      out.push({ vendorId: vendor.id, name: v.name, booths: [...v.booths], token })
    }
    return out
  })
}

/**
 * Deletes every test vendor and everything that belongs to them, in one transaction.
 * Real vendors are never deleted (they are set to status 'removed'), which is why the
 * foreign keys restrict deletes and this function removes children first.
 * Returns the Blob URLs that still need deleting from storage.
 */
export async function removeTestVendors(db: AnyDb): Promise<{ vendors: number; blobUrls: string[] }> {
  return db.transaction(async (tx) => {
    const s = schema
    const vendorIds = (await tx.select({ id: s.vendors.id }).from(s.vendors).where(eq(s.vendors.isTest, true))).map((v) => v.id)
    if (vendorIds.length === 0) return { vendors: 0, blobUrls: [] }

    const boothIds = (await tx.select({ id: s.booths.id }).from(s.booths).where(inArray(s.booths.vendorId, vendorIds))).map((b) => b.id)
    // Items by a test vendor, or sitting on a test booth.
    const itemIds = (
      await tx
        .select({ id: s.items.id })
        .from(s.items)
        .where(boothIds.length ? or(inArray(s.items.vendorId, vendorIds), inArray(s.items.boothId, boothIds)) : inArray(s.items.vendorId, vendorIds))
    ).map((i) => i.id)
    const saleIds = (
      await tx
        .select({ id: s.boothSales.id })
        .from(s.boothSales)
        .where(boothIds.length ? or(inArray(s.boothSales.vendorId, vendorIds), inArray(s.boothSales.boothId, boothIds)) : inArray(s.boothSales.vendorId, vendorIds))
    ).map((x) => x.id)
    const deviceIds = (await tx.select({ id: s.vendorDevices.id }).from(s.vendorDevices).where(inArray(s.vendorDevices.vendorId, vendorIds))).map((d) => d.id)

    const blobUrls = new Set<string>()

    // Log rows can point at a vendor, an item, a sale or a device. Remove all of them first.
    await tx.delete(s.activityLog).where(inArray(s.activityLog.vendorId, vendorIds))
    if (itemIds.length) await tx.delete(s.activityLog).where(inArray(s.activityLog.itemId, itemIds))
    if (saleIds.length) await tx.delete(s.activityLog).where(inArray(s.activityLog.boothSaleId, saleIds))
    if (deviceIds.length) await tx.delete(s.activityLog).where(inArray(s.activityLog.deviceId, deviceIds))

    // Uploads by a test vendor, or attached to one of the items being removed.
    const uploadWhere = itemIds.length ? or(inArray(s.uploads.vendorId, vendorIds), inArray(s.uploads.itemId, itemIds)) : inArray(s.uploads.vendorId, vendorIds)
    for (const u of await tx.select({ url: s.uploads.url }).from(s.uploads).where(uploadWhere)) blobUrls.add(u.url)
    await tx.delete(s.uploads).where(uploadWhere)

    if (itemIds.length) {
      for (const p of await tx.select({ url: s.itemPhotos.url }).from(s.itemPhotos).where(inArray(s.itemPhotos.itemId, itemIds))) blobUrls.add(p.url)
      for (const i of await tx.select({ url: s.items.photoUrl }).from(s.items).where(inArray(s.items.id, itemIds))) blobUrls.add(i.url)
      await tx.delete(s.itemPhotos).where(inArray(s.itemPhotos.itemId, itemIds))
      await tx.update(s.soldLines).set({ matchedItemId: null }).where(inArray(s.soldLines.matchedItemId, itemIds))
      await tx.delete(s.items).where(inArray(s.items.id, itemIds))
    }
    await tx.update(s.soldLines).set({ vendorId: null }).where(inArray(s.soldLines.vendorId, vendorIds))
    if (saleIds.length) await tx.delete(s.boothSales).where(inArray(s.boothSales.id, saleIds))
    if (boothIds.length) await tx.delete(s.booths).where(inArray(s.booths.id, boothIds))
    if (deviceIds.length) await tx.delete(s.vendorDevices).where(inArray(s.vendorDevices.id, deviceIds))
    await tx.delete(s.vendors).where(inArray(s.vendors.id, vendorIds))
    return { vendors: vendorIds.length, blobUrls: [...blobUrls] }
  })
}
