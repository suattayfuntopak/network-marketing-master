'use client'

import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { useDailyActions } from '@/hooks/useDailyActions'
import { DailyList } from './DailyList'

export function BugunContent() {
  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { candidates, isLoading: cLoading } = useCandidates(ws?.workspaceId)

  const { daily } = useDailyActions(candidates)
  const hotCount = candidates.filter(c => c.stage === 'takip' || c.stage === 'sunum').length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar'
  const firstName = ws?.fullName?.split(' ')[0] ?? ''

  if (wsLoading || cLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="mb-6">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
          <div className="mt-1 h-8 w-48 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-7 w-36 animate-pulse rounded-full bg-gray-100" />
          <div className="h-7 w-28 animate-pulse rounded-full bg-gray-100" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="mb-6">
        <p className="text-sm font-medium text-[var(--text-2)]">{greeting},</p>
        <h1 className="text-2xl font-bold text-[var(--text-1)]">{firstName} 👋</h1>
      </header>

      <div className="mb-5 flex gap-2">
        <span className="rounded-full bg-[#FAEEDA] px-3 py-1 text-xs font-semibold text-[#854F0B]">
          {daily.length} aksiyon bekliyor
        </span>
        <span className="rounded-full bg-[#E1F5EE] px-3 py-1 text-xs font-semibold text-[#0F6E56]">
          {hotCount} sıcak aday
        </span>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-[var(--text-1)]">Bugün bunlarla ilgilen</h2>
        <DailyList candidates={candidates} />
      </section>
    </>
  )
}
