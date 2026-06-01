'use server'

import { createClient } from '@/lib/supabase/server'
import { createShopierPaymentSession } from '@/lib/domain/shopierPaymentSession'
import { sendBankTransferNotifyEmail } from '@/lib/infra/mail'

export type ShopierFormData = Record<string, string>

/** @deprecated Prefer POST /odeme/launch server HTML redirect. Kept for diagnostics. */
export async function initiateShopierPayment(
  plan: 'leader' | 'master' | 'pro',
  period: 'monthly' | 'yearly' = 'monthly'
): Promise<ShopierFormData> {
  return createShopierPaymentSession(plan, period)
}

/**
 * Havale/EFT yapan (giriş yapmış) kullanıcı "Ödedim, Bildir" dediğinde super admin'e
 * yapılandırılmış e-posta bildirimi gönderir. Kullanıcının kayıtlı e-postası otomatik
 * eklenir. Migration yok — mevcut Resend altyapısını kullanır.
 */
export async function notifyBankTransferAction(): Promise<boolean> {
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

  return sendBankTransferNotifyEmail(user.email, name, ws?.name ?? null, ws?.license_type ?? 'free')
}
