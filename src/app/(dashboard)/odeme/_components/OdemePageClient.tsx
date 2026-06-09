'use client'

import { Suspense } from 'react'
import { CreditCard } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'
import { OdemeClient } from './OdemeClient'

export function OdemePageClient() {
  const { t } = useTranslation()

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <CreditCard className="h-5 w-5 text-indigo-400" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">
            {t('paymentPage.headerTitle')}
          </h1>
        </div>
      </header>

      <Suspense fallback={<Skeleton className="h-[520px] w-full rounded-3xl" />}>
        <OdemeClient />
      </Suspense>
    </main>
  )
}
