'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Crown, TrendingUp, Loader2 } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'
import { getTeamMemberDetailAction, type TeamMemberDetailData } from '../../../actions'
import { ONBOARDING_STEPS } from '../../../_components/EkipPanel'

export function TeamMemberDetail({ memberUserId }: { memberUserId: string }) {
  const router = useRouter()
  const { lang, t } = useTranslation()
  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const [member, setMember] = useState<TeamMemberDetailData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ws?.workspaceId) return
    let cancelled = false
    setLoading(true)
    getTeamMemberDetailAction(ws.workspaceId, memberUserId).then(res => {
      if (cancelled) return
      if (res.error) setError(res.error)
      else if (res.data) setMember(res.data)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [ws?.workspaceId, memberUserId])

  if (wsLoading || loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8 space-y-5">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </main>
    )
  }

  if (error || !member) {
    return (
      <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
        <button
          type="button"
          onClick={() => router.push('/ekip')}
          className="mb-6 flex items-center gap-2 text-sm font-bold text-[var(--text-2)] hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('team.backToTeam')}
        </button>
        <p className="text-center text-sm text-[var(--text-2)]">{error ?? t('team.memberNotFound')}</p>
      </main>
    )
  }

  const completed = new Set(member.onboarding_steps)
  const onboardingPct = Math.round((completed.size / ONBOARDING_STEPS.length) * 100)

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <button
        type="button"
        onClick={() => router.push('/ekip')}
        className="mb-6 flex items-center gap-2 text-sm font-bold text-[var(--text-2)] hover:text-brand transition"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('team.backToTeam')}
      </button>

      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full overflow-hidden bg-[#EEEDFE] text-2xl font-black text-brand">
            {member.avatar_url ? (
              <img src={member.avatar_url} alt={member.full_name ?? ''} className="h-full w-full object-cover" />
            ) : (
              (member.full_name ?? '?').charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[var(--text-1)] break-words">
                {member.full_name ?? t('team.unnamedMember')}
              </h1>
              {member.role === 'leader' && <Crown className="h-6 w-6 text-[#854F0B]" />}
            </div>
            <p className="text-sm text-[var(--text-2)] mt-1">
              {t('team.nmmPartner')}
              {member.joined_at && (
                <span className="text-[var(--text-3)]">
                  {' '}· {new Date(member.joined_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </p>
            {member.pipeline_id && (
              <Link
                href={`/pipeline/${member.pipeline_id}`}
                className="inline-block mt-2 text-sm font-bold text-brand hover:underline"
              >
                {t('team.viewPipelineProfile')}
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-2)] uppercase tracking-wider">
            <TrendingUp className="h-5 w-5 text-brand" />
            <span>{t('team.funnelDistribution')}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-5">
            <div className="rounded-xl bg-[var(--bg-subtle)] p-3">
              <span className="block text-2xl font-black text-accent-blue">{member.candidate_count}</span>
              <span className="text-xs font-bold text-[var(--text-2)]">{t('team.totalCandidates')}</span>
            </div>
            <div className="rounded-xl bg-blue-50/50 dark:bg-blue-950/10 p-3">
              <span className="block text-xl font-black text-blue-600">{member.yeni_count}</span>
              <span className="text-xs font-bold">{t('stages.yeni')}</span>
            </div>
            <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 p-3">
              <span className="block text-xl font-black text-emerald-600">{member.sunum_count}</span>
              <span className="text-xs font-bold">{t('stages.sunum')}</span>
            </div>
            <div className="rounded-xl bg-amber-50/50 dark:bg-amber-950/10 p-3">
              <span className="block text-xl font-black text-amber-600">{member.takip_count}</span>
              <span className="text-xs font-bold">{t('stages.takip')}</span>
            </div>
            <div className="rounded-xl bg-purple-50/50 dark:bg-purple-950/10 p-3 col-span-2 sm:col-span-1">
              <span className="block text-xl font-black text-purple-600">{member.katildi_count}</span>
              <span className="text-xs font-bold">{t('stages.katildi')}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[var(--text-2)]">
              {t('team.fourWeekStart')}
            </h2>
            <span className="text-sm font-black text-brand">{onboardingPct}%</span>
          </div>
          <ul className="space-y-2">
            {ONBOARDING_STEPS.map(step => {
              const done = completed.has(step.id)
              const label = lang === 'en' ? step.label_en : step.label_tr
              return (
                <li
                  key={step.id}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    done ? 'bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300' : 'bg-[var(--bg-subtle)] text-[var(--text-2)]'
                  }`}
                >
                  <span>{done ? '✓' : '○'}</span>
                  <span className="font-medium">{label}</span>
                </li>
              )
            })}
          </ul>
        </div>

        {member.last_activity_at && (
          <p className="text-xs text-center text-[var(--text-3)]">
            {t('team.lastActive')}{' '}
            {new Date(member.last_activity_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>
    </main>
  )
}
