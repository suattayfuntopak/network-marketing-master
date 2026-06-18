'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createShopierPaymentSession,
  createShopierStorefrontRedirect,
} from '@/lib/domain/shopierPaymentSession'
import { sendBankTransferNotifyEmail } from '@/lib/infra/mail'

export type ShopierFormData = Record<string, string>

/** @deprecated Prefer POST /odeme/launch server HTML redirect. Kept for diagnostics. */
export async function initiateShopierPayment(
  plan: 'basic' | 'plus' | 'pro',
  period: 'monthly' | 'yearly' = 'monthly'
): Promise<ShopierFormData> {
  return createShopierPaymentSession(plan, period)
}

/**
 * Havale/EFT yapan (giriş yapmış) kullanıcı "Ödedim, Bildir" dediğinde super admin'e
 * yapılandırılmış e-posta bildirimi gönderir. Kullanıcının kayıtlı e-postası otomatik
 * eklenir. Migration yok — mevcut Resend altyapısını kullanır.
 */
const INTENDED_PLAN_LABEL: Record<'basic' | 'plus' | 'pro', string> = {
  basic: 'Basic Partner',
  plus: 'Plus Lider',
  pro: 'Pro Lider',
}

export async function notifyBankTransferAction(
  intendedPlan?: 'basic' | 'plus' | 'pro',
): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return false

  const name =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email

  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('name, license_type')
    .eq('owner_id', user.id)
    .maybeSingle()

  return sendBankTransferNotifyEmail(
    user.email,
    name,
    ws?.name ?? null,
    ws?.license_type ?? 'free',
    intendedPlan ? INTENDED_PLAN_LABEL[intendedPlan] : null,
  )
}

/** Deneme bitişi "Basic ile devam et" → Shopier dükkan linki (workspace note ile). */
export async function getBasicShopierStorefrontUrlAction(): Promise<
  { ok: true; url: string } | { ok: false; error: string }
> {
  try {
    const url = await createShopierStorefrontRedirect('basic', 'monthly')
    return { ok: true, url }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ödeme başlatılamadı'
    console.error('[getBasicShopierStorefrontUrlAction]', message)
    return { ok: false, error: message }
  }
}
