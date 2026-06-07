'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Users } from 'lucide-react'
import { EkipPanel } from './EkipPanel'
import { EkipTabNav, isEkipTabId, type EkipTabId } from './EkipTabNav'
import { useTranslation } from '@/providers/LanguageProvider'

export function EkipPageContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const raw = searchParams.get('tab')
  const activeTab: EkipTabId = isEkipTabId(raw) ? raw : 'members'

  useEffect(() => {
    if (raw === 'team') router.replace('/ekip?tab=members', { scroll: false })
  }, [raw, router])

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAEEDA]">
          <Users className="h-5 w-5 text-[#854F0B]" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">{t('team.title')}</h1>
          <p className="text-sm text-[var(--text-2)]">{t('team.pageSubtitle')}</p>
        </div>
      </header>
      <EkipTabNav activeTab={activeTab} />
      <EkipPanel activeTab={activeTab} />
    </main>
  )
}
