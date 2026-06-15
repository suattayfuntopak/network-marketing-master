'use client'

import { Trophy, Share2, Lock } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useAchievements } from '@/hooks/useAchievements'
import { Skeleton } from '@/components/ui/Skeleton'
import { whatsappShareUrl } from '@/lib/utils/waLink'
import { APP_URL } from '@/lib/domain/constants'
import { logProductEventAction } from '@/app/(dashboard)/_shared-actions/productEvents'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'
import type { Achievement, AchievementGroup } from '@/lib/domain/achievements'

const GROUP_EMOJI: Record<AchievementGroup, string> = {
  streak: '🔥',
  candidates: '📇',
  team: '👥',
}

// i18n:unused tarayıcısı literal anahtarları görsün diye string'ler burada.
const GROUP_LABEL_KEY: Record<AchievementGroup, string> = {
  streak: 'achievements.streakLabel',
  candidates: 'achievements.candidatesLabel',
  team: 'achievements.teamLabel',
}

export function AchievementsCard() {
  const { t } = useTranslation()
  const { data, isLoading } = useAchievements()

  const labelFor = (a: Achievement) => t(GROUP_LABEL_KEY[a.group], { count: a.threshold })

  function share(a: Achievement) {
    const badge = labelFor(a)
    void logProductEventAction(PRODUCT_EVENTS.achievementShared, { id: a.id })
    window.open(whatsappShareUrl(t('achievements.shareMessage', { badge, url: APP_URL })), '_blank')
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-bold text-[var(--text-1)]">{t('achievements.title')}</h2>
        </div>
        {data && (
          <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-3)]">
            {t('achievements.earnedOf', { earned: data.earnedCount, total: data.achievements.length })}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : !data ? null : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {data.achievements.map(a => (
              <div
                key={a.id}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border p-2.5 text-center transition ${
                  a.earned
                    ? 'border-amber-300/50 bg-amber-500/10 dark:border-amber-500/25'
                    : 'border-[var(--border)] bg-[var(--bg-subtle)]/40 opacity-60'
                }`}
              >
                <span className="relative text-xl leading-none">
                  {GROUP_EMOJI[a.group]}
                  {!a.earned && (
                    <Lock className="absolute -right-2 -top-1 h-3 w-3 text-[var(--text-3)]" />
                  )}
                </span>
                <span className="mt-1 text-[11px] font-semibold leading-tight text-[var(--text-1)]">
                  {labelFor(a)}
                </span>
                {!a.earned && (
                  <span className="text-[9px] font-medium text-[var(--text-3)]">
                    {a.current}/{a.threshold}
                  </span>
                )}
              </div>
            ))}
          </div>

          {data.earnedCount === 0 ? (
            <p className="mt-3 text-xs text-[var(--text-3)]">{t('achievements.empty')}</p>
          ) : (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              {data.next && (
                <span className="text-xs text-[var(--text-3)]">
                  {t('achievements.nextHint', { badge: labelFor(data.next) })}
                </span>
              )}
              {data.topEarned && (
                <button
                  type="button"
                  onClick={() => share(data.topEarned!)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-500/20 active:scale-[0.98] dark:text-emerald-300"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {t('achievements.share')}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
