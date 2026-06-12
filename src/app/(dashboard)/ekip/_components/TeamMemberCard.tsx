'use client'

import { type ComponentType } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import { Crown, Check, Rocket, Bot, Phone, BarChart3, UserPlus, UserMinus, Target } from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { getTeamMemberCardClasses } from '@/lib/ui/teamMemberCard'
import { ONBOARDING_STEPS } from '@/lib/team/types'
import { ONBOARDING_STEP_COUNT } from '@/lib/domain/pulse'
import { waHref } from '@/lib/utils/waLink'
import type { MemberRow } from '@/lib/team/types'
import type { WorkspaceContext } from '@/hooks/useWorkspace'
import type { MemberGoalRow } from '@/app/(dashboard)/ekip/memberGoalsActions'
import { MemberActivitySheet } from '@/app/(dashboard)/_components/team/MemberActivitySheet'
import type { UpgradeFeature } from '@/components/ui/UpgradePrompt'

export type MemberCardTab = 'onboarding' | 'call' | 'whatsapp' | 'activity'

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string

type Props = {
  m: MemberRow
  ws: WorkspaceContext
  now: number
  isLeader: boolean
  hasMasterAccess: boolean
  linkingMemberId: string | null
  activeTab: MemberCardTab | undefined
  onboardingWeek: 1 | 2 | 3 | 4
  memberGoalsMap: Record<string, MemberGoalRow>
  teamPulseUnlocked: boolean
  lang: string
  t: TranslateFn
  hasAiFieldAccess: boolean
  onSelectTab: (tab: MemberCardTab) => void
  onPrefetchActivity: () => void
  onSetOnboardingWeek: (week: 1 | 2 | 3 | 4) => void
  onToggleOnboardingStep: (stepId: string, isDone: boolean) => void
  onLinkToPipeline: () => void
  onRemoveFromTeam: () => void
  onInviteMember: () => void
  onSetOnboardingCoachData: (data: { memberName: string; stepId: string; phone?: string | null } | null) => void
  onOpenUpgrade: (feature?: UpgradeFeature) => void
}

export function TeamMemberCard({
  m, ws, now, isLeader, hasMasterAccess, linkingMemberId,
  activeTab, onboardingWeek, memberGoalsMap, teamPulseUnlocked,
  lang, t, hasAiFieldAccess, onSelectTab, onPrefetchActivity,
  onSetOnboardingWeek, onToggleOnboardingStep, onLinkToPipeline, onRemoveFromTeam,
  onInviteMember, onSetOnboardingCoachData, onOpenUpgrade,
}: Props) {
  const router = useRouter()
  const isCurrentUser = m.user_id === ws.userId
  const lastActiveDate = m.last_activity_at ? new Date(m.last_activity_at) : null
  const daysInactive = lastActiveDate ? Math.floor((now - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)) : 999
  const isInactive = daysInactive >= 7 && !isCurrentUser
  const onboardingDone = m.onboarding_steps?.length ?? 0
  const onboardingPct = Math.min(100, Math.round((onboardingDone / ONBOARDING_STEP_COUNT) * 100))
  const telHref = m.phone ? `tel:${m.phone.replace(/\s/g, '')}` : null
  const waDirect = waHref(m.phone)
  const waQuick = waDirect
    ?? waHref(m.phone, t('team.activityWaCheckIn', { name: (m.full_name ?? '').split(' ')[0] || t('common.member') }))

  const memberTabs: {
    id: MemberCardTab
    Icon: ComponentType<{ className?: string }>
    label: string
    show: boolean
    className?: string
    wa?: boolean
  }[] = [
    { id: 'activity', Icon: BarChart3, label: t('team.activityBtn'), show: isLeader },
    { id: 'onboarding', Icon: Rocket, label: t('team.correctStartGuide'), show: m.role === 'member' },
    { id: 'whatsapp', Icon: WhatsAppIcon, label: 'WhatsApp', show: m.role === 'member', wa: true },
    { id: 'call', Icon: Phone, label: t('team.callBtn'), show: !!telHref, className: 'sm:hidden' },
  ]
  const visibleTabs = memberTabs.filter(tab => tab.show)

  const roleBadge = m.role === 'leader' ? (
    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/40 border border-amber-200/30 dark:border-amber-900/20 px-2 py-0.5 text-[10px] font-black text-[#854F0B] dark:text-amber-400 leading-none">
      <Crown className="h-3 w-3" strokeWidth={2.5} />
      <span>{t('common.leader')}</span>
    </span>
  ) : m.isAppUser !== false ? (
    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/40 border border-purple-200/30 dark:border-purple-900/20 px-2 py-0.5 text-[10px] font-black text-purple-700 dark:text-purple-400 leading-none">
      <span>💎</span>
      <span>{t('team.nmmPartner')}</span>
    </span>
  ) : (
    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/30 dark:border-zinc-700/20 px-2 py-0.5 text-[10px] font-black text-zinc-600 dark:text-zinc-400 leading-none">
      <span>🤝</span>
      <span>{t('team.fieldPartner')}</span>
    </span>
  )

  const profileClass = 'flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3'
  const profileInner = (
    <>
      <PersonAvatar name={m.full_name ?? '?'} imageUrl={m.avatar_url} size="md" className="font-black shrink-0" />
      <p className="min-w-0 truncate text-sm sm:text-base font-black text-[var(--text-1)] leading-tight">
        {m.full_name ?? t('statsPage.unnamedMember')}
      </p>
      {roleBadge}
    </>
  )

  return (
    <div
      data-testid={`team-member-card-${m.user_id}`}
      className={clsx('overflow-hidden rounded-2xl border transition-all duration-200 p-4 sm:p-5 shadow-sm hover:shadow-md space-y-4', getTeamMemberCardClasses(m, isInactive))}
    >
      {/* Header: profil + davet */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {m.pipeline_id ? (
          <Link href={`/pipeline/${m.pipeline_id}`} className={`${profileClass} hover:opacity-80 transition cursor-pointer`}>{profileInner}</Link>
        ) : (
          <div className={profileClass}>{profileInner}</div>
        )}
        {m.isAppUser === false && isLeader ? (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onInviteMember() }}
            className="ml-auto inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-2.5 py-2 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-600 active:scale-[0.98] cursor-pointer sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
            aria-label={t('team.inviteToNmm')}
          >
            <UserPlus className="h-4 w-4 shrink-0 sm:hidden" strokeWidth={2.5} />
            <WhatsAppIcon className="h-4 w-4 shrink-0 fill-current text-white sm:h-5 sm:w-5" />
            <span className="hidden whitespace-nowrap sm:inline">{t('team.inviteToNmm')}</span>
          </button>
        ) : null}
      </div>

      {/* Yalnız Listem'de OLMAYAN (pipeline_id yok) ekip üyesinde: Listeye Ekle + Ekipten Çıkar.
          Listem'de + ekipte olan üyede hiçbiri görünmez. */}
      {isLeader && m.isAppUser !== false && m.role === 'member' && !m.pipeline_id ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={linkingMemberId === m.user_id}
            onClick={e => { e.stopPropagation(); onLinkToPipeline() }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand/25 bg-brand/5 px-3 py-2.5 text-xs font-bold text-brand transition hover:bg-brand/10 disabled:opacity-50"
            aria-label={t('team.linkToPipeline')}
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{t('team.linkToPipeline')}</span>
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onRemoveFromTeam() }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/40 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40"
            aria-label={t('team.removeFromTeam')}
          >
            <UserMinus className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{t('team.removeFromTeam')}</span>
          </button>
        </div>
      ) : null}

      {/* NMM kullanıcıları: ikon sekmeleri + içerik */}
      {m.isAppUser !== false && (
        <div className="border-t border-dashed border-[var(--border)] pt-4 space-y-4">
          <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-1" role="tablist" aria-label={t('team.memberDetailTabs')}>
            {visibleTabs.map(({ id, Icon, label, className, wa }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                aria-label={label}
                title={label}
                onClick={e => {
                  e.stopPropagation()
                  if (id === 'whatsapp') {
                    if (waDirect) {
                      window.open(waDirect, '_blank', 'noopener,noreferrer')
                    } else {
                      toast.error(t('team.noPhone'))
                    }
                    return
                  }
                  if (id === 'activity') onPrefetchActivity()
                  onSelectTab(id)
                }}
                onPointerEnter={() => { if (id === 'activity') onPrefetchActivity() }}
                className={clsx(
                  'flex h-10 flex-1 items-center justify-center rounded-lg transition-all cursor-pointer',
                  activeTab === id
                    ? 'bg-[var(--bg-card)] text-brand dark:text-indigo-300 shadow-sm border border-[var(--border)]'
                    : 'text-[var(--text-3)] hover:text-[var(--text-2)]',
                  className
                )}
              >
                {wa ? <WhatsAppIcon className="h-5 w-5 fill-current" /> : <Icon className="h-5 w-5" />}
              </button>
            ))}
          </div>

          {memberGoalsMap[m.user_id] && activeTab === 'onboarding' && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
              <Target className="h-3.5 w-3.5 shrink-0" />
              {t('team.memberGoalChip', {
                people: memberGoalsMap[m.user_id].targetPeople,
                months: memberGoalsMap[m.user_id].targetMonths,
              })}
            </div>
          )}

          {activeTab != null && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200" role="tabpanel">
              {!hasMasterAccess && m.user_id !== ws.userId ? (
                <div className="rounded-2xl border border-brand/30 bg-[#12111E]/40 p-6 text-center space-y-4 max-w-xl mx-auto my-3 backdrop-blur-xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 mx-auto text-brand">
                    <Crown className="h-5 w-5 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">{t('team.plusRequired')}</h4>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{t('team.plusRequiredDesc')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); router.push('/odeme') }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand to-brand-accent text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-indigo-500/10 active:scale-95 transition cursor-pointer border-0"
                  >
                    <span>{t('team.upgradeToMaster')}</span>
                  </button>
                </div>
              ) : activeTab === 'onboarding' ? (
                <div className="space-y-4">
                  <div className="flex gap-2 bg-[var(--bg-subtle)] dark:bg-zinc-900/50 p-1 rounded-xl border border-[var(--border)]">
                    {([1, 2, 3, 4] as const).map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => onSetOnboardingWeek(w)}
                        className={clsx(
                          'flex-1 text-xs font-extrabold py-2 rounded-lg transition-all cursor-pointer',
                          onboardingWeek === w
                            ? 'bg-[var(--bg-card)] dark:bg-zinc-800 text-[#854F0B] dark:text-[#fbbf24] shadow-sm border border-[var(--border)]'
                            : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
                        )}
                      >
                        {t('team.weekLabel', { w })}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-end gap-2 text-xs">
                      <span className="font-black tabular-nums text-[#854F0B] dark:text-[#fbbf24]">
                        {onboardingDone}/{ONBOARDING_STEP_COUNT} · %{onboardingPct}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                      <div className="h-full rounded-full bg-[#854F0B] dark:bg-[#fbbf24] transition-all" style={{ width: `${onboardingPct}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {ONBOARDING_STEPS.filter(s => s.week === onboardingWeek).map(step => {
                      const isStepDone = m.onboarding_steps?.includes(step.id) ?? false
                      return (
                        <div
                          key={step.id}
                          className={clsx(
                            'w-full flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all',
                            isStepDone
                              ? 'border-emerald-200/50 dark:border-emerald-950/20 bg-emerald-50/5 dark:bg-emerald-950/5 text-[var(--text-1)]'
                              : 'border-[var(--border)] bg-[var(--bg-subtle)] dark:bg-zinc-900/30 text-[var(--text-2)]'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => onToggleOnboardingStep(step.id, isStepDone)}
                            className="flex-1 flex items-center gap-3 text-left cursor-pointer active:scale-[0.99] transition-all"
                          >
                            <span className={clsx('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all', isStepDone ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--text-3)] bg-transparent')}>
                              {isStepDone && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />}
                            </span>
                            <span className="text-sm font-semibold leading-tight pr-2">
                              {lang === 'en' ? step.label_en : step.label_tr}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              if (!hasAiFieldAccess) { onOpenUpgrade('ai_field'); return }
                              onSetOnboardingCoachData({ memberName: m.full_name || '', stepId: step.id, phone: m.phone ?? null })
                            }}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[#0F6E56] dark:text-[#5eead4] hover:scale-105 active:scale-95 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05)] cursor-pointer"
                            title={t('team.aiCoachingScript')}
                          >
                            <Bot className="h-5 w-5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : activeTab === 'call' && telHref ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6">
                  <p className="text-sm font-semibold text-[var(--text-2)] text-center">
                    {t('team.callMemberHint', { name: (m.full_name ?? '').split(' ')[0] || t('common.member'), phone: m.phone ?? '' })}
                  </p>
                  <a
                    href={telHref}
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200/60 bg-blue-50/80 dark:bg-blue-950/20 px-6 py-3 text-sm font-bold text-blue-700 dark:text-blue-300 transition active:scale-95"
                  >
                    <Phone className="h-5 w-5" />
                    {t('team.callBtn')}
                  </a>
                </div>
              ) : activeTab === 'whatsapp' && waQuick ? (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6">
                  <p className="text-sm text-[var(--text-2)] text-center leading-relaxed max-w-sm">
                    {t('team.activityWaCheckIn', { name: (m.full_name ?? '').split(' ')[0] || t('common.member') })}
                  </p>
                  <a
                    href={waQuick}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-2 rounded-xl bg-whatsapp px-6 py-3 text-sm font-bold text-white transition active:scale-95"
                  >
                    <WhatsAppIcon className="h-5 w-5 fill-current" />
                    WhatsApp
                  </a>
                </div>
              ) : activeTab === 'activity' && isLeader ? (
                <MemberActivitySheet
                  embedded
                  workspaceId={ws.workspaceId}
                  member={{
                    userId: m.user_id,
                    fullName: m.full_name,
                    phone: m.phone,
                    pipelineHref: m.pipeline_id ? `/pipeline/${m.pipeline_id}` : null,
                  }}
                  teamPulseUnlocked={teamPulseUnlocked}
                  memberIsLeader={m.role === 'leader'}
                  pipelineTakipCount={m.takip_count ?? 0}
                  pipelineKatildiCount={m.katildi_count ?? 0}
                />
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
