'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Activity, ChevronRight, Clock, Users } from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { pageHeaderIconClass } from '@/lib/ui/pageHeaderIcon'
import { HubPageShell } from '@/components/hub/HubPageShell'
import { formatTabbedPageTitle } from '@/lib/ui/tabbedPageTitle'
import { HubSectionCard } from '@/components/hub/HubSectionCard'
import { getCrownSahaRadarAction } from '@/app/(dashboard)/saha-radar/actions'
import type { SahaRadarMember, SahaRadarFollowUp } from '@/app/(dashboard)/saha-radar/actions'
import { Skeleton } from '@/components/ui/Skeleton'
import { FollowUpCard, SahaRadarMemberCard } from './SahaRadarCards'
import { SahaRadarAiMessageModal, type ActiveAiMessage } from './SahaRadarAiMessageModal'

import { queryKeys } from '@/lib/query/keys'
import { QUERY_STALE } from '@/lib/query/staleTimes'
import { useMarkContacted } from '@/hooks/useCandidates'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { surfaceAiQuotaError } from '@/lib/ui/aiQuotaError'
import { generateQuickMessageAction } from '@/app/(dashboard)/bugun/ilgilen/actions'
import { generateCoachingMessageAction } from '@/app/(dashboard)/saha-radar/actions'
import { toast } from 'sonner'

type InnerTab = 'aktivite' | 'takipler'

function resolveSahaRadarTab(raw: string | null): InnerTab {
  return raw === 'aktivite' ? 'aktivite' : 'takipler'
}

export function CrownSahaRadarPage({ asTab = false }: { asTab?: boolean }) {
  const { t, lang } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const innerTab = resolveSahaRadarTab(searchParams.get('tab'))
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [coachingId, setCoachingId] = useState<string | null>(null)
  const [activeAiMessage, setActiveAiMessage] = useState<ActiveAiMessage | null>(null)

  const { data: ws } = useWorkspace()
  const markContacted = useMarkContacted(ws?.workspaceId ?? '')
  const { hasAiFieldAccess, openUpgrade, UpgradePrompt } = useUpgradePrompt()

  function selectInnerTab(next: InnerTab) {
    router.replace(`/saha-radar?tab=${next}`, { scroll: false })
  }

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.crownSahaRadar(ws?.workspaceId ?? ''),
    queryFn: () => getCrownSahaRadarAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
    staleTime: QUERY_STALE.metrics,
    refetchInterval: 60_000,
  })

  async function handleAIMessage(f: SahaRadarFollowUp) {
    if (!hasAiFieldAccess) {
      openUpgrade('ai_field')
      return
    }
    setGeneratingId(f.id)
    try {
      const result = await generateQuickMessageAction({
        name: f.candidateName,
        stage: f.stage,
        note: '',
      })
      if (result.error || !result.message) {
        surfaceAiQuotaError(result, {
          openUpgrade,
          toastError: (m) => toast.error(m),
          feature: 'ai_field',
          fallbackMessage: 'Mesaj oluşturulamadı.',
        })
        return
      }
      setActiveAiMessage({
        message: result.message,
        candidateName: f.candidateName,
        phone: f.phone,
        candidateId: f.id,
      })
      markContacted.mutate({ id: f.id, actionType: 'ai_generate' })
    } catch {
      toast.error('Mesaj oluşturulamadı.')
    } finally {
      setGeneratingId(null)
    }
  }

  async function handleCoachingAI(m: SahaRadarMember) {
    if (!hasAiFieldAccess) { openUpgrade('ai_field'); return }
    setCoachingId(m.userId)
    const customContext =
      typeof window !== 'undefined'
        ? localStorage.getItem(`nmm_tmpl_${m.activityLevel}`) || undefined
        : undefined
    try {
      const result = await generateCoachingMessageAction({
        memberName: m.fullName,
        activityLevel: m.activityLevel,
        daysSinceActivity: m.daysSinceActivity,
        targetUserId: m.userId,
        customContext,
      })
      if (result.error || !result.message) {
        surfaceAiQuotaError(result, {
          openUpgrade,
          toastError: (m) => toast.error(m),
          feature: 'ai_field',
          fallbackMessage: 'Mesaj oluşturulamadı.',
        })
        return
      }
      setActiveAiMessage({
        message: result.message,
        candidateName: m.fullName,
        phone: m.phone,
        candidateId: m.userId,
        isCoaching: true,
      })
    } catch {
      toast.error('Mesaj oluşturulamadı.')
    } finally {
      setCoachingId(null)
    }
  }

  const overdue = data?.followUps.filter(f => f.isOverdue) ?? []
  const upcoming = data?.followUps.filter(f => !f.isOverdue) ?? []
  const activeMembers = data?.members.filter(m => m.activityLevel === 'active').length ?? 0
  const silentMembers = data?.members.filter(m => m.activityLevel === 'silent').length ?? 0

  return (
    <>
      {UpgradePrompt}
      <HubPageShell
        title={formatTabbedPageTitle(
          t('crown.sahaRadarTitle'),
          innerTab === 'takipler' ? t('crown.sahaRadarTabFollowUps') : t('crown.sahaRadarTabActivity'),
        )}
        icon={Activity}
        iconClassName={pageHeaderIconClass('/saha-radar')}
        helpContext={innerTab}
        backHref="/pano"
        showRefresh={false}
        asTab={asTab}
      >
        {/* Sekme çubuğu */}
        <div
          className="no-swipe flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1"
          role="tablist"
          data-no-swipe="true"
          onTouchStart={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => selectInnerTab('takipler')}
            className={clsx(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition',
              innerTab === 'takipler'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]',
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            {t('crown.sahaRadarTabFollowUps')}
            {overdue.length > 0 && (
              <span
                className={clsx(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                  innerTab === 'takipler'
                    ? 'bg-white/20 text-white'
                    : 'bg-rose-500 text-white',
                )}
              >
                {overdue.length}
              </span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            data-testid="saha-radar-tab-activity"
            onClick={() => selectInnerTab('aktivite')}
            className={clsx(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition',
              innerTab === 'aktivite'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]',
            )}
          >
            <Users className="h-3.5 w-3.5" />
            {t('crown.sahaRadarTabActivity')}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {/* TAB: Takipler — hidden ile DOM'da tutulur; sekme geçişi anlık */}
            <div className={innerTab === 'takipler' ? 'space-y-4' : 'hidden'}>
                {overdue.length === 0 && upcoming.length === 0 ? (
                  <HubSectionCard>
                    <p className="text-center text-sm text-[var(--text-3)]">
                      {t('crown.sahaRadarNoFollowUps')}
                    </p>
                  </HubSectionCard>
                ) : (
                  <>
                    {overdue.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                          {t('crown.sahaRadarOverdueSection')} ({overdue.length})
                        </p>
                        <ul className="space-y-2">
                          {overdue.map(f => (
                            <FollowUpCard
                              key={f.id}
                              f={f}
                              t={t}
                              lang={lang}
                              onAIClick={handleAIMessage}
                              onWaClick={id =>
                                markContacted.mutate({ id, actionType: 'whatsapp' })
                              }
                              onCallClick={id =>
                                markContacted.mutate({ id, actionType: 'call' })
                              }
                              generatingId={generatingId}
                              hasAiFieldAccess={hasAiFieldAccess}
                            />
                          ))}
                        </ul>
                      </div>
                    )}
                    {upcoming.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-3)]">
                          {t('crown.sahaRadarUpcomingSection')} ({upcoming.length})
                        </p>
                        <ul className="space-y-2">
                          {upcoming.map(f => (
                            <FollowUpCard
                              key={f.id}
                              f={f}
                              t={t}
                              lang={lang}
                              onAIClick={handleAIMessage}
                              onWaClick={id =>
                                markContacted.mutate({ id, actionType: 'whatsapp' })
                              }
                              onCallClick={id =>
                                markContacted.mutate({ id, actionType: 'call' })
                              }
                              generatingId={generatingId}
                              hasAiFieldAccess={hasAiFieldAccess}
                            />
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
                <Link
                  href="/pipeline"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5 transition hover:bg-[var(--bg-subtle)]"
                >
                  <span className="text-sm font-semibold text-[var(--text-1)]">
                    {t('crown.sahaRadarPipelineCta')}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[var(--text-3)]" />
                </Link>
            </div>

            {/* TAB: Aktivite */}
            <div className={innerTab === 'aktivite' ? 'space-y-4' : 'hidden'}>
                {(data?.members.length ?? 0) === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-6 text-center space-y-3">
                    <p className="text-sm text-[var(--text-3)]">{t('crown.emptyTeam')}</p>
                    <p className="text-xs text-[var(--text-3)] leading-relaxed">
                      {t('crown.sahaRadarEmptyTeamHint')}
                    </p>
                    <Link
                      href="/ekibim"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
                    >
                      {t('crown.sahaRadarEmptyTeamCta')}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <div className="flex flex-1 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                          {t('crown.sahaRadarActiveCount', { count: activeMembers })}
                        </span>
                      </div>
                      {silentMembers > 0 && (
                        <div className="flex flex-1 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-900/40 dark:bg-rose-950/20">
                          <span className="h-2 w-2 rounded-full bg-rose-500" />
                          <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                            {t('crown.sahaRadarSilentCount', { count: silentMembers })}
                          </span>
                        </div>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {(data?.members ?? []).map(m => (
                        <SahaRadarMemberCard
                          key={m.userId}
                          m={m}
                          t={t}
                          onCoachAI={handleCoachingAI}
                          coachingId={coachingId}
                          hasAiFieldAccess={hasAiFieldAccess}
                        />
                      ))}
                    </ul>
                  </>
                )}
                <Link
                  href="/ekip"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5 transition hover:bg-[var(--bg-subtle)]"
                >
                  <span className="text-sm font-semibold text-[var(--text-1)]">
                    {t('crown.sahaRadarTeamCta')}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[var(--text-3)]" />
                </Link>
            </div>
          </>
        )}
      </HubPageShell>

      {/* AI mesaj modalı */}
      {activeAiMessage && (
        <SahaRadarAiMessageModal
          activeAiMessage={activeAiMessage}
          onClose={() => setActiveAiMessage(null)}
          onWaSend={id => markContacted.mutate({ id, actionType: 'whatsapp' })}
        />
      )}
    </>
  )
}
