'use client'

import { Target } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { HubPageShell } from '@/components/hub/HubPageShell'
import { HedefKart } from '@/app/(dashboard)/pano/_components/HedefKart'
import { hedefAccent } from './hedefTheme'

export function HedefPage() {
  const { t } = useTranslation()

  return (
    <HubPageShell
      title={t('dashboard.panoActionPlan')}
      icon={Target}
      iconClassName={hedefAccent.icon}
      backHref="/pano"
      showRefresh={false}
    >
      <HedefKart />
    </HubPageShell>
  )
}
