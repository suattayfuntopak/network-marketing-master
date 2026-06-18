'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuthUserId, requireAuthUserIdOrNull } from '@/lib/supabase/requireAuth'
import type { Json } from '@/types/database.types'

export type CustomContentTable = 'nmm_custom_trainings' | 'nmm_custom_objections'

export interface CustomContentItem {
  id: string | number
  [key: string]: unknown
}

interface CustomContentRow {
  item_key: string
  data: Json
  created_at: string
  is_approved: boolean
  user_id: string
}

export interface FetchCustomContentResult {
  items: Array<CustomContentItem & { isApproved: boolean; userId: string }>
  currentUserId: string | null
}

export async function fetchCustomContentAction(
  table: CustomContentTable,
): Promise<FetchCustomContentResult> {
  const supabase = await createClient()
  const userId = await requireAuthUserIdOrNull()
  if (!userId) {
    return { items: [], currentUserId: null }
  }

  const { data, error } = await supabase
    .from(table)
    .select('item_key, data, created_at, is_approved, user_id')
    .eq('is_deleted', false)
    .or(`is_approved.eq.true,user_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const latestByKey = new Map<string, CustomContentItem & { isApproved: boolean; userId: string }>()
  for (const row of (data ?? []) as CustomContentRow[]) {
    if (latestByKey.has(row.item_key)) continue
    latestByKey.set(row.item_key, {
      ...(row.data as CustomContentItem),
      isApproved: row.is_approved,
      userId: row.user_id,
    })
  }

  return {
    items: Array.from(latestByKey.values()),
    currentUserId: userId,
  }
}

export async function migrateLocalCustomContentAction(
  table: CustomContentTable,
  workspaceId: string | null,
  items: CustomContentItem[],
): Promise<void> {
  if (items.length === 0) return

  const supabase = await createClient()
  const userId = await requireAuthUserId()
  const itemKeys = items.map(item => String(item.id))

  const { data: existingRows, error: existingError } = await supabase
    .from(table)
    .select('item_key')
    .eq('user_id', userId)
    .in('item_key', itemKeys)

  if (existingError) throw new Error(existingError.message)

  const existingKeys = new Set((existingRows ?? []).map(row => row.item_key))
  const rowsToInsert = items
    .filter(item => !existingKeys.has(String(item.id)))
    .map(item => ({
      user_id: userId,
      workspace_id: workspaceId,
      item_key: String(item.id),
      data: item as unknown as Json,
      // O-4: addCustomContentAction ile tutarlı (DB default false). Eski `true`,
      // kullanıcının özel localStorage içeriğini moderasyonu ATLAYARAK herkese
      // yayınlıyordu. Sahibi `user_id` koşuluyla görmeye devam eder; paylaşım için
      // moderasyondan geçer.
      is_approved: false,
      is_deleted: false,
    }))

  if (rowsToInsert.length === 0) return

  const { error } = await supabase.from(table).insert(rowsToInsert)
  if (error) throw new Error(error.message)
}

export async function addCustomContentAction(
  table: CustomContentTable,
  workspaceId: string | null,
  item: CustomContentItem,
): Promise<void> {
  const supabase = await createClient()
  const userId = await requireAuthUserId()

  const { error } = await supabase.from(table).insert({
    user_id: userId,
    workspace_id: workspaceId,
    item_key: String(item.id),
    data: item as unknown as Json,
    is_deleted: false,
  })

  if (error) throw new Error(error.message)
}

export async function updateCustomContentAction(
  table: CustomContentTable,
  itemKey: string | number,
  item: CustomContentItem,
): Promise<void> {
  const supabase = await createClient()
  const userId = await requireAuthUserId()

  const { error } = await supabase
    .from(table)
    .update({ data: item as unknown as Json })
    .eq('user_id', userId)
    .eq('item_key', String(itemKey))

  if (error) throw new Error(error.message)
}

export async function deleteCustomContentAction(
  table: CustomContentTable,
  itemKey: string | number,
): Promise<void> {
  const supabase = await createClient()
  const userId = await requireAuthUserId()

  const { error } = await supabase
    .from(table)
    .update({ is_deleted: true })
    .eq('user_id', userId)
    .eq('item_key', String(itemKey))

  if (error) throw new Error(error.message)
}
