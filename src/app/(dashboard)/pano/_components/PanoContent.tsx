'use client'

import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { useDailyActions } from '@/hooks/useDailyActions'
import { SquareButton } from '@/components/ui/SquareButton'
import { Zap, TrendingUp, PenLine, Users, CalendarDays, Trophy } from 'lucide-react'

export function PanoContent() {
  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { candidates, isLoading: cLoading } = useCandidates(ws?.workspaceId)
  const daily = useDailyActions(candidates)
  const hotCount = candidates.filter(c => c.stage === 'takip' || c.stage === 'sunum').length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar'
  const firstName = ws?.fullName?.split(' ')[0] ?? ''

  if (wsLoading || cLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="mb-2">
          <div className="h-4 w-24 animate-pulse rounded bg-[var(--bg-subtle)]" />
          <div className="mt-2 h-8 w-44 animate-pulse rounded bg-[var(--bg-subtle)]" />
        </div>
        <div className="flex gap-2">
          <div className="h-7 w-36 animate-pulse rounded-full bg-[var(--bg-subtle)]" />
          <div className="h-7 w-28 animate-pulse rounded-full bg-[var(--bg-subtle)]" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-[14px] bg-[var(--bg-subtle)]" />
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

      <div className="mb-5 flex gap-2 flex-wrap">
        <span className="rounded-full bg-[#FAEEDA] px-3 py-1 text-xs font-semibold text-[#854F0B]">
          {daily.length} aksiyon bekliyor
        </span>
        <span className="rounded-full bg-[#E1F5EE] px-3 py-1 text-xs font-semibold text-[#0F6E56]">
          {hotCount} sıcak aday
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <SquareButton compact icon={Zap}          label="Bugün İlgilen" color="purple" href="/bugun/ilgilen" />
        <SquareButton compact icon={TrendingUp}   label="Boru Hattı"   color="blue"   href="/pipeline"      />
        <SquareButton compact icon={PenLine}      label="Mesaj Yaz"    color="teal"   href="/yazar"         />
        <SquareButton compact icon={Users}        label="Ekibim"       color="amber"  href="/ekip"          />
        <SquareButton compact icon={CalendarDays} label="Takvim"       color="pink"   href="/takvim"        />
        <SquareButton compact icon={Trophy}       label="Kazanımlar"   color="coral"  href="/kazanimlar"    />
      </div>
    </>
  )
}
