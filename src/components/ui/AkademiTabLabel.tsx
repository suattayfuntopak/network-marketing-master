'use client'

import { useTranslation } from '@/providers/LanguageProvider'
import type { AkademiTab } from '@/lib/domain/akademiTab'
import { AKADEMI_TABS } from '@/lib/ui/akademiTabTheme'

type AkademiTabLabelProps = {
  tab: AkademiTab
  className?: string
}

/** Masaüstü tam etiket; mobilde kısa etiket — tek satır, sm+ dokunulmaz. */
export function AkademiTabLabel({ tab, className }: AkademiTabLabelProps) {
  const { t } = useTranslation()
  const row = AKADEMI_TABS.find(r => r.key === tab)
  if (!row) return null
  return (
    <span className={className}>
      <span className="sm:hidden">{t(row.labelKeyMobile)}</span>
      <span className="hidden sm:inline">{t(row.labelKey)}</span>
    </span>
  )
}
