'use client'

import { Users } from 'lucide-react'
import { EkipPanel } from './_components/EkipPanel'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { FeatureUpgradeGate } from '@/components/ui/FeatureUpgradeGate'

export default function EkipPage() {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const locked = !hasTeamPageAccess(ws?.licenseType, ws?.isSuperAdmin)

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAEEDA]">
          <Users className="h-5 w-5 text-[#854F0B]" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">
            {t('team.title')}
          </h1>
          <p className="text-sm text-[var(--text-3)]">
            {t('team.subtitle')}
          </p>
        </div>
      </header>
      {locked ? (
        <FeatureUpgradeGate feature="team" locked>
          {null}
        </FeatureUpgradeGate>
      ) : (
        <EkipPanel />
      )}
    </main>
  )
}

