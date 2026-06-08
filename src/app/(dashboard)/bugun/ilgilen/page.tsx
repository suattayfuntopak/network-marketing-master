'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const TAB_REDIRECTS: Record<string, string> = {
  journal: '/saha-ozetim?tab=daily',
  roadmap: '/hedefim',
  daily: '/saha-ozetim?tab=daily',
  weekly: '/saha-ozetim?tab=weekly',
  monthly: '/saha-ozetim?tab=monthly',
  first30: '/saha-radar',
  saharadar: '/saha-radar',
  live: '/canli-egitim',
  team: '/ekip',
}

function IlgilenLegacyRedirect() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const tab = searchParams.get('tab')
    const dest = tab ? TAB_REDIRECTS[tab] ?? '/hedefim' : '/hedefim'
    router.replace(dest)
  }, [searchParams, router])

  return (
    <main className="min-h-screen w-full bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="h-7 w-40 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
    </main>
  )
}

export default function IlgilenPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen w-full bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
          <div className="h-7 w-40 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
        </main>
      }
    >
      <IlgilenLegacyRedirect />
    </Suspense>
  )
}
