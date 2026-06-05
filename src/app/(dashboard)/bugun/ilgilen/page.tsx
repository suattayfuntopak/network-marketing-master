'use client'

import { IlgilenContent } from './_components/IlgilenContent'
import { CrownHomeMockGrid } from './_components/CrownHomeMockGrid'
import { BugunHubSections } from './_components/BugunHubSections'

export default function IlgilenPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="w-full space-y-5 md:mx-auto md:max-w-5xl">
        <CrownHomeMockGrid />
        <BugunHubSections showFieldWeek />
        <IlgilenContent />
      </div>
    </main>
  )
}
