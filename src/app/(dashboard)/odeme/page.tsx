'use client'

import { CreditCard } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { OdemeClient } from './_components/OdemeClient'

export default function OdemePage() {
  const { lang } = useTranslation()

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <CreditCard className="h-5 w-5 text-indigo-400" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">
            {lang === 'en' ? 'Licensing & Premium Plans' : 'Lisans ve Premium Paketler'}
          </h1>
          <p className="text-sm text-[var(--text-3)]">
            {lang === 'en' 
              ? 'Select your plan, extend your license and unlock premium Organizer features' 
              : 'Ekip planınızı seçin, lisans sürenizi uzatın ve premium Lider özelliklerini aktif edin'}
          </p>
        </div>
      </header>

      <OdemeClient />
    </main>
  )
}
