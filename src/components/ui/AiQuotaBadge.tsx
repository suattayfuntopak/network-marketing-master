'use client'

import { useTranslation } from '@/providers/LanguageProvider'
import { useAILimits } from '@/hooks/useAILimits'
import type { UpgradeFeature } from '@/components/ui/UpgradePrompt'

/**
 * Günlük YZ kota göstergesi — YZ formlarında ortak desen:
 *  - süper admin → gizli (sınırsız),
 *  - kota açık → "Günlük YZ kotası: kullanılan/limit",
 *  - kota dolu → kırmızı tıklanabilir "Günlük Limite Ulaştınız" → upgrade prompt.
 *
 * `openUpgrade` çağıranın `useUpgradePrompt()`'undan gelir (prompt overlay'ini çağıran
 * render eder); badge yalnız sunum + tıklama. Yeni YZ formunda tek satırla tutarlılık.
 */
export function AiQuotaBadge({
  feature,
  openUpgrade,
  className = '',
}: {
  feature: UpgradeFeature
  openUpgrade: (feature: UpgradeFeature) => void
  className?: string
}) {
  const { t } = useTranslation()
  const { isSuperAdmin, aiUsed, dailyLimit, limitReached } = useAILimits()

  if (isSuperAdmin) return null

  if (limitReached) {
    return (
      <button
        type="button"
        onClick={() => openUpgrade(feature)}
        className={`text-sm font-bold text-[#C03E1F] underline underline-offset-2 cursor-pointer ${className}`}
      >
        {t('coachUi.dailyLimitReached')}
      </button>
    )
  }

  return (
    <p className={`text-sm font-bold text-[var(--text-3)] ${className}`}>
      {t('coachUi.dailyAiQuota', { used: aiUsed, limit: dailyLimit })}
    </p>
  )
}
