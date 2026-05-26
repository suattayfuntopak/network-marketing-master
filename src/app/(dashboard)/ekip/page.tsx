'use client'

import { Users } from 'lucide-react'
import { EkipPanel } from './_components/EkipPanel'
import { useTranslation } from '@/providers/LanguageProvider'

export default function EkipPage() {
  const { lang } = useTranslation()

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAEEDA]">
          <Users className="h-5 w-5 text-[#854F0B]" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">
            {lang === 'en' ? 'My Team' : 'Ekibim'}
          </h1>
          <p className="text-sm text-[var(--text-3)]">
            {lang === 'en' ? 'Invite, manage, and evaluate your team members in the app' : 'Ekibini uygulamaya davet et, yönet, değerlendir'}
          </p>
        </div>
      </header>
      <EkipPanel />
    </main>
  )
}

