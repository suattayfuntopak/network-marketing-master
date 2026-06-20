import type { UpgradeFeature } from '@/components/ui/UpgradePrompt'
import type { AiQuotaErrorCode } from '@/lib/ai/checkQuota'

/** YZ üretim action'larının ortak hata zarfı — `quotaError` varsa UI yönlendirir. */
export interface AiActionErrorResult {
  error?: string
  quotaError?: AiQuotaErrorCode
}

/**
 * YZ üretim hatasını TÜM butonlarda tutarlı sun: günlük kota dolmuş (`limit`) veya
 * plan özelliği kilitli (`feature`) → upgrade prompt (üst plana yönlendir); diğer
 * hatalar → toast. Böylece kotası biten Basic kullanıcı her butonda aynı "yükselt"
 * akışına düşer, yerine kuru bir toast görmez.
 *
 * @returns true → upgrade prompt açıldı; false → toast gösterildi.
 */
export function surfaceAiQuotaError(
  result: AiActionErrorResult,
  handlers: {
    openUpgrade: (feature: UpgradeFeature) => void
    toastError: (msg: string) => void
    feature: UpgradeFeature
    fallbackMessage: string
  },
): boolean {
  if (result.quotaError === 'limit' || result.quotaError === 'feature') {
    handlers.openUpgrade(handlers.feature)
    return true
  }
  handlers.toastError(result.error ?? handlers.fallbackMessage)
  return false
}
