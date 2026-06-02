'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  X, Phone, Bot, Pencil, ArrowRight, UserPlus, CalendarDays,
  Loader2,
} from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useTranslation } from '@/providers/LanguageProvider'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { Z } from '@/lib/ui/zIndex'
import { waHref } from '@/lib/utils/waLink'
import { ONBOARDING_STEP_COUNT, type SheetActivityPeriod } from '@/lib/domain/pulse'
import { getMemberActivityDetailAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'

export type MemberActivityTarget = {
  userId: string
  fullName: string | null
  phone?: string | null
  pipelineHref?: string | null
}

const SHEET_PERIODS: SheetActivityPeriod[] = ['today', '7d', '30d']

interface Props {
  workspaceId: string
  member: MemberActivityTarget
  initialPeriod?: SheetActivityPeriod
  teamPulseUnlocked: boolean
  onClose: () => void
}

function sheetPeriodLabel(t: (key: string) => string, p: SheetActivityPeriod): string {
  if (p === 'today') return t('pulse.periodToday')
  if (p === '7d') return t('statsPage.period7d')
  return t('statsPage.period30d')
}

export function MemberActivitySheet({
  workspaceId,
  member,
  initialPeriod = '7d',
  teamPulseUnlocked,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<SheetActivityPeriod>(initialPeriod)

  useBodyScrollLock()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['member-activity', workspaceId, member.userId, period],
    queryFn: () => getMemberActivityDetailAction(workspaceId, member.userId, period),
    staleTime: 15_000,
  })

  const displayName = member.fullName ?? t('statsPage.unnamedMember')
  const telHref = member.phone ? `tel:${member.phone.replace(/\s/g, '')}` : null
  const waCheckIn = t('team.activityWaCheckIn', { name: displayName.split(' ')[0] ?? displayName })
  const waLink = waHref(member.phone, waCheckIn)

  const metrics = [
    { icon: Phone, label: t('pulse.calls'), value: data?.calls ?? 0, color: 'text-blue-600' },
    { icon: WhatsAppIcon, label: 'WhatsApp', value: data?.whatsapps ?? 0, color: 'text-[#128C7E]', isWa: true },
    { icon: Pencil, label: t('team.activityNotes'), value: data?.notes ?? 0, color: 'text-[var(--text-2)]' },
    { icon: ArrowRight, label: t('team.activityStageChanges'), value: data?.stageChanges ?? 0, color: 'text-amber-600' },
    { icon: Bot, label: t('team.activityAi'), value: data?.aiActions ?? 0, color: 'text-indigo-600' },
    { icon: UserPlus, label: t('team.activityNewLeads'), value: data?.newCandidates ?? 0, color: 'text-emerald-600' },
    { icon: CalendarDays, label: t('team.activityActiveDays'), value: data?.activeDays ?? 0, color: 'text-[var(--text-2)]' },
  ]

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
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-bold text-white transition active:scale-[0.98]"
              >
                <WhatsAppIcon className="h-4 w-4 fill-current" />
                WhatsApp
              </a>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-0.5 mb-4">
          {SHEET_PERIODS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`flex-1 min-w-[4.5rem] rounded-lg py-1.5 text-xs font-bold transition ${
                period === p
                  ? 'bg-[var(--bg-card)] text-brand shadow-sm border border-[var(--border)]'
                  : 'text-[var(--text-3)]'
              }`}
            >
              {sheetPeriodLabel(t, p)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-2 gap-2 ${isFetching ? 'opacity-60' : ''}`}>
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

            {teamPulseUnlocked && data && (
              <div className="mt-4 rounded-xl border border-teal-500/20 bg-teal-50/40 dark:bg-teal-950/20 p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-teal-800 dark:text-teal-300">
                  {t('team.activityLearningTitle')}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-[var(--text-2)]">
                    {t('pulse.colTraining')}: <strong className="text-[var(--text-1)]">%{data.trainingPct ?? 0}</strong>
                  </span>
                  <span className="text-[var(--text-2)]">
                    {t('pulse.colObjections')}: <strong className="text-[var(--text-1)]">%{data.objectionPct ?? 0}</strong>
                  </span>
                  <span className="text-[var(--text-2)]">
                    {t('pulse.colVideos')}: <strong className="text-[var(--text-1)]">%{data.videoPct ?? 0}</strong>
                    {data.videoTotal != null && data.videoTotal > 0 && (
                      <span className="text-xs text-[var(--text-3)]">
                        {' '}({data.videoCompleted}/{data.videoTotal})
                      </span>
                    )}
                  </span>
                  <span className="text-[var(--text-2)]">
                    {t('statsPage.colDqsg')}: <strong className="text-[var(--text-1)]">{data.onboardingDone ?? 0}/{ONBOARDING_STEP_COUNT}</strong>
                  </span>
                </div>
              </div>
            )}

            <p className="mt-4 text-xs italic text-[var(--text-3)] leading-relaxed">
              {t('team.activityPrivacyNote')}
            </p>
          </>
        )}

        {member.pipelineHref && (
          <Link
            href={member.pipelineHref}
            onClick={onClose}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand/5 py-3 text-sm font-bold text-brand hover:bg-brand/10 transition"
          >
            {t('team.activityOpenPipeline')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </>
  )
}
