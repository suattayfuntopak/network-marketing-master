'use client'

import Link from 'next/link'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { useDailyActions } from '@/hooks/useDailyActions'
import { SquareButton } from '@/components/ui/SquareButton'
import { Zap, TrendingUp, PenLine, Users, CalendarDays, Trophy } from 'lucide-react'
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
  const hotCount   = candidates.filter(c => c.stage === 'takip' || c.stage === 'sunum').length

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
        <div className="lg:flex lg:gap-6 lg:items-start">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:w-[450px] xl:w-[510px] lg:shrink-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-[14px] bg-[var(--bg-subtle)]" />
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:gap-3 lg:min-w-0">
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
              ))}
            </div>
            <div className="h-52 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="mb-5">
        <p className="text-sm font-medium text-[var(--text-2)]">{greeting},</p>
        <h1 className="text-2xl font-bold text-[var(--text-1)]">{firstName} 👋</h1>
      </header>

      {/* Mobile badges — hidden on desktop (right panel takes over) */}
      <div className="mb-5 flex gap-2 flex-wrap lg:hidden">
        <span className="rounded-full bg-[#FAEEDA] px-3 py-1 text-xs font-semibold text-[#854F0B]">
          {daily.length + remaining} aksiyon bekliyor
        </span>
        <span className="rounded-full bg-[#E1F5EE] px-3 py-1 text-xs font-semibold text-[#0F6E56]">
          {hotCount} sıcak aday
        </span>
      </div>

      <div className="lg:flex lg:gap-6 lg:items-start">
        {/* ── Sol: hızlı erişim kareleri ── */}
        <div className="mb-6 lg:mb-0 lg:shrink-0">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:w-[450px] xl:w-[510px]">
            <SquareButton icon={Zap}          label="Bugün İlgilen" color="purple" href="/bugun/ilgilen" />
            <SquareButton icon={TrendingUp}   label="Boru Hattı"   color="blue"   href="/pipeline"      />
            <SquareButton icon={PenLine}      label="Mesaj Yaz"    color="teal"   href="/yazar"         />
            <SquareButton icon={Users}        label="Ekibim"       color="amber"  href="/ekip"          />
            <SquareButton icon={CalendarDays} label="Takvim"       color="pink"   href="/takvim"        />
            <SquareButton icon={Trophy}       label="Kazanımlar"   color="coral"  href="/kazanimlar"    />
          </div>
        </div>

        {/* ── Sağ: özet panel — sadece desktop ── */}
        <div className="hidden lg:flex lg:flex-1 lg:min-w-0 lg:flex-col lg:gap-4">

          {/* Mini istatistikler */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-4 text-center">
              <p className="text-2xl font-bold text-[var(--text-1)]">{candidates.length}</p>
              <p className="mt-0.5 text-xs text-[var(--text-3)]">Toplam Kişi</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-4 text-center">
              <p className="text-2xl font-bold text-[#534AB7]">{activeCount}</p>
              <p className="mt-0.5 text-xs text-[var(--text-3)]">Aktif Aday</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-4 text-center">
              <p className="text-2xl font-bold text-[#0F6E56]">{joinedCount}</p>
              <p className="mt-0.5 text-xs text-[var(--text-3)]">Katıldı</p>
            </div>
          </div>

          {/* Bugün öncelikliler */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
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
              <ul className="space-y-1">
                {daily.slice(0, 5).map(c => (
                  <li key={c.id}>
                    <Link
                      href={`/pipeline/${c.id}`}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-[var(--bg-subtle)]"
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
                  <li className="pt-1 text-center text-xs text-[var(--text-3)]">
                    +{remaining} kişi daha bekliyor
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
