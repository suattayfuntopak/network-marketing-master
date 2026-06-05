'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { SquareButton } from '@/components/ui/SquareButton'
import { BugunModuleSheet } from './BugunModuleSheet'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { PANO_LAUNCHER_ITEMS } from '@/lib/domain/navigation'

const TODAY_HUB_HREF = '/bugun/ilgilen'

export function PanoLauncherGrid() {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const isSuperAdmin = ws?.isSuperAdmin ?? false
  const teamLocked = !hasTeamPageAccess(ws?.licenseType, isSuperAdmin)
  const [hubOpen, setHubOpen] = useState(false)

  return (
    <>
      <div className="grid w-full grid-cols-2 gap-3">
        {PANO_LAUNCHER_ITEMS.map(({ href, translationKey, icon, color }) => {
          const isTeamLocked = href === '/ekip' && teamLocked
          const isTodayHub  = href === TODAY_HUB_HREF

          return (
            <div key={href} className="relative min-w-0">
              <SquareButton
                icon={icon}
                label={t(translationKey)}
                color={color}
                variant="crown"
                href={isTodayHub ? undefined : (isTeamLocked ? '/odeme' : href)}
                onClick={isTodayHub ? () => setHubOpen(true) : undefined}
                prominent
                className="w-full"
              />
              {isTeamLocked && (
                <span
                  className="pointer-events-none absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--bg-card)]/90 text-[var(--text-3)] shadow-sm"
                  aria-hidden
                >
                  <Lock className="h-3 w-3" strokeWidth={2.25} />
                </span>
              )}
            </div>
          )
        })}
      </div>

      <BugunModuleSheet open={hubOpen} onClose={() => setHubOpen(false)} />
    </>
  )
}
