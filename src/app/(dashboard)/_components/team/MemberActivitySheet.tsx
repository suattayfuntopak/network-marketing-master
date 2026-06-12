'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  X, Phone, Bot, Pencil, ArrowRight, CalendarDays,
  Loader2, Target, Trash2, Activity,
} from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { Skeleton } from '@/components/ui/Skeleton'
import { useTranslation } from '@/providers/LanguageProvider'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { Z } from '@/lib/ui/zIndex'
import { waHref } from '@/lib/utils/waLink'
import { ONBOARDING_STEP_COUNT, type SheetActivityPeriod } from '@/lib/domain/pulse'
import { funnelMetricLabelKeys } from '@/lib/domain/metricLabels'
import { HubCrownFunnelGrid } from '@/components/hub/HubCrownFunnelGrid'
import {
  MemberActivityPeriodTabs,
  sheetPeriodToHubTab,
} from '@/components/team/MemberActivityPeriodTabs'
import { prefetchMemberActivity } from '@/lib/query/prefetchMemberActivity'
import { QUERY_STALE } from '@/lib/query/staleTimes'
import { fetchMemberUserGoalAction } from '@/app/(dashboard)/hedef/actions'
import { getMemberActivityDetailAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import {
  deleteMemberGoalAction,
  getMemberGoalsMapAction,
  upsertMemberGoalAction,
  type MemberGoalRow,
} from '@/app/(dashboard)/ekip/memberGoalsActions'
import { toast } from 'sonner'

export type MemberActivityTarget = {
  userId: string
  fullName: string | null
  phone?: string | null
  pipelineHref?: string | null
}

const METRICS_GRID_MIN_H = 'min-h-[22rem]'

interface Props {
  workspaceId: string
  member: MemberActivityTarget
  initialPeriod?: SheetActivityPeriod
  teamPulseUnlocked: boolean
  canEditGoal?: boolean
  /** Kart sekmesi gibi satır içi gösterim — başlık, iletişim, gizlilik notu yok */
  embedded?: boolean
  /** Lider kartında DDBR tamamlanmış kabul edilir (9/9) */
  memberIsLeader?: boolean
  /** Boru hattı aşama sayıları (Takipte / Katıldı) — gömülü aktivite sekmesi */
  pipelineTakipCount?: number
  onClose?: () => void
}

function MetricsGridSkeleton() {
  return (
    <div className={`grid grid-cols-2 gap-2 ${METRICS_GRID_MIN_H}`}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
      ))}
    </div>
  )
}

export function MemberActivitySheet({
  workspaceId,
  member,
  initialPeriod = '7d',
  teamPulseUnlocked,
  canEditGoal = false,
  embedded = false,
  memberIsLeader = false,
  pipelineTakipCount = 0,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [period, setPeriod] = useState<SheetActivityPeriod>(initialPeriod)
  const [goalEditing, setGoalEditing] = useState(false)
  const [goalPeople, setGoalPeople] = useState('')
  const [goalMonths, setGoalMonths] = useState('')
  const [goalSaving, setGoalSaving] = useState(false)

  useBodyScrollLock(!embedded)

  useEffect(() => {
    prefetchMemberActivity(queryClient, workspaceId, member.userId)
  }, [workspaceId, member.userId, queryClient])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['member-activity', workspaceId, member.userId, period],
    queryFn: () => getMemberActivityDetailAction(workspaceId, member.userId, period),
    staleTime: QUERY_STALE.memberActivity,
    placeholderData: keepPreviousData,
  })

  const { data: goalMap, refetch: refetchGoal } = useQuery({
    queryKey: ['member-goal', workspaceId, member.userId],
    queryFn: () => getMemberGoalsMapAction(workspaceId, [member.userId]),
    staleTime: 30_000,
    enabled: !embedded && canEditGoal,
  })

  const { data: memberSelfGoal } = useQuery({
    queryKey: ['member-user-goal', member.userId],
    queryFn: () => fetchMemberUserGoalAction(member.userId),
    staleTime: 30_000,
    enabled: embedded,
  })

  const goal: MemberGoalRow | undefined = goalMap?.[member.userId]

  const startGoalEdit = () => {
    setGoalPeople(goal ? String(goal.targetPeople) : '')
    setGoalMonths(goal ? String(goal.targetMonths) : '')
    setGoalEditing(true)
  }

  const handleSaveGoal = async () => {
    const people = parseInt(goalPeople, 10)
    const months = parseInt(goalMonths, 10)
    if (!people || !months) {
      toast.error(t('team.memberGoalInvalid'))
      return
    }
    setGoalSaving(true)
    try {
      await upsertMemberGoalAction(workspaceId, member.userId, people, months)
      toast.success(t('team.memberGoalSaved'))
      setGoalEditing(false)
      await refetchGoal()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setGoalSaving(false)
    }
  }

  const handleDeleteGoal = async () => {
    setGoalSaving(true)
    try {
      await deleteMemberGoalAction(workspaceId, member.userId)
      toast.success(t('team.memberGoalDeleted'))
      setGoalEditing(false)
      await refetchGoal()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setGoalSaving(false)
    }
  }

  const totalActions =
    (data?.calls ?? 0) + (data?.whatsapps ?? 0) + (data?.notes ?? 0) +
    (data?.stageChanges ?? 0) + (data?.aiActions ?? 0)

  const memberFunnelLabels = funnelMetricLabelKeys('member')
  const metricLabels = {
    calls: t(memberFunnelLabels.arama),
    newLeads: t(memberFunnelLabels.tanisma),
  }

  const metrics = [
    { icon: Phone, label: metricLabels.calls, value: data?.calls ?? 0, color: 'text-blue-600' },
    { icon: WhatsAppIcon, label: 'WhatsApp', value: data?.whatsapps ?? 0, color: 'text-[#128C7E]', isWa: true },
    { icon: Pencil, label: t('team.activityNotes'), value: data?.notes ?? 0, color: 'text-[var(--text-2)]' },
    { icon: ArrowRight, label: t('team.activityStageChanges'), value: data?.stageChanges ?? 0, color: 'text-amber-600' },
    { icon: Bot, label: t('team.activityAi'), value: data?.aiActions ?? 0, color: 'text-indigo-600' },
    ...(embedded
      ? [
          { icon: ArrowRight, label: t('stages.takip'), value: pipelineTakipCount, color: 'text-amber-600' },
        ]
      : []),
    { icon: CalendarDays, label: t('team.activityActiveDays'), value: data?.activeDays ?? 0, color: 'text-[var(--text-2)]' },
    { icon: Activity, label: t('team.activityTotalActions'), value: totalActions, color: 'text-brand' },
  ]

  const showMetricsSkeleton = isLoading && !data

  const panelBody = (
    <>
        <MemberActivityPeriodTabs active={period} onChange={setPeriod} />

        {embedded && memberSelfGoal && (
          <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-50/40 dark:bg-amber-950/20 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Target className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                {t('team.memberSelfGoalTitle')}
              </p>
            </div>
            <p className="text-sm font-bold text-[var(--text-1)]">
              {t('team.memberGoalChip', {
                people: memberSelfGoal.targetPeople,
                months: memberSelfGoal.targetMonths,
              })}
            </p>
          </div>
        )}

        {!embedded && (canEditGoal || goal) && (
          <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-50/40 dark:bg-amber-950/20 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                  {t('team.memberGoalTitle')}
                </p>
              </div>
              {canEditGoal && !goalEditing && (
                <button
                  type="button"
                  onClick={startGoalEdit}
                  className="text-xs font-bold text-brand dark:text-white hover:underline"
                >
                  {goal ? t('common.edit') : t('team.memberGoalSet')}
                </button>
              )}
            </div>

            {goalEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-3)]">
                      {t('team.memberGoalPeople')}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={goalPeople}
                      onChange={e => setGoalPeople(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm font-bold"
                      placeholder="100"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-3)]">
                      {t('team.memberGoalMonths')}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={goalMonths}
                      onChange={e => setGoalMonths(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm font-bold"
                      placeholder="6"
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={goalSaving}
                    onClick={handleSaveGoal}
                    className="flex-1 rounded-lg bg-brand py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {t('common.save')}
                  </button>
                  <button
                    type="button"
                    disabled={goalSaving}
                    onClick={() => setGoalEditing(false)}
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-bold text-[var(--text-2)]"
                  >
                    {t('common.cancel')}
                  </button>
                  {goal && (
                    <button
                      type="button"
                      disabled={goalSaving}
                      onClick={handleDeleteGoal}
                      className="rounded-lg border border-red-200 px-3 py-2 text-red-600"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : goal ? (
              <p className="text-sm font-bold text-[var(--text-1)]">
                {t('team.memberGoalChip', { people: goal.targetPeople, months: goal.targetMonths })}
              </p>
            ) : canEditGoal ? (
              <p className="text-xs text-[var(--text-3)]">{t('team.memberGoalEmpty')}</p>
            ) : null}
          </div>
        )}

        {data && (
          <div className={`mb-4 space-y-2 ${isFetching ? 'opacity-70' : ''}`}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-2)]">
                {t('team.activityFunnelTitle')}
              </p>
              {!embedded ? (
                <p className="mt-0.5 text-[10px] text-[var(--text-3)]">{t('team.activityFunnelHint')}</p>
              ) : null}
            </div>
            <HubCrownFunnelGrid
              actuals={data.funnel}
              targets={data.funnelTargets}
              hasGoal={data.hasMemberGoal}
              period={sheetPeriodToHubTab(period)}
              targetFooterKey={period === '30d' ? 'crown.hubRolling30Target' : undefined}
              hideNoGoalFooter={embedded}
              labelMode="member"
            />
          </div>
        )}

        <div className="relative">
          {isFetching && data && (
            <div className={`absolute right-0 top-0 ${Z.cardControls}`}>
              <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden />
            </div>
          )}
          {showMetricsSkeleton ? (
            <MetricsGridSkeleton />
          ) : (
            <div className={`grid grid-cols-2 gap-2 ${METRICS_GRID_MIN_H} ${isFetching ? 'opacity-70 transition-opacity' : ''}`}>
              {metrics.map(({ icon: Icon, label, value, color, isWa }) => (
                <div
                  key={label}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/50 p-3 flex items-center gap-3"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-card)] ${color}`}>
                    {isWa ? <Icon className="h-4 w-4" /> : <Icon className="h-4 w-4" strokeWidth={2} />}
                  </div>
                  <div>
                    <p className="text-xl font-black tabular-nums text-[var(--text-1)]">{value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-3)]">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {teamPulseUnlocked && data && (
          <div className={`mt-4 rounded-xl border border-teal-500/20 bg-teal-50/40 dark:bg-teal-950/20 p-4 space-y-2 ${isFetching ? 'opacity-70' : ''}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-teal-800 dark:text-teal-300">
              {t('team.activityLearningTitle')}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="text-left text-[var(--text-2)]">
                {t('pulse.colTraining')}: <strong className="text-[var(--text-1)]">%{data.trainingPct ?? 0}</strong>
              </span>
              <span className="text-right text-[var(--text-2)]">
                {t('pulse.colObjections')}: <strong className="text-[var(--text-1)]">%{data.objectionPct ?? 0}</strong>
              </span>
              <span className="text-left text-[var(--text-2)]">
                {t('pulse.colVideos')}: <strong className="text-[var(--text-1)]">%{data.videoPct ?? 0}</strong>
              </span>
              <span className="text-right text-[var(--text-2)]">
                {t('statsPage.colDqsg')}:{' '}
                <strong className="text-[var(--text-1)]">
                  {memberIsLeader
                    ? `${ONBOARDING_STEP_COUNT}/${ONBOARDING_STEP_COUNT}`
                    : `${data.onboardingDone ?? 0}/${ONBOARDING_STEP_COUNT}`}
                </strong>
              </span>
            </div>
          </div>
        )}

        {!embedded && (
          <p className="mt-4 text-xs italic text-[var(--text-3)] leading-relaxed">
            {t('team.activityPrivacyNote')}
          </p>
        )}

        {member.pipelineHref && (
          <Link
            href={member.pipelineHref}
            onClick={embedded ? undefined : onClose}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand/5 py-3 text-sm font-bold text-brand dark:text-white hover:bg-brand/10 dark:hover:bg-white/5 transition"
          >
            {t('team.activityOpenPipeline')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
    </>
  )

  if (embedded) {
    return <div className="w-full">{panelBody}</div>
  }

  const displayName = member.fullName ?? t('statsPage.unnamedMember')
  const telHref = member.phone ? `tel:${member.phone.replace(/\s/g, '')}` : null
  const waCheckIn = t('team.activityWaCheckIn', { name: displayName.split(' ')[0] ?? displayName })
  const waLink = waHref(member.phone, waCheckIn)

  return (
    <>
      <div className={`fixed inset-0 ${Z.sheetBackdrop} bg-black/40 backdrop-blur-sm`} onClick={onClose} />
      <div
        className={`fixed left-1/2 top-4 md:top-1/2 ${Z.sheet} w-[calc(100%-2rem)] md:w-[440px] -translate-x-1/2 translate-y-0 md:-translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-2xl`}
        style={{ maxHeight: 'calc(100dvh - 5.5rem)', overflowY: 'auto' }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[var(--text-1)] truncate">{displayName}</h2>
            <p className="text-sm text-[var(--text-3)] mt-0.5">{t('team.activitySheetSubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--bg-subtle)] transition"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {(telHref || waLink) && (
          <div className="flex gap-2 mb-4">
            {telHref && (
              <a
                href={telHref}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900/30 py-2.5 text-sm font-bold text-blue-700 dark:text-blue-300 transition active:scale-[0.98]"
              >
                <Phone className="h-4 w-4" />
                {t('team.callBtn')}
              </a>
            )}
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-whatsapp py-2.5 text-sm font-bold text-white transition active:scale-[0.98]"
              >
                <WhatsAppIcon className="h-4 w-4 fill-current" />
                WhatsApp
              </a>
            )}
          </div>
        )}

        {panelBody}
      </div>
    </>
  )
}
