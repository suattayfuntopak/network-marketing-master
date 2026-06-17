'use client'

import {
  addCustomContentAction,
  deleteCustomContentAction,
  fetchCustomContentAction,
  migrateLocalCustomContentAction,
  updateCustomContentAction,
  type CustomContentItem,
  type CustomContentTable,
} from '@/app/(dashboard)/actions/customContent'

/**
 * DB-backed persistence for user-created custom trainings/objections (Y-12).
 * Previously these lived only in localStorage, so they were lost when the user
 * switched browsers — breaking the premium promise. localStorage is now used
 * only as a one-time migration source.
 */

function readLocal(localKey: string): CustomContentItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(localKey)
    return raw ? (JSON.parse(raw) as CustomContentItem[]) : []
  } catch {
    return []
  }
}

function clearLocal(localKey: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(localKey)
  } catch {
    // ignore
  }
}

/**
 * Loads custom items from the DB. On first run it migrates any localStorage-only
 * items into the DB (no data loss), then clears the local key.
 */
export async function loadCustomContent(
  table: CustomContentTable,
  localKey: string,
  workspaceId: string | null
): Promise<CustomContentItem[]> {
  const localItems = readLocal(localKey)
  const { items: dbItems, currentUserId } = await fetchCustomContentAction(table)

  // One-time migration of localStorage-only items.
  if (!currentUserId) {
    return localItems.length > 0 ? localItems : dbItems
  }

  const dbKeys = new Set(dbItems.map(item => String(item.id)))
  const toMigrate = localItems.filter(it => !dbKeys.has(String(it.id)))
  if (toMigrate.length > 0) {
    await migrateLocalCustomContentAction(table, workspaceId, toMigrate)
  }
  if (localItems.length > 0) clearLocal(localKey)

  const migratedItems = toMigrate.map(it => ({
    ...it,
    isApproved: true,
    userId: currentUserId,
  }))

  return [...migratedItems, ...dbItems]
}

export async function addCustomContent(
  table: CustomContentTable,
  workspaceId: string | null,
  item: CustomContentItem
): Promise<void> {
  await addCustomContentAction(table, workspaceId, item)
}

/** Updates an existing custom item's payload (owner-only; RLS "own ..." policy). */
export async function updateCustomContent(
  table: CustomContentTable,
  itemKey: string | number,
  item: CustomContentItem
): Promise<void> {
  await updateCustomContentAction(table, itemKey, item)
}

export async function deleteCustomContent(
  table: CustomContentTable,
  itemKey: string | number
): Promise<void> {
  await deleteCustomContentAction(table, itemKey)
}
