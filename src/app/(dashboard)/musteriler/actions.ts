'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { buildCustomerStats, type CustomerListResult } from '@/lib/domain/customerStats'
import { checkAIQuota, logAIGenerationFromQuota, quotaErrorCode, type AiQuotaErrorCode } from '@/lib/ai/checkQuota'
import { generateMessage } from '@/lib/ai/generateMessage'
import { GEMINI_FLASH } from '@/lib/ai/models'

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

/** Müşteri sipariş geçmişine göre teklif / yönlendirme mesajı üretir. */
export async function generateCustomerOutreachAction(
  customerId: string,
  lang: 'tr' | 'en' = 'tr',
): Promise<{ message?: string; error?: string; quotaError?: AiQuotaErrorCode }> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: lang === 'en' ? 'AI is not configured.' : 'YZ yapılandırması eksik.' }
  }
  if (!customerId) {
    return { error: lang === 'en' ? 'Customer not found.' : 'Müşteri bulunamadı.' }
  }

  const quota = await checkAIQuota('message', { lang })
  if (!quota.ok) return { error: quota.message, quotaError: quotaErrorCode(quota.reason) }

  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return { error: lang === 'en' ? 'Session required.' : 'Oturum gerekli.' }

  const workspaceId = await ownWorkspaceId(supabase, user.id)
  if (!workspaceId) return { error: lang === 'en' ? 'Workspace not found.' : 'Çalışma alanı bulunamadı.' }

  const [custRes, orderRes] = await Promise.all([
    supabase
      .from('nmm_customers')
      .select('id, full_name, phone, note')
      .eq('id', customerId)
      .eq('workspace_id', workspaceId)
      .eq('owner_id', user.id)
      .maybeSingle(),
    supabase
      .from('nmm_orders')
      .select('amount, ordered_at, note')
      .eq('customer_id', customerId)
      .eq('workspace_id', workspaceId)
      .eq('owner_id', user.id)
      .order('ordered_at', { ascending: false })
      .limit(12),
  ])

  const customer = custRes.data
  if (!customer) {
    return { error: lang === 'en' ? 'Customer not found.' : 'Müşteri bulunamadı.' }
  }

  const orders = orderRes.data ?? []
  const totalAmount = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
  const lastOrder = orders[0]
  const orderLines = orders
    .slice(0, 6)
    .map(o => {
      const date = o.ordered_at.slice(0, 10)
      const amt = Number(o.amount) || 0
      const note = o.note?.trim()
      return note ? `${date}: ₺${amt} (${note})` : `${date}: ₺${amt}`
    })
    .join('; ')

  const noteText = customer.note?.trim() ?? ''
  const hasOrders = orders.length > 0
  const messageType = hasOrders ? 'yeniden_siparis_daveti' : 'genel'
  const context = lang === 'en'
    ? hasOrders
      ? `This person is an existing customer. ${orders.length} order(s), total ₺${totalAmount}. Latest order: ${lastOrder?.ordered_at.slice(0, 10) ?? '—'}. History: ${orderLines || '—'}.${noteText ? ` Note: ${noteText}` : ''} Write a warm WhatsApp message referencing their purchase history — suggest a new order, replenishment, or helpful product guidance. Do not invent products they did not buy.`
      : `Registered customer with no orders yet.${noteText ? ` Note: ${noteText}` : ''} Write a friendly first outreach or product introduction message suitable for WhatsApp.`
    : hasOrders
      ? `Bu kişi mevcut müşteridir. ${orders.length} sipariş, toplam ₺${totalAmount}. Son sipariş: ${lastOrder?.ordered_at.slice(0, 10) ?? '—'}. Geçmiş: ${orderLines || '—'}.${noteText ? ` Not: ${noteText}` : ''} Sipariş geçmişine atıfta bulunarak sıcak bir WhatsApp mesajı yaz — yeni sipariş, tamamlayıcı ürün veya nazik yönlendirme öner. Satın almadığı ürün uydurma.`
      : `Kayıtlı müşteri; henüz sipariş yok.${noteText ? ` Not: ${noteText}` : ''} WhatsApp için samimi bir ilk tanışma veya ürün tanıtım mesajı yaz.`

  try {
    const message = await generateMessage({
      name: customer.full_name,
      stage: 'katildi',
      note: noteText,
      context,
      tone: hasOrders ? 'samimi' : 'merakli',
      messageType,
      warmth: 'ilik',
    })

    const preview = message.slice(0, 120).replace(/\n/g, ' ')
    await logAIGenerationFromQuota(quota, {
      note: 'message',
      noteTr: `customer:${customerId}:${preview}`,
      aiModel: GEMINI_FLASH,
    })

    return { message }
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err)
    return {
      error: lang === 'en'
        ? `Could not generate message: ${detail}`
        : `Mesaj oluşturulamadı: ${detail}`,
    }
  }
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
