'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import {
  Crown, Check, Trash2, TrendingUp, BarChart2, ChevronDown, ChevronUp, Rocket, Bot, Loader2,
  Phone, Search, BarChart3, Target,
} from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { getTeamMemberCardClasses } from '@/lib/ui/teamMemberCard'
import { ONBOARDING_STEPS } from '@/lib/team/types'
import { ONBOARDING_STEP_COUNT } from '@/lib/domain/pulse'
import { waHref } from '@/lib/utils/waLink'
import type { MemberRow } from '@/lib/team/types'
import type { WorkspaceContext } from '@/hooks/useWorkspace'
import type { MemberGoalRow } from '@/app/(dashboard)/ekip/memberGoalsActions'

export interface TeamPerformanceSectionProps {
  t: (key: string, vars?: Record<string, string | number>) => string
  lang: string
  ws: WorkspaceContext
  members: MemberRow[]
  visibleMembers: MemberRow[]
  isLeader: boolean
  isSolo: boolean
  isPlusCapReached: boolean
  hasMasterAccess: boolean
  scorecardOpen: boolean
  setScorecardOpen: (open: boolean) => void
  expandedMembers: Record<string, boolean>
  setExpandedMembers: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  expandedOnboardingId: string | null
  setExpandedOnboardingId: (id: string | null) => void
  onboardingWeekTab: 1 | 2 | 3 | 4
  setOnboardingWeekTab: (tab: 1 | 2 | 3 | 4) => void
  removingId: string | null
  setMemberToRemove: (member: { id: string; name: string } | null) => void
  setCoachingMember: (value: { member: MemberRow; days: number } | null) => void
  setOnboardingCoachData: (value: { memberName: string; stepId: string; phone?: string | null } | null) => void
  toggleOnboardingStep: (userId: string, stepId: string, isStepDone: boolean) => Promise<void>
  handleInviteMember: (member: MemberRow) => void
  memberSearch: string
  onMemberSearchChange: (q: string) => void
  onOpenActivity: (member: MemberRow) => void
  memberGoalsMap?: Record<string, MemberGoalRow>
}

export function TeamPerformanceSection(props: TeamPerformanceSectionProps) {
  const {
    t, lang, ws, members, visibleMembers, isLeader, isSolo, isPlusCapReached, hasMasterAccess,
    scorecardOpen, setScorecardOpen, expandedMembers, setExpandedMembers,
    expandedOnboardingId, setExpandedOnboardingId, onboardingWeekTab, setOnboardingWeekTab,
    removingId, setMemberToRemove, setCoachingMember, setOnboardingCoachData,
    toggleOnboardingStep, handleInviteMember,
    memberSearch, onMemberSearchChange, onOpenActivity,
    memberGoalsMap = {},
  } = props
  const router = useRouter()

  const totalCandidates = members.reduce((s, m) => s + m.candidate_count, 0)
  const totalJoined = members.reduce((s, m) => s + m.katildi_count, 0)
  const totalTakip = members.reduce((s, m) => s + m.takip_count, 0)
  const totalSunum = members.reduce((s, m) => s + m.sunum_count, 0)
  const warmPipelinePotentials = totalTakip + totalSunum
  const activePartnersCount = members.filter(m => {
    if (!m.last_activity_at) return false
    const days = Math.floor((Date.now() - new Date(m.last_activity_at).getTime()) / 86400000)
    return days < 7
  }).length
  const activeRatio = members.length > 0 ? Math.round((activePartnersCount / members.length) * 100) : 0

  return (
      <section className="space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-3)] flex items-center gap-2">
          <BarChart2 className="h-5 w-5" />
          {t('team.performancePanel')}
        </h2>

        {/* Özet istatistik kartları */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#F5D76E]/30 bg-[#FFFBE6] dark:bg-[#3a3000]/30 p-6 shadow-sm">
            <p className="text-4xl font-black text-[#D4A017]">{members.length}</p>
            <p className="mt-1 text-sm font-bold uppercase tracking-wider text-[#C9940A]">{t('team.totalMembers')}</p>
          </div>
          <div className="rounded-2xl border border-accent-blue/20 bg-[#EEF2FF] dark:bg-[#0a0f2e]/40 p-6 shadow-sm">
            <p className="text-4xl font-black text-accent-blue">
              {totalCandidates}
            </p>
            <p className="mt-1 text-sm font-bold uppercase tracking-wider text-[#3658C7]">{t('team.totalCandidates')}</p>
          </div>
        </div>

        {/* Haftalık Organizasyon Performans Durumu Kartı */}
        {isLeader && (
          <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6 dark:border-indigo-950/20 dark:bg-indigo-950/5 space-y-5 shadow-sm animate-in fade-in duration-300">
            <button
              type="button"
              onClick={() => setScorecardOpen(!scorecardOpen)}
              className="flex w-full items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="text-base font-extrabold text-indigo-950 dark:text-indigo-200">
                  {t('team.scorecardTitle')}
                </span>
              </div>
              {scorecardOpen ? (
                <ChevronUp className="h-5 w-5 text-indigo-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-indigo-500" />
              )}
            </button>

            {scorecardOpen && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Metrik 1: Aktif Partner Oranı */}
                <div className="rounded-xl bg-white/60 dark:bg-zinc-900/40 border border-indigo-100/40 dark:border-indigo-900/10 p-5 space-y-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                  <span className="text-xs font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider block">
                    {t('team.activePartnerRatio')}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-indigo-950 dark:text-indigo-100">
                      %{activeRatio}
                    </span>
                    <span className="text-xs text-zinc-500 font-semibold">
                      ({activePartnersCount}/{members.length})
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-tight font-medium">
                    {t('team.activePartnerDesc')}
                  </p>
                </div>

                {/* Metrik 2: Sıcak Huni Potansiyeli */}
                <div className="rounded-xl bg-white/60 dark:bg-zinc-900/40 border border-indigo-100/40 dark:border-indigo-900/10 p-5 space-y-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                  <span className="text-xs font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider block">
                    {t('team.warmPipeline')}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-indigo-950 dark:text-indigo-100">
                      {warmPipelinePotentials}
                    </span>
                    <span className="text-xs text-zinc-500 font-semibold">
                      {t('team.leads')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-tight font-medium">
                    {t('team.warmPipelineDesc')}
                  </p>
                </div>

                {/* Metrik 3: Kayıt Hunisi Momentumu */}
                <div className="rounded-xl bg-white/60 dark:bg-zinc-900/40 border border-indigo-100/40 dark:border-indigo-900/10 p-5 space-y-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                  <span className="text-xs font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider block">
                    {t('team.onboardingMomentum')}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-indigo-950 dark:text-indigo-100">
                      {totalJoined}
                    </span>
                    <span className="text-xs text-zinc-500 font-semibold">
                      {t('team.joinedLabel')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-tight font-medium">
                    {t('team.onboardingMomentumDesc')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {isLeader && visibleMembers.length > 1 && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)] pointer-events-none" />
            <input
              type="search"
              value={memberSearch}
              onChange={e => onMemberSearchChange(e.target.value)}
              placeholder={t('team.searchMembers')}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3 pl-10 pr-4 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-brand transition"
            />
          </div>
        )}

        {/* Üye performans listesi */}
        <ul className="space-y-5">
          {visibleMembers.map(m => {
            const isCurrentUser = m.user_id === ws.userId
            const lastActiveDate = m.last_activity_at ? new Date(m.last_activity_at) : null
            const daysInactive = lastActiveDate ? Math.floor((Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)) : 999
            const isInactive = daysInactive >= 7 && !isCurrentUser
            const isCardExpanded = isCurrentUser || !!expandedMembers[m.user_id]
            const onboardingDone = m.onboarding_steps?.length ?? 0
            const onboardingPct = Math.min(100, Math.round((onboardingDone / ONBOARDING_STEP_COUNT) * 100))
            const telHref = m.phone ? `tel:${m.phone.replace(/\s/g, '')}` : null
            const waQuick = waHref(m.phone, t('team.activityWaCheckIn', { name: (m.full_name ?? '').split(' ')[0] || t('common.member') }))

            return (
              <li
                key={m.user_id}
                className={clsx(
                  'relative overflow-hidden rounded-2xl border transition-all duration-200 p-6 shadow-sm hover:shadow-md space-y-5',
                  getTeamMemberCardClasses(m, isInactive)
                )}
              >
                {/* Kart Sağ Üst Buton Grubu - Sleek, Absolute Positioned */}
                {!isCurrentUser && m.isAppUser !== false && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    {/* Chevron Açma/Kapama Butonu */}
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedMembers(prev => ({
                          ...prev,
                          [m.user_id]: !prev[m.user_id]
                        }))
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] hover:text-[var(--text-1)] transition active:scale-95 cursor-pointer border border-[var(--border)] shadow-sm"
                      title={isCardExpanded ? t('team.collapseDetails') : t('team.expandDetails')}
                    >
                      {isCardExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                    </button>

                    {/* Silme Çöp Kutusu Butonu */}
                    {isLeader && (
                      <button
                        type="button"
                        onClick={() => setMemberToRemove({ id: m.user_id, name: m.full_name ?? t('common.member') })}
                        disabled={removingId === m.user_id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition active:scale-95 disabled:opacity-50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer border border-red-200/20 dark:border-red-900/10 shadow-sm"
                        title={t('team.removeFromTeam')}
                      >
                        {removingId === m.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Kart Üst Bölümü */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Sol Taraf: Avatar ve İsim Detayları */}
                  {(() => {
                    const profileClass = 'flex min-w-0 flex-1 items-center gap-4'
                    const profileInner = (
                      <>
                    <PersonAvatar
                      name={m.full_name ?? '?'}
                      imageUrl={m.avatar_url}
                      size="lg"
                      className="font-black"
                    />
                    
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 pr-16 sm:pr-0">
                        <p className="text-lg font-black text-[var(--text-1)] break-words leading-tight">
                          {m.full_name ?? 'İsimsiz Üye'}
                          {isCurrentUser && <span className="ml-2 text-sm font-normal text-[var(--text-3)]">({t('common.you')})</span>}
                        </p>
                        {m.role === 'leader' ? (
                          <Crown className="h-5 w-5 shrink-0 text-[#854F0B]" strokeWidth={2.5} />
                        ) : m.isAppUser !== false ? (
                          <span className="shrink-0 rounded-full bg-purple-100 dark:bg-purple-950/40 border border-purple-200/30 dark:border-purple-900/20 px-2.5 py-0.5 text-[10px] font-black text-purple-700 dark:text-purple-400 flex items-center gap-1 shadow-sm leading-none">
                            <span>💎</span>
                            <span>{t('team.nmmPartner')}</span>
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/30 dark:border-zinc-700/20 px-2.5 py-0.5 text-[10px] font-black text-zinc-600 dark:text-zinc-400 flex items-center gap-1 shadow-sm leading-none">
                            <span>🤝</span>
                            <span>{t('team.fieldPartner')}</span>
                          </span>
                        )}
                        {isInactive && (
                          <button
                            type="button"
                            onClick={(e) => {
                              // Bu buton, profili saran <Link> içinde — tıklama detaya
                              // gitmesin, sadece YZ Koçu popup'ı açılsın (popup açık kalır).
                              e.preventDefault()
                              e.stopPropagation()
                              setCoachingMember({ member: m, days: daysInactive })
                            }}
                            className="shrink-0 rounded-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 border border-amber-200/30 dark:border-amber-900/20 px-3 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5 animate-pulse hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
                            title={t('team.aiCoachingScript')}
                          >
                            <span>⚠️</span>
                            <span>{t('team.needsSupport')}</span>
                          </button>
                        )}
                      </div>
                      
                      <p className="text-sm text-[var(--text-2)] font-medium capitalize flex flex-wrap items-center gap-x-2 gap-y-1 pr-16 sm:pr-0">
                        <span className="font-extrabold text-[var(--text-1)]">
                          {m.isAppUser === false
                            ? t('team.fieldDistributor')
                            : (m.role === 'leader' ? t('common.leader') : t('common.member'))}
                        </span>
                        {m.joined_at && (
                          <span className="text-xs text-[var(--text-3)]/90">
                            · {new Date(m.joined_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} {t('team.joined')}
                          </span>
                        )}
                        {lastActiveDate && (
                          <span className={`text-xs ${isInactive ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-[var(--text-3)]/90'}`}>
                            · {t('team.lastActive')} {lastActiveDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} ({daysInactive === 0 ? t('team.todayShort') : t('team.daysAgoShort', { days: daysInactive })})
                          </span>
                        )}
                      </p>
                    </div>
                      </>
                    )
                    return m.pipeline_id ? (
                      <Link href={`/pipeline/${m.pipeline_id}`} className={`${profileClass} hover:opacity-80 transition cursor-pointer`}>
                        {profileInner}
                      </Link>
                    ) : (
                      <div className={profileClass}>{profileInner}</div>
                    )
                  })()}

                  {/* Sağ Taraf: Toplam Aday Göstergesi veya NMM'e Davet Et Butonu */}
                  <div className="flex items-center justify-end gap-3 border-t border-dashed border-[var(--border)] pt-3 sm:pt-0 sm:border-0 sm:pr-24 w-full sm:w-auto">
                    {m.isAppUser === false ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleInviteMember(m)
                        }}
                        className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-white px-4 py-2.5 text-sm font-black shadow-md cursor-pointer shrink-0"
                      >
                        <WhatsAppIcon className="h-4.5 w-4.5 fill-current text-white" />
                        <span>{t('team.inviteToNmm')}</span>
                      </button>
                    ) : (
                      <div className="text-right">
                        <p className="text-3xl font-black text-accent-blue tabular-nums leading-none">{m.candidate_count}</p>
                        <p className="text-xs text-[var(--text-2)] font-bold uppercase tracking-wider mt-1">{t('team.totalCandidates')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* DDBR mini + hızlı iletişim — downline, uygulama kullanıcısı */}
                {!isCurrentUser && m.isAppUser !== false && m.role === 'member' && (
                  <div className="space-y-3 border-t border-dashed border-[var(--border)] pt-4">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold uppercase tracking-wide text-[var(--text-3)]">
                        {t('statsPage.colDqsg')}
                      </span>
                      <span className="font-black tabular-nums text-[#854F0B] dark:text-[#fbbf24]">
                        {onboardingDone}/{ONBOARDING_STEP_COUNT} · %{onboardingPct}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                      <div
                        className="h-full rounded-full bg-[#854F0B] dark:bg-[#fbbf24] transition-all"
                        style={{ width: `${onboardingPct}%` }}
                      />
                    </div>
                    {memberGoalsMap[m.user_id] && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                        <Target className="h-3.5 w-3.5 shrink-0" />
                        {t('team.memberGoalChip', {
                          people: memberGoalsMap[m.user_id].targetPeople,
                          months: memberGoalsMap[m.user_id].targetMonths,
                        })}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {telHref && (
                        <a
                          href={telHref}
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200/60 bg-blue-50/80 dark:bg-blue-950/20 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 transition active:scale-95"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {t('team.callBtn')}
                        </a>
                      )}
                      {waQuick && (
                        <a
                          href={waQuick}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white transition active:scale-95"
                        >
                          <WhatsAppIcon className="h-3.5 w-3.5 fill-current" />
                          WhatsApp
                        </a>
                      )}
                      {isLeader && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            onOpenActivity(m)
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 dark:border-indigo-400/40 bg-brand/5 dark:bg-indigo-400/10 px-3 py-1.5 text-xs font-bold text-brand dark:text-indigo-300 hover:bg-brand/10 dark:hover:bg-indigo-400/20 transition active:scale-95 cursor-pointer"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                          {t('team.activityBtn')}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Kart Alt Bölümü: Huni Dağılımı ve Onboarding (Collapsible) */}
                {isCardExpanded && m.isAppUser !== false && (
                  <div className="border-t border-[var(--border)] pt-5 space-y-5 animate-in fade-in slide-in-from-top-1 duration-200">
                    
                    {!hasMasterAccess && m.user_id !== ws.userId ? (
                      <div className="rounded-2xl border border-[#534AB7]/30 bg-[#12111E]/40 p-6 text-center space-y-4 max-w-xl mx-auto my-3 backdrop-blur-xl">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#534AB7]/10 mx-auto text-[#534AB7]">
                          <Crown className="h-5 w-5 animate-bounce" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-white">
                            {t('team.plusRequired')}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                            {t('team.plusRequiredDesc')}
                          </p>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push('/odeme')
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-indigo-500/10 active:scale-95 transition cursor-pointer border-0"
                          >
                            <span>{t('team.upgradeToMaster')}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Aday Hunisi Dağılım Kutusu (Sıfır Bile Olsa Her Zaman Görünür!) */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-2)] uppercase tracking-wider">
                            <TrendingUp className="h-5 w-5 shrink-0 text-brand" />
                            <span>{t('team.funnelDistribution')}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 pt-1 text-center sm:grid-cols-4">
                            <div className="rounded-2xl bg-blue-50/50 dark:bg-blue-950/10 p-4 border border-blue-100/30 dark:border-blue-900/10 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                              <span className="block text-xl font-black text-blue-600 dark:text-blue-400 tabular-nums">{m.yeni_count || 0}</span>
                              <span className="text-xs text-[var(--text-2)] font-bold block mt-1">{t('stages.yeni')}</span>
                            </div>
                            <div className="rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/10 p-4 border border-emerald-100/30 dark:border-emerald-900/10 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                              <span className="block text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{m.sunum_count || 0}</span>
                              <span className="text-xs text-[var(--text-2)] font-bold block mt-1">{t('stages.sunum')}</span>
                            </div>
                            <div className="rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 p-4 border border-amber-100/30 dark:border-amber-900/10 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                              <span className="block text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums">{m.takip_count || 0}</span>
                              <span className="text-xs text-[var(--text-2)] font-bold block mt-1">{t('stages.takip')}</span>
                            </div>
                            <div className="rounded-2xl bg-[#FAEEDA]/50 dark:bg-[#3a2200]/20 p-4 border border-[#FAEEDA]/30 dark:border-[#3a2200]/10 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                              <span className="block text-xl font-black text-[#854F0B] dark:text-[#fcd34d] tabular-nums">{m.katildi_count || 0}</span>
                              <span className="text-xs font-black text-[#854F0B] dark:text-[#fcd34d] block mt-1">{t('stages.katildi')}</span>
                            </div>
                          </div>
                        </div>

                        {/* ─── Distribütör Başlatma Kontrol Listesi ─── */}
                        {m.role === 'member' && (
                          <div className="border-t border-[var(--border)] pt-5 space-y-3">
                            <button
                              type="button"
                              onClick={() => setExpandedOnboardingId(expandedOnboardingId === m.user_id ? null : m.user_id)}
                              className="flex w-full items-center justify-between text-sm font-extrabold text-[var(--text-2)] hover:text-brand transition cursor-pointer uppercase tracking-wider"
                            >
                              <span className="flex items-center gap-2">
                                <Rocket className="h-5 w-5 text-[#854F0B] dark:text-[#fbbf24]" />
                                <span>{t('team.correctStartGuide')}</span>
                              </span>
                              <span className="flex items-center gap-2.5">
                                {(() => {
                                  const doneCount = ONBOARDING_STEPS.filter(s => m.onboarding_steps?.includes(s.id)).length
                                  const totalCount = ONBOARDING_STEPS.length
                                  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
                                  return (
                                    <span className="rounded-full bg-[#FAEEDA] dark:bg-[#3a2200] px-3 py-1 text-xs font-black text-[#854F0B] dark:text-[#fbbf24] shadow-sm">
                                      %{pct}
                                    </span>
                                  )
                                })()}
                                {expandedOnboardingId === m.user_id ? (
                                  <ChevronUp className="h-5 w-5" />
                                ) : (
                                  <ChevronDown className="h-5 w-5" />
                                )}
                              </span>
                            </button>

                            {expandedOnboardingId === m.user_id && (
                              <div className="pt-3 border-t border-dashed border-[var(--border)] space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                {/* 4 Weekly Tabs */}
                                <div className="flex gap-2 bg-[var(--bg-subtle)] dark:bg-zinc-900/50 p-1 rounded-xl border border-[var(--border)]">
                                  {([1, 2, 3, 4] as const).map(w => (
                                    <button
                                      key={w}
                                      type="button"
                                      onClick={() => setOnboardingWeekTab(w)}
                                      className={`flex-1 text-xs font-extrabold py-2 rounded-lg transition-all cursor-pointer ${
                                        onboardingWeekTab === w
                                          ? 'bg-[var(--bg-card)] dark:bg-zinc-800 text-[#854F0B] dark:text-[#fbbf24] shadow-sm border border-[var(--border)]'
                                          : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
                                      }`}
                                    >
                                      {t('team.weekLabel', { w })}
                                    </button>
                                  ))}
                                </div>

                                {/* Steps list */}
                                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                                  {ONBOARDING_STEPS.filter(s => s.week === onboardingWeekTab).map(step => {
                                    const isStepDone = m.onboarding_steps?.includes(step.id) ?? false
                                    return (
                                      <div
                                        key={step.id}
                                        className={`w-full flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all ${
                                          isStepDone
                                            ? 'border-emerald-200/50 dark:border-emerald-950/20 bg-emerald-50/5 dark:bg-emerald-950/5 text-[var(--text-1)]'
                                            : 'border-[var(--border)] bg-[var(--bg-subtle)] dark:bg-zinc-900/30 text-[var(--text-2)]'
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => toggleOnboardingStep(m.user_id, step.id, isStepDone)}
                                          className="flex-1 flex items-center gap-3 text-left cursor-pointer active:scale-[0.99] transition-all"
                                        >
                                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                                            isStepDone ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--text-3)] bg-transparent'
                                          }`}>
                                            {isStepDone && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />}
                                          </span>
                                          <span className="text-sm font-semibold leading-tight pr-2">
                                            {lang === 'en' ? step.label_en : step.label_tr}
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setOnboardingCoachData({
                                              memberName: m.full_name || '',
                                              stepId: step.id,
                                              phone: m.phone ?? null
                                            })
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
                            )}
                          </div>
                        )}
                      </>
                    )}

                  </div>
                )}
              </li>
            )
          })}
        </ul>

        {isPlusCapReached && (
          <div className="rounded-3xl border border-pink-500/20 bg-gradient-to-r from-pink-500/5 to-rose-500/5 p-8 text-center space-y-4 shadow-lg my-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-400 text-xl">
              👑
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h4 className="text-base font-bold text-white">
                {t('team.teamLimitReached')}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {t('team.teamLimitDescPro')}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => router.push('/odeme')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 px-6 py-2.5 text-xs font-bold text-white hover:opacity-90 transition active:scale-95 cursor-pointer shadow-lg shadow-pink-500/15"
              >
                <span>{t('team.upgradeToPro')}</span>
              </button>
            </div>
          </div>
        )}

        {isSolo && isLeader && (
          <p className="rounded-xl bg-[var(--bg-subtle)] px-5 py-4 text-center text-sm font-semibold text-[var(--text-2)] leading-relaxed border border-[var(--border)]">
            {t('team.soloHint')}
          </p>
        )}
        {!isLeader && (
          <p className="rounded-xl bg-[var(--bg-subtle)] px-5 py-4 text-center text-sm font-semibold text-[var(--text-2)] leading-relaxed border border-[var(--border)]">
            {t('team.memberHint')}
          </p>
        )}
      </section>
  )
}
