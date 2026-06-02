'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { useDailyActions } from '@/hooks/useDailyActions'
import { SquareButton } from '@/components/ui/SquareButton'
import { Zap, TrendingUp, Bot, Users, CalendarDays, Target, MessageCircleQuestion, BookOpen, Shield, BarChart2 } from 'lucide-react'
import { ACTIVE_STAGES, STAGE_COLOR } from '@/lib/domain/stages'
import { OnboardingModal } from './OnboardingModal'
import { useTranslation } from '@/providers/LanguageProvider'
import type { NmmCandidate } from '@/types/database.types'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { AccountStatusAlert } from './AccountStatusAlert'
import { PanoVideoStrip } from './PanoVideoStrip'
import { PanoFieldSummary } from './PanoFieldSummary'
import { PanoTeamCoachingAlert } from './PanoTeamCoachingAlert'


function MiniTrend({ candidates }: { candidates: NmmCandidate[] }) {
  const { lang, t } = useTranslation()
  const daysShort = lang === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  const bars = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (6 - i))
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      const count = candidates.filter(c => {
        const t = new Date(c.created_at)
        return t >= d && t < next
      }).length
      const dayIdx = (d.getDay() + 6) % 7 // Mon=0
      return { label: daysShort[dayIdx], count, isToday: i === 6 }
    })
  }, [candidates, daysShort])

  const max = Math.max(...bars.map(b => b.count), 1)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
          {t('shellUi.last7DaysTrend')}
        </p>
        <span className="text-xs font-bold text-[#534AB7]">
          {bars.reduce((s, b) => s + b.count, 0)} {t('shellUi.candidatesLabel')}
        </span>
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {bars.map((b, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-[var(--text-1)]">{b.count > 0 ? b.count : ''}</span>
            <div
              className={`w-full rounded-t-md transition-all ${b.isToday ? 'bg-[#534AB7]' : 'bg-[#EEEDFE] dark:bg-[#534AB7]/20'}`}
              style={{ height: `${Math.max((b.count / max) * 48, b.count > 0 ? 6 : 2)}px` }}
            />
            <span className={`text-[9px] font-semibold ${b.isToday ? 'text-[#534AB7]' : 'text-[var(--text-3)]'}`}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PanoContent() {
  const { t } = useTranslation()
  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { candidates, isLoading: cLoading } = useCandidates(ws?.workspaceId)
  const { daily, remaining } = useDailyActions(candidates)

  function daysAgoLabel(days: number): string {
    if (!isFinite(days)) return t('common.noContact')
    if (days < 1) return t('common.today')
    if (days < 2) return t('common.yesterday')
    return t('common.daysAgo', { days: Math.floor(days) })
  }

  const activeCount = candidates.filter(c => ACTIVE_STAGES.includes(c.stage)).length
  const joinedCount = candidates.filter(c => c.stage === 'katildi').length

  const hour = new Date().getHours()
  const greeting = hour < 5
    ? t('dashboard.greetingNight')
    : hour < 12
      ? t('dashboard.greetingMorning')
      : hour < 14
        ? t('dashboard.greetingAfternoon')
        : hour < 19
          ? t('dashboard.greetingDay')
          : t('dashboard.greetingEvening')

  const greetingIcon = hour < 5 ? '🌙' : hour < 12 ? '🌅' : hour < 14 ? '☀️' : hour < 19 ? '🌤️' : '🌙'
  const firstName = ws?.fullName?.split(' ')[0] ?? ''

  const statsSkeleton = (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
      ))}
    </div>
  )

  const prioritiesSkeleton = (
    <div className="h-48 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
  )

  return (
    <div className="w-full space-y-5">
      {/* Onboarding — modal kendini localStorage + mount-anı aday durumuyla yönetir.
          candidates.length'e bağlamıyoruz; yoksa adım 2'de aday eklenince akış kapanırdı. */}
      {!cLoading && ws && (
        <OnboardingModal
          workspaceId={ws.workspaceId}
          inviteCode={ws.inviteCode}
          hasCandidatesInitially={candidates.length > 0}
        />
      )}
      <AccountStatusAlert />

      {/* Selamlama */}
      <header>
        {wsLoading ? (
          <div className="h-8 w-56 animate-pulse rounded bg-[var(--bg-subtle)]" />
        ) : (
          <h1 className="text-2xl font-bold text-[var(--text-1)]">{greetingIcon} {greeting} {firstName} 👋🏻</h1>
        )}
      </header>

      {/* ── 10 hızlı erişim karesi — mobil 2 sütun (5 satır), masaüstü 5 sütun (2 satır) ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
        {/* Üst Sıra */}
        <SquareButton icon={Zap}                    label={t('nav.todayFocus')}     color="purple" desktopColor="purple" href="/bugun/ilgilen" />
        <SquareButton icon={TrendingUp}             label={t('nav.pipeline')}        color="teal"   desktopColor="teal"   href="/pipeline"      />
        <SquareButton icon={CalendarDays}           label={t('nav.takvim')}           color="pink"   desktopColor="pink"   href="/takvim"        />
        <SquareButton icon={Users}                  label={t('nav.ekip')}            color="amber"  desktopColor="amber"  href="/ekip"          />
        <SquareButton icon={BookOpen}               label={t('nav.egitim')}      color="teal"   desktopColor="cyan"   href="/egitim"        />

        {/* Alt Sıra */}
        <SquareButton icon={MessageCircleQuestion}  label={t('nav.itirazlar')} color="purple" desktopColor="pink"   href="/itirazlar"     />
        <SquareButton icon={Bot}                    label={t('nav.yazar')}    color="amber"  desktopColor="cyan"   href="/yazar"         />
        <SquareButton icon={Target}                 label={t('nav.sahaProvasi')}        color="pink"   desktopColor="yellow" href="/saha-provasi"    />
        <SquareButton icon={Shield}                 label={t('nav.uyum')}           color="purple" desktopColor="purple" href="/uyum"          />
        <SquareButton icon={BarChart2}              label={t('nav.istatistikler')}   color="teal"   desktopColor="teal"   href="/istatistikler" />
      </div>

      <PanoVideoStrip />
      <PanoFieldSummary />
      <PanoTeamCoachingAlert />

      {/* ── İstatistik kartları — karelerle aynı genişlik ── */}
      {cLoading ? statsSkeleton : (
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-5 text-center">
          <p className="text-2xl font-bold text-[var(--text-1)] md:text-3xl">{candidates.length}</p>
          <p className="mt-1 text-xs text-[var(--text-3)]">{t('dashboard.totalPeople')}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-5 text-center">
          <p className="text-2xl font-bold text-[#534AB7] md:text-3xl">{activeCount}</p>
          <p className="mt-1 text-xs text-[var(--text-3)]">{t('dashboard.activeCandidates')}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-5 text-center">
          <p className="text-2xl font-bold text-[#0F6E56] md:text-3xl">{joinedCount}</p>
          <p className="mt-1 text-xs text-[var(--text-3)]">{t('dashboard.joined')}</p>
        </div>
      </div>
      )}

      {/* ── Bugün Öncelikliler — karelerle aynı genişlik ── */}
      {cLoading ? prioritiesSkeleton : (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
            {t('dashboard.todayPriorities')}
          </p>
          {(daily.length > 0 || remaining > 0) && (
            <Link
              href="/bugun/ilgilen"
              className="text-xs font-medium text-[#534AB7] transition hover:underline"
            >
              {t('dashboard.seeAll')}
            </Link>
          )}
        </div>

        {daily.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--text-3)]">
            {t('dashboard.noPendingActions')}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {daily.slice(0, 5).map(c => (
              <li key={c.id}>
                <Link
                  href={`/pipeline/${c.id}`}
                  className="flex items-center gap-3 py-2.5 px-2 rounded-xl transition hover:bg-[var(--bg-subtle)]"
                >
                  <PersonAvatar
                    name={c.full_name}
                    imageUrl={resolveCandidateFields(c).avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-1)]">{c.full_name}</p>
                    <p className="text-xs text-[var(--text-3)]">{daysAgoLabel(c.daysSinceContact)}</p>
                  </div>
                  <span className={clsx('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', STAGE_COLOR[c.stage])}>
                    {t(`stages.${c.stage}`)}
                  </span>
                </Link>
              </li>
            ))}
            {remaining > 0 && (
              <li className="pt-2 text-center text-xs text-[var(--text-3)]">
                {t('dashboard.remainingPeople', { count: remaining })}
              </li>
            )}
          </ul>
        )}
      </div>
      )}

      {/* ── Mini trend (son 7 gün yeni aday) ── */}
      {cLoading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
      ) : (
        <MiniTrend candidates={candidates} />
      )}
    </div>
  )
}

