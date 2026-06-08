import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/types/database.types'

/**
 * DB-backed persistence for user-created custom trainings/objections (Y-12).
 * Previously these lived only in localStorage, so they were lost when the user
 * switched browsers — breaking the premium promise. localStorage is now used
 * only as a one-time migration source.
 */

type CustomTable = 'nmm_custom_trainings' | 'nmm_custom_objections'

interface CustomItem {
  id: string | number
  [key: string]: unknown
}

function readLocal(localKey: string): CustomItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(localKey)
    return raw ? (JSON.parse(raw) as CustomItem[]) : []
  } catch {
    return []
  }
}

/**
 * Loads custom items from the DB. On first run it migrates any localStorage-only
 * items into the DB (no data loss), then clears the local key.
 */
export async function loadCustomContent(
  table: CustomTable,
  localKey: string,
  workspaceId: string | null
): Promise<CustomItem[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return readLocal(localKey)

  const { data: rows } = await supabase
    .from(table)
    .select('item_key, data, created_at, is_approved, user_id')
    .or(`is_approved.eq.true,user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const dbItems = (rows ?? []).map(r => ({
    ...(r.data as CustomItem),
    isApproved: (r as { is_approved: boolean }).is_approved,
    userId: (r as { user_id: string }).user_id,
  }))
  const dbKeys = new Set((rows ?? []).map(r => String(r.item_key)))

  // One-time migration of localStorage-only items.
  const localItems = readLocal(localKey)
  const toMigrate = localItems.filter(it => !dbKeys.has(String(it.id)))
  if (toMigrate.length > 0) {
    await supabase.from(table).insert(
      toMigrate.map(it => ({
        user_id: user.id,
        workspace_id: workspaceId,
        item_key: String(it.id),
        data: it as unknown as Json,
        is_approved: true, // Migrated ones are immediately approved for the owner
      }))
    )
  }
  if (typeof window !== 'undefined' && localItems.length > 0) {
    try { localStorage.removeItem(localKey) } catch { /* ignore */ }
  }

  const migratedItems = toMigrate.map(it => ({
    ...it,
    isApproved: true,
    userId: user.id,
  }))

  return [...migratedItems, ...dbItems]
}

export async function addCustomContent(
  table: CustomTable,
  workspaceId: string | null,
  item: CustomItem
): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from(table).insert({
    user_id: user.id,
    workspace_id: workspaceId,
    item_key: String(item.id),
    data: item as unknown as Json,
  })
}

export async function deleteCustomContent(
  table: CustomTable,
  itemKey: string | number
): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from(table).delete().eq('user_id', user.id).eq('item_key', String(itemKey))
}
