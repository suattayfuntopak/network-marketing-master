'use client'

import { Lock } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { SquareButton } from '@/components/ui/SquareButton'
import { CalendarPeriodIcon } from '@/components/ui/CalendarPeriodIcon'
import { LauncherGrid, LauncherGridItem } from '@/components/ui/LauncherGrid'
import { useTranslation } from '@/providers/LanguageProvider'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { useWorkspace } from '@/hooks/useWorkspace'
import { PANO_ORGANIZATION_ITEMS } from '@/lib/domain/navigation'
import { prefetchRouteData } from '@/lib/query/prefetchNavData'

export function PanoLauncherGrid() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: ws } = useWorkspace()
  const { hasAiCoachAccess, openUpgrade, UpgradePrompt } = useUpgradePrompt()
  const items = PANO_ORGANIZATION_ITEMS

  function warmRoute(href: string) {
    prefetchRouteData(queryClient, href, ws?.workspaceId, ws)
  }

  return (
    <>
      <LauncherGrid>
        {items.map(({ href, translationKey, icon, color }) => {
          const isAiLocked = href === '/yazar' && !hasAiCoachAccess
          const periodIcon =
            href === '/haftalik-ozet' ? (
              <CalendarPeriodIcon days={7} className="h-8 w-8 drop-shadow-sm md:h-10 md:w-10" />
            ) : href === '/aylik-ozet' ? (
              <CalendarPeriodIcon days={30} className="h-8 w-8 drop-shadow-sm md:h-10 md:w-10" />
            ) : undefined

          return (
            <LauncherGridItem key={href} onPointerEnter={() => warmRoute(href)}>
              <SquareButton
                icon={icon}
                iconSlot={periodIcon}
                label={t(translationKey)}
                color={color}
                variant="crown"
                href={isAiLocked ? undefined : href}
                onClick={isAiLocked ? () => openUpgrade('ai_coach') : undefined}
                prominent
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
