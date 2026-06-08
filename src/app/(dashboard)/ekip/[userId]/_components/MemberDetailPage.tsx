'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Bot, Copy, Lock, Phone, Sparkles, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { getMemberDetailAction } from '@/app/(dashboard)/ekip/actions'
import { generateCoachingMessageAction } from '@/app/(dashboard)/saha-radar/actions'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { Skeleton } from '@/components/ui/Skeleton'
import { queryKeys } from '@/lib/query/keys'
import { waHref } from '@/lib/utils/waLink'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { toast } from 'sonner'
import { Z } from '@/lib/ui/zIndex'
import { ONBOARDING_STEPS } from '@/lib/team/types'

type ActivityLevel = 'active' | 'recent' | 'silent'

function activityLevel(lastActivityAt: string | null): ActivityLevel {
  if (!lastActivityAt) return 'silent'
  const days = Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / 86_400_000)
  return days <= 3 ? 'active' : days <= 7 ? 'recent' : 'silent'
}

function daysSinceActivity(lastActivityAt: string | null): number | null {
  if (!lastActivityAt) return null
  return Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / 86_400_000)
}

function ActivityBadge({ level, t }: { level: ActivityLevel; t: ReturnType<typeof useTranslation>['t'] }) {
  const label =
    level === 'active' ? t('crown.sahaRadarActive')
    : level === 'recent' ? t('crown.sahaRadarRecent')
    : t('crown.sahaRadarSilent')
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
      level === 'active'
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
        : level === 'recent'
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
    )}>
      <span className={clsx(
        'h-1.5 w-1.5 rounded-full',
        level === 'active' ? 'bg-emerald-500' : level === 'recent' ? 'bg-amber-400' : 'bg-rose-500',
      )} />
      {label}
    </span>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={clsx('flex flex-col items-center rounded-xl border px-3 py-3 text-center', color)}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide">{label}</span>
    </div>
  )
}

export function MemberDetailPage({ userId }: { userId: string }) {
  const { t, lang } = useTranslation()
  const { data: ws } = useWorkspace()
  const { hasAiFieldAccess, openUpgrade, UpgradePrompt } = useUpgradePrompt()
  const [generating, setGenerating] = useState(false)
  const [activeMessage, setActiveMessage] = useState<string | null>(null)
  const [memberPhone, setMemberPhone] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.memberDetail(ws?.workspaceId ?? '', userId),
    queryFn: () => getMemberDetailAction(ws!.workspaceId, userId),
    enabled: !!ws?.workspaceId,
    staleTime: 30_000,
  })

  async function handleCoachingAI() {
    if (!hasAiFieldAccess) { openUpgrade('ai_field'); return }
    const m = data?.member
    if (!m) return
    const days = daysSinceActivity(m.last_activity_at)
    const level = activityLevel(m.last_activity_at)
    setGenerating(true)
    try {
      const result = await generateCoachingMessageAction({
        memberName: m.full_name ?? '—',
        activityLevel: level,
        daysSinceActivity: days,
      })
      if (result.error || !result.message) {
        toast.error(result.error ?? 'Mesaj oluşturulamadı.')
        return
      }
      setMemberPhone(m.phone ?? null)
      setActiveMessage(result.message)
    } catch {
      toast.error('Mesaj oluşturulamadı.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      {UpgradePrompt}
      <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
        <div className="mx-auto w-full max-w-lg space-y-5">

          {/* Geri + Başlık */}
          <div className="flex items-center gap-3">
            <Link
              href="/ekip"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]"
              aria-label={t('dashboard.memberDetailBack')}
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
            </Link>
            <h1 className="text-xl font-bold text-[var(--text-1)]">
              {t('dashboard.memberDetailTitle')}
            </h1>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          ) : !data?.hasAccess || !data.member ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center">
              <p className="text-sm text-[var(--text-3)]">{t('dashboard.memberDetailNotFound')}</p>
            </div>
          ) : (() => {
            const m = data.member
            const level = activityLevel(m.last_activity_at)
            const days = daysSinceActivity(m.last_activity_at)
            const wa = m.phone ? waHref(m.phone) : null
            const joinedStr = m.joined_at
              ? new Date(m.joined_at).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
              : null
            const lastActiveStr = days === null
              ? t('crown.sahaRadarNeverActive')
              : days === 0
                ? t('crown.sahaRadarToday')
                : t('crown.sahaRadarDaysAgo', { count: days })
            const completedSteps = (m.onboarding_steps ?? []).length
            const totalSteps = ONBOARDING_STEPS.length

            return (
              <>
                {/* Header kartı */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                  <div className="flex items-center gap-4">
                    <PersonAvatar
                      name={m.full_name ?? '—'}
                      imageUrl={m.avatar_url ?? null}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-[var(--text-1)]">{m.full_name ?? '—'}</p>
                      {joinedStr && (
                        <p className="text-xs text-[var(--text-3)]">
                          {t('dashboard.memberDetailJoinedDate', { date: joinedStr })}
                        </p>
                      )}
                      <div className="mt-2">
                        <ActivityBadge level={level} t={t} />
                      </div>
                    </div>
                  </div>

                  {/* Eylem butonları */}
                  <div className="mt-4 flex gap-2">
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] text-white transition hover:scale-105 hover:shadow-md"
                        aria-label="WhatsApp"
                        title="WhatsApp"
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                      </a>
                    )}
                    {m.phone && (
                      <a
                        href={`tel:${m.phone}`}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A56DB] transition hover:scale-105 hover:shadow-md"
                        aria-label={t('pipeline.call')}
                        title={t('pipeline.call')}
                      >
                        <Phone className="h-4 w-4" strokeWidth={1.75} />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={handleCoachingAI}
                      disabled={generating}
                      className="relative flex h-10 items-center gap-2 rounded-xl bg-[#EEEDFE] px-3 text-[#534AB7] text-xs font-semibold transition hover:scale-[1.02] hover:shadow-md disabled:opacity-50 active:scale-95"
                      title={t('dashboard.memberDetailCoachCta')}
                    >
                      {generating ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#534AB7] border-t-transparent" />
                      ) : (
                        <Bot className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                      )}
                      {t('dashboard.memberDetailCoachCta')}
                      {!hasAiFieldAccess && (
                        <Lock className="h-2.5 w-2.5 shrink-0" strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Pipeline dağılımı */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-3)]">
                    {t('dashboard.memberDetailPipelineTitle')}
                  </p>
                  {m.candidate_count === 0 ? (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
                      <p className="text-sm text-[var(--text-3)]">
                        {t('dashboard.memberDetailNoCandidates')}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      <StatBox
                        label={t('stages.yeni')}
                        value={m.yeni_count}
                        color="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300"
                      />
                      <StatBox
                        label={t('stages.takip')}
                        value={m.takip_count}
                        color="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
                      />
                      <StatBox
                        label={t('stages.sunum')}
                        value={m.sunum_count}
                        color="border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-cyan-300"
                      />
                      <StatBox
                        label={t('stages.katildi')}
                        value={m.katildi_count}
                        color="border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900/40 dark:bg-teal-950/20 dark:text-teal-300"
                      />
                    </div>
                  )}
                </div>

                {/* Bu hafta aktivitesi */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-3)]">
                    {t('dashboard.memberDetailWeekTitle')}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-3 text-center">
                      <p className="text-xl font-bold text-[var(--text-1)]">
                        {data.weeklyActivity.calls}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
                        {t('dashboard.memberDetailWeeklyCalls')}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-3 text-center">
                      <p className="text-xl font-bold text-[var(--text-1)]">
                        {data.weeklyActivity.whatsapps}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
                        {t('dashboard.memberDetailWeeklyWA')}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-3 text-center">
                      <p className="text-xl font-bold text-[var(--text-1)]">{lastActiveStr}</p>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
                        {t('dashboard.memberDetailLastActive')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Doğru Başlangıç */}
                {completedSteps > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-3)]">
                      {t('dashboard.memberDetailOnboarding')}
                    </p>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-[var(--text-1)]">
                          {completedSteps} / {totalSteps}
                        </span>
                        <div className="h-2 flex-1 ml-3 rounded-full bg-[var(--bg-subtle)]">
                          <div
                            className="h-2 rounded-full bg-orange-500 transition-all"
                            style={{ width: `${Math.round((completedSteps / totalSteps) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {ONBOARDING_STEPS.map(step => {
                          const done = (m.onboarding_steps ?? []).includes(step.id)
                          return (
                            <li key={step.id} className="flex items-center gap-2 text-xs">
                              <span className={clsx(
                                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold',
                                done
                                  ? 'bg-orange-500 text-white'
                                  : 'border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-3)]',
                              )}>
                                {done ? '✓' : ''}
                              </span>
                              <span className={done ? 'text-[var(--text-2)]' : 'text-[var(--text-3)]'}>
                                {lang === 'en' ? step.label_en : step.label_tr}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )
          })()}

        </div>
      </main>

      {/* Coaching AI modal */}
      {activeMessage &&
        createPortal(
          <div className={`fixed inset-0 ${Z.confirmBackdrop} flex items-center justify-center p-4`}>
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setActiveMessage(null)}
            />
            <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border)] animate-in fade-in zoom-in-95 duration-200">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/20 text-[#534AB7]">
                    <Sparkles className="h-4 w-4 fill-current animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[var(--text-1)]">
                      {t('dashboard.memberDetailCoachCta')}
                    </h2>
                    <p className="text-[11px] text-[var(--text-3)] font-medium mt-0.5">
                      {data?.member?.full_name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMessage(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition-colors active:scale-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="relative mb-5">
                <textarea
                  value={activeMessage}
                  readOnly
                  rows={6}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-1)] leading-relaxed outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeMessage)
                    toast.success('Mesaj kopyalandı!')
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] transition hover:bg-[#EEEDFE] hover:text-[#534AB7] active:scale-95"
                  title="Kopyala"
                >
                  <Copy className="h-4 w-4" />
                </button>
                {memberPhone && waHref(memberPhone, activeMessage) && (
                  <a
                    href={waHref(memberPhone, activeMessage)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setActiveMessage(null)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] text-white transition hover:opacity-90 active:scale-95 shadow-[0_4px_12px_rgba(37,211,102,0.2)]"
                    title="WhatsApp ile Gönder"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
