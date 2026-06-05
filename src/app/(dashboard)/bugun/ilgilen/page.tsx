'use client'

import { IlgilenContent } from './_components/IlgilenContent'
import { IlgilenHubGrid } from './_components/CrownHomeMockGrid'
import { BugunHubSections } from './_components/BugunHubSections'

export default function IlgilenPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="w-full space-y-5">
        <IlgilenHubGrid />
        <BugunHubSections showFieldWeek />
        <IlgilenContent />
      </div>
    </main>
  )
}
