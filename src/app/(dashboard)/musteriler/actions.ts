'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { buildCustomerStats, type CustomerListResult } from '@/lib/domain/customerStats'

const EMPTY: CustomerListResult = { customers: [], totalRevenue: 0, totalOrders: 0, customerCount: 0 }

async function ownWorkspaceId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.workspace_id ?? null
}

/** Müşteri listesi + sipariş özetleri (kendi satış tarafı). */
export async function getCustomersAction(): Promise<CustomerListResult> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return EMPTY

  const workspaceId = await ownWorkspaceId(supabase, user.id)
  if (!workspaceId) return EMPTY

  const [custRes, orderRes] = await Promise.all([
    supabase
      .from('nmm_customers')
      .select('id, full_name, phone, note, created_at')
      .eq('workspace_id', workspaceId)
      .eq('owner_id', user.id)
      .limit(2000),
    supabase
      .from('nmm_orders')
      .select('customer_id, amount, ordered_at')
      .eq('workspace_id', workspaceId)
      .eq('owner_id', user.id)
      .limit(10000),
  ])

  const orders = (orderRes.data ?? []).map(o => ({
    customer_id: o.customer_id,
    amount: Number(o.amount) || 0,
    ordered_at: o.ordered_at,
  }))

  return buildCustomerStats(custRes.data ?? [], orders)
}

export async function addCustomerAction(input: {
  fullName: string
  phone?: string
  note?: string
}): Promise<void> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  const fullName = input.fullName.trim()
  if (!fullName) throw new Error('İsim zorunlu.')

  const workspaceId = await ownWorkspaceId(supabase, user.id)
  if (!workspaceId) throw new Error('Çalışma alanı bulunamadı.')

  const { error } = await supabase.from('nmm_customers').insert({
    workspace_id: workspaceId,
    owner_id: user.id,
    full_name: fullName,
    phone: input.phone?.trim() || null,
    note: input.note?.trim().slice(0, 200) || null,
  })
  if (error) throw new Error(error.message)
}

export async function addOrderAction(input: {
  customerId: string
  amount: number
  note?: string
}): Promise<void> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  const amount = Number(input.amount)
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Geçersiz tutar.')
  if (!input.customerId) throw new Error('Müşteri bulunamadı.')

  const workspaceId = await ownWorkspaceId(supabase, user.id)
  if (!workspaceId) throw new Error('Çalışma alanı bulunamadı.')

  const { error } = await supabase.from('nmm_orders').insert({
    workspace_id: workspaceId,
    customer_id: input.customerId,
    owner_id: user.id,
    amount,
    note: input.note?.trim().slice(0, 200) || null,
  })
  if (error) throw new Error(error.message)
}

export async function deleteCustomerAction(customerId: string): Promise<void> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) throw new Error('Oturum bulunamadı.')
  if (!customerId) return

  const { error } = await supabase
    .from('nmm_customers')
    .delete()
    .eq('id', customerId)
    .eq('owner_id', user.id)
  if (error) throw new Error(error.message)
}
