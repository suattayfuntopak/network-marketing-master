'use client'

import Link from 'next/link'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { useDailyActions } from '@/hooks/useDailyActions'
import { SquareButton } from '@/components/ui/SquareButton'
import { Zap, TrendingUp, Bot, Users, CalendarDays, Trophy } from 'lucide-react'
import { ACTIVE_STAGES, STAGE_LABEL, STAGE_COLOR } from '@/lib/stages'

function daysAgoLabel(days: number): string {
  if (!isFinite(days)) return 'Hiç temas yok'
  if (days < 1) return 'Bugün'
  if (days < 2) return 'Dün'
  return `${Math.floor(days)} gün önce`
}

export function PanoContent() {
  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { candidates, isLoading: cLoading } = useCandidates(ws?.workspaceId)
  const { daily, remaining } = useDailyActions(candidates)

  const activeCount = candidates.filter(c => ACTIVE_STAGES.includes(c.stage)).length
  const joinedCount = candidates.filter(c => c.stage === 'katildi').length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar'
  const firstName = ws?.fullName?.split(' ')[0] ?? ''

  if (wsLoading || cLoading) {
    return (
      <div className="md:max-w-[80%] md:mx-auto space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-[var(--bg-subtle)]" />
        <div className="h-8 w-44 animate-pulse rounded bg-[var(--bg-subtle)]" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-[14px] bg-[var(--bg-subtle)]" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
      </div>
    )
  }

  return (
    <div className="md:max-w-[80%] md:mx-auto space-y-5">
      {/* Selamlama */}
      <header>
        <p className="text-sm font-medium text-[var(--text-2)]">{greeting},</p>
        <h1 className="text-2xl font-bold text-[var(--text-1)]">{firstName} 👋</h1>
      </header>

      {/* ── 6 hızlı erişim karesi (3 üst + 3 alt) ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <SquareButton icon={Zap}          label="Bugün İlgilen" color="purple" href="/bugun/ilgilen" />
        <SquareButton icon={TrendingUp}   label="Boru Hattı"   color="blue"   href="/pipeline"      />
        <SquareButton icon={Bot}          label="YZ Mesajı Üret" color="teal"   href="/yazar"         />
        <SquareButton icon={Users}        label="Ekibim"       color="amber"  href="/ekip"          />
        <SquareButton icon={CalendarDays} label="Takvim"       color="pink"   href="/takvim"        />
        <SquareButton icon={Trophy}       label="Kazanımlar"   color="coral"  href="/kazanimlar"    />
      </div>

      {/* ── İstatistik kartları — karelerle aynı genişlik ── */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-5 text-center">
          <p className="text-2xl font-bold text-[var(--text-1)] md:text-3xl">{candidates.length}</p>
          <p className="mt-1 text-xs text-[var(--text-3)]">Toplam Kişi</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-5 text-center">
          <p className="text-2xl font-bold text-[#534AB7] md:text-3xl">{activeCount}</p>
          <p className="mt-1 text-xs text-[var(--text-3)]">Aktif Aday</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-5 text-center">
          <p className="text-2xl font-bold text-[#0F6E56] md:text-3xl">{joinedCount}</p>
          <p className="mt-1 text-xs text-[var(--text-3)]">Katıldı</p>
        </div>
      </div>

      {/* ── Bugün Öncelikliler — karelerle aynı genişlik ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
            Bugün Öncelikliler
          </p>
          {(daily.length > 0 || remaining > 0) && (
            <Link
              href="/bugun/ilgilen"
              className="text-xs font-medium text-[#534AB7] transition hover:underline"
            >
              Tümünü gör →
            </Link>
          )}
        </div>

        {daily.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--text-3)]">
            Bugün için bekleyen eylem yok 🎉
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {daily.slice(0, 5).map(c => (
              <li key={c.id}>
                <Link
                  href={`/pipeline/${c.id}`}
                  className="flex items-center gap-3 py-2.5 px-2 rounded-xl transition hover:bg-[var(--bg-subtle)]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-xs font-bold text-[#534AB7]">
                    {c.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-1)]">{c.full_name}</p>
                    <p className="text-xs text-[var(--text-3)]">{daysAgoLabel(c.daysSinceContact)}</p>
                  </div>
                  <span className={clsx('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', STAGE_COLOR[c.stage])}>
                    {STAGE_LABEL[c.stage]}
                  </span>
                </Link>
              </li>
            ))}
            {remaining > 0 && (
              <li className="pt-2 text-center text-xs text-[var(--text-3)]">
                +{remaining} kişi daha bekliyor
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
