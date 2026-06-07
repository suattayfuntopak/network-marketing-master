'use client'

import { Lock } from 'lucide-react'
import { SquareButton } from '@/components/ui/SquareButton'
import { LauncherGrid, LauncherGridItem } from '@/components/ui/LauncherGrid'
import { useTranslation } from '@/providers/LanguageProvider'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { useUserGoal } from '@/hooks/useUserGoal'
import { useVideoCatalog } from '@/hooks/useVideoCatalog'
import { usePanoHubBadges } from '@/hooks/usePanoHubBadges'
import { PANO_ORGANIZATION_ITEMS } from '@/lib/domain/navigation'
import { getPanoLauncherBadge } from '@/lib/domain/panoProgress'

export function PanoLauncherGrid() {
  const { t } = useTranslation()
  const { hasAiCoachAccess, openUpgrade, UpgradePrompt } = useUpgradePrompt()
  const { progress } = useUserGoal()
  const { data: videoCatalog } = useVideoCatalog()
  const { weekly, monthly, first30ActiveCount } = usePanoHubBadges()
  const items = PANO_ORGANIZATION_ITEMS

  const badgeCtx = {
    progress,
    videoSummary: videoCatalog?.summary,
    weekly,
    monthly,
    first30ActiveCount,
  }

  return (
    <>
      <LauncherGrid fillViewport itemCount={items.length}>
        {items.map(({ href, translationKey, icon, color }) => {
          const isAiLocked = href === '/yazar' && !hasAiCoachAccess
          const badge = getPanoLauncherBadge(href, badgeCtx, t)

          return (
            <LauncherGridItem key={href} fillViewport>
              <SquareButton
                icon={icon}
                label={t(translationKey)}
                color={color}
                variant="crown"
                href={isAiLocked ? undefined : href}
                onClick={isAiLocked ? () => openUpgrade('ai_coach') : undefined}
                prominent
                fill
                badge={badge}
              />
              {isAiLocked && (
                <span
                  className="pointer-events-none absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--bg-card)]/90 text-[var(--text-3)] shadow-sm md:right-3 md:top-3"
                  aria-hidden
                >
                  <Lock className="h-3 w-3 md:h-3.5 md:w-3.5" strokeWidth={2.25} />
                </span>
              )}
            </LauncherGridItem>
          )
        })}
      </LauncherGrid>
      {UpgradePrompt}
    </>
  )
}
