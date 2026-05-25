'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import {
  Crown, Copy, Check, UserPlus, LogIn, Loader2, Trash2,
  TrendingUp, BarChart2,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useTranslation } from '@/providers/LanguageProvider'
import { SpoilerCode } from './SpoilerCode'
import { BroadcastPanel } from './BroadcastPanel'
import { YZEkipKocuSheet } from './YZEkipKocuSheet'

export interface MemberRow {
  user_id: string
  full_name: string | null
  role: 'leader' | 'member'
  joined_at: string | null
  candidate_count: number
  yeni_count: number
  sunum_count: number
  takip_count: number
  katildi_count: number
  last_activity_at: string | null
}

async function fetchMembers(workspaceId: string): Promise<MemberRow[]> {
  const supabase = createClient()
  const [{ data: members, error }, { data: candidatesRaw }, { data: recentActions }] = await Promise.all([
    supabase
      .from('nmm_workspace_members')
      .select('user_id, full_name, role, joined_at')
      .eq('workspace_id', workspaceId),
    supabase
      .from('nmm_candidates')
      .select('owner_id, stage')
      .eq('workspace_id', workspaceId),
    supabase
      .from('nmm_daily_actions')
      .select('user_id, created_at')
      .eq('workspace_id', workspaceId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])
  if (error) throw error
  const candidates = candidatesRaw ?? []
  const actions = recentActions ?? []

  const lastActionMap: Record<string, string> = {}
  members?.forEach(m => {
    if (m.joined_at) {
      lastActionMap[m.user_id] = m.joined_at
    }
  })
  actions.forEach(act => {
    const current = lastActionMap[act.user_id]
    if (!current || new Date(act.created_at) > new Date(current)) {
      lastActionMap[act.user_id] = act.created_at
    }
  })

  return (members ?? [])
    .map(m => {
      const mc = candidates.filter(c => c.owner_id === m.user_id)
      return {
        user_id: m.user_id,
        full_name: m.full_name,
        role: m.role as 'leader' | 'member',
        joined_at: m.joined_at ?? null,
        candidate_count: mc.length,
        yeni_count:    mc.filter(c => c.stage === 'yeni').length,
        sunum_count:   mc.filter(c => c.stage === 'sunum').length,
        takip_count:   mc.filter(c => c.stage === 'takip').length,
        katildi_count: mc.filter(c => c.stage === 'katildi').length,
        last_activity_at: lastActionMap[m.user_id] ?? null,
      }
    })
    .sort((a, b) => b.candidate_count - a.candidate_count)
}

export function EkipPanel() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { lang, t } = useTranslation()
  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const [copied, setCopied] = useState(false)
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [joining, setJoining] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [coachingMember, setCoachingMember] = useState<{ member: MemberRow; days: number } | null>(null)

  const { data: members = [], isLoading: mLoading, isError: mError, error: queryError } = useQuery({
    queryKey: ['members', ws?.workspaceId],
    queryFn: () => fetchMembers(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user))
  }, [supabase])

  const handleMemberRemoveCancel = useCallback(() => setMemberToRemove(null), [])

  if (wsLoading || mLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
        ))}
      </div>
    )
  }

  if (mError || !ws) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
        <p className="mb-2 text-3xl">⚠️</p>
        <p className="text-sm font-semibold text-[var(--text-1)]">{t('team.loadError')}</p>
        <p className="mt-1 text-xs text-[var(--text-2)]">{(queryError as Error)?.message || t('team.loadErrorHint')}</p>
      </div>
    )
  }

  const isLeader = ws.role === 'leader'
  const isSolo = members.length <= 1

  function handleCopyInviteCode() {
    if (!ws?.inviteCode) return
    navigator.clipboard.writeText(ws.inviteCode)
    setCopied(true)
    toast.success(t('team.inviteCopied'))
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleJoinWorkspace(e: React.FormEvent) {
    e.preventDefault()
    if (joining) return
    const code = inviteCodeInput.trim().toUpperCase()
    if (!code) { toast.error('Lütfen bir davet kodu girin!'); return }
    if (code === ws?.inviteCode) { toast.error(t('team.alreadyInTeam')); return }
    setJoining(true)
    try {
      const { data, error: rpcError } = await supabase.rpc('nmm_join_workspace', { p_invite_code: code })
      if (rpcError) {
        toast.error(rpcError.message?.includes('invalid_invite_code') ? t('team.invalidCode') : t('team.joinError'))
        setJoining(false)
        return
      }
      toast.success(t('team.joinSuccess', { name: (data as any)?.workspace_name ?? '' }))
      setInviteCodeInput('')
      queryClient.invalidateQueries({ queryKey: ['workspace'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || t('team.joinError'))
    } finally {
      setJoining(false)
    }
  }

  async function handleRemoveMemberConfirmed() {
    if (!memberToRemove) return
    const memberId = memberToRemove.id
    const memberName = memberToRemove.name
    setMemberToRemove(null)
    setRemovingId(memberId)
    try {
      const { error: rpcError } = await supabase.rpc('nmm_remove_member', { p_member_id: memberId, p_member_name: memberName })
      if (rpcError) throw rpcError
      toast.success(t('team.removeSuccess', { name: memberName }))
      queryClient.invalidateQueries({ queryKey: ['members'] })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || t('team.removeError'))
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-6">

      {/* ─── 1. EKİP PERFORMANS PANELİ ─── */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)] flex items-center gap-1.5">
          <BarChart2 className="h-4 w-4" />
          {t('team.performancePanel')}
        </h2>

        {/* Özet istatistik kartları */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#F5D76E]/30 bg-[#FFFBE6] dark:bg-[#3a3000]/30 p-5">
            <p className="text-3xl font-extrabold text-[#D4A017]">{members.length}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#C9940A]">{t('team.totalMembers')}</p>
          </div>
          <div className="rounded-2xl border border-accent-blue/20 bg-[#EEF2FF] dark:bg-[#0a0f2e]/40 p-5">
            <p className="text-3xl font-extrabold text-accent-blue">
              {members.reduce((s, m) => s + m.candidate_count, 0)}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#3658C7]">{t('team.totalCandidates')}</p>
          </div>
        </div>

        {/* Üye performans listesi */}
        <ul className="space-y-3">
          {members.map(m => {
            const isCurrentUser = m.user_id === currentUser?.id
            const lastActiveDate = m.last_activity_at ? new Date(m.last_activity_at) : null
            const daysInactive = lastActiveDate ? Math.floor((Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)) : 999
            const isInactive = daysInactive >= 7 && !isCurrentUser

            return (
              <li
                key={m.user_id}
                className={`overflow-hidden rounded-2xl border transition-all duration-200 p-4 shadow-sm hover:shadow-md space-y-4 ${
                  isInactive
                    ? 'border-amber-200/50 bg-amber-50/5 dark:border-amber-900/20 dark:bg-amber-950/5'
                    : 'border-[var(--border)] bg-[var(--bg-card)]'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                    isInactive
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      : 'bg-[#EEEDFE] text-brand'
                  }`}>
                    {(m.full_name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-[var(--text-1)]">
                        {m.full_name ?? 'İsimsiz Üye'}
                        {isCurrentUser && <span className="ml-1.5 text-[10px] font-normal text-[var(--text-3)]">({t('common.you')})</span>}
                      </p>
                      {m.role === 'leader' && (
                        <Crown className="h-3.5 w-3.5 shrink-0 text-[#854F0B]" strokeWidth={2} />
                      )}
                      {isInactive && (
                        <button
                          onClick={() => setCoachingMember({ member: m, days: daysInactive })}
                          className="shrink-0 rounded-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 border border-amber-200/30 dark:border-amber-900/20 px-2 py-0.5 text-[9px] font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1 animate-pulse hover:scale-105 active:scale-95 transition-all"
                          title={lang === 'en' ? 'Get AI Coaching Message' : 'YZ Koçluk Mesajı Al'}
                        >
                          <span>⚠️</span>
                          <span>{lang === 'en' ? 'Needs Support' : 'Destek Gerekebilir'}</span>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-3)] capitalize mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <span>{m.role === 'leader' ? t('common.leader') : t('common.member')}</span>
                      {m.joined_at && (
                        <span className="text-[10px] text-[var(--text-3)]/70">
                          · {new Date(m.joined_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} {t('team.joined')}
                        </span>
                      )}
                      {lastActiveDate && (
                        <span className={`text-[10px] ${isInactive ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-[var(--text-3)]/70'}`}>
                          · {lang === 'en' ? 'Last active:' : 'Son aktiflik:'} {lastActiveDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} ({daysInactive === 0 ? (lang === 'en' ? 'today' : 'bugün') : `${daysInactive} ${lang === 'en' ? 'd ago' : 'gün önce'}`})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-black text-accent-blue">{m.candidate_count}</p>
                    <p className="text-[10px] text-[var(--text-3)] font-semibold uppercase">{t('team.totalCandidates')}</p>
                  </div>
                  {isLeader && m.role !== 'leader' && (
                    <button
                      onClick={() => setMemberToRemove({ id: m.user_id, name: m.full_name ?? t('common.member') })}
                      disabled={removingId === m.user_id}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition active:scale-95 disabled:opacity-50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                      title={t('team.removeFromTeam')}
                    >
                      {removingId === m.user_id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </button>
                  )}
                </div>
                <div className="border-t border-[var(--border)] pt-3.5 space-y-2">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-2)]">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0 text-brand" />
                    <span>{t('team.funnelDistribution')}</span>
                  </div>
                  {m.candidate_count === 0 ? (
                    <p className="text-[11px] text-[var(--text-3)] italic py-1">{t('team.noTeamCandidates')}</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1 text-center sm:grid-cols-4">
                      <div className="rounded-xl bg-blue-50/50 dark:bg-blue-950/10 p-2 border border-blue-100/30 dark:border-blue-900/10">
                        <span className="block text-xs font-bold text-blue-600 dark:text-blue-400">{m.yeni_count}</span>
                        <span className="text-[9px] text-[var(--text-3)] font-medium">{t('stages.yeni')}</span>
                      </div>
                      <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 p-2 border border-emerald-100/30 dark:border-emerald-900/10">
                        <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">{m.sunum_count}</span>
                        <span className="text-[9px] text-[var(--text-3)] font-medium">{t('stages.sunum')}</span>
                      </div>
                      <div className="rounded-xl bg-amber-50/50 dark:bg-amber-950/10 p-2 border border-amber-100/30 dark:border-amber-900/10">
                        <span className="block text-xs font-bold text-amber-600 dark:text-amber-400">{m.takip_count}</span>
                        <span className="text-[9px] text-[var(--text-3)] font-medium">{t('stages.takip')}</span>
                      </div>
                      <div className="rounded-xl bg-[#FAEEDA]/50 dark:bg-[#FAEEDA]/5 p-2 border border-[#FAEEDA]/30 dark:border-[#FAEEDA]/10">
                        <span className="block text-xs font-bold text-[#854F0B] dark:text-[#fcd34d]">{m.katildi_count}</span>
                        <span className="text-[9px] font-semibold text-[#854F0B] dark:text-[#fcd34d]">{t('stages.katildi')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        {isSolo && isLeader && (
          <p className="rounded-xl bg-[var(--bg-subtle)] px-4 py-3 text-center text-xs text-[var(--text-2)] leading-relaxed">
            {t('team.soloHint')}
          </p>
        )}
        {!isLeader && (
          <p className="rounded-xl bg-[var(--bg-subtle)] px-4 py-3 text-center text-xs text-[var(--text-2)] leading-relaxed">
            {t('team.memberHint')}
          </p>
        )}
      </section>

      {/* ─── 2. EKİP ARKADAŞI DAVET ET ─── */}
      {isLeader && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-3)] flex items-center gap-1.5">
            <UserPlus className="h-4 w-4" />
            {t('team.inviteTeammate')}
          </h2>
          <div className="w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
            <p className="text-xs text-[var(--text-2)] leading-relaxed">
              {t('team.inviteTeammateDesc')}
            </p>
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              <SpoilerCode code={ws?.inviteCode ?? ''} />
              <button
                onClick={handleCopyInviteCode}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white hover:bg-[#433a9f] transition active:scale-95"
                title={lang === 'en' ? 'Copy Code' : 'Kodu Kopyala'}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  lang === 'en'
                    ? `Hi! You can use this invite code to join our Network Marketing Master team:\n\n*${ws?.inviteCode}*\n\nAfter signing up, enter this code from the "My Team" page to join instantly!`
                    : `Merhaba! Network Marketing Master ekibimize katılman için bu davet kodunu kullanabilirsin:\n\n*${ws?.inviteCode}*\n\nUygulamaya üye olduktan sonra "Ekibim" sayfasından bu kodu girerek ekibe anında katılabilirsin!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-whatsapp text-white hover:bg-[#20ba56] transition active:scale-95"
                title="WhatsApp ile Paylaş"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ─── 3. BİR LİDERİN EKİBİNE KATIL ─── */}
      {(isSolo || !isLeader) && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-3)] flex items-center gap-1.5">
            <LogIn className="h-4 w-4" />
            {t('team.joinATeam')}
          </h2>
          <div className="w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
            <p className="text-xs text-[var(--text-2)] leading-relaxed">
              {t('team.joinATeamDesc')}
            </p>
            <form onSubmit={handleJoinWorkspace} className="flex min-w-0 gap-2 overflow-hidden">
              <input
                type="text"
                required
                value={inviteCodeInput}
                onChange={e => setInviteCodeInput(e.target.value)}
                placeholder={lang === 'en' ? 'Paste invite code...' : 'Davet kodunu yapıştırın...'}
                className="flex-1 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-brand transition-all"
              />
              <button
                type="submit"
                disabled={joining}
                className="flex h-10 px-4 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0F6E56] text-sm font-semibold text-white hover:bg-[#0a5a44] transition active:scale-95 disabled:opacity-50"
              >
                {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : t('team.joinBtn')}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* ─── 4. EKİBE TOPLU GÖNDER ─── */}
      <BroadcastPanel members={members} lang={lang} t={t} />

      {/* Ekipten Çıkarma Onay Modalı */}
      {memberToRemove && (
        <ConfirmDeleteModal
          message={t('team.removeMemberMsg', { name: memberToRemove.name })}
          onConfirm={handleRemoveMemberConfirmed}
          onCancel={handleMemberRemoveCancel}
        />
      )}

      {/* YZ Ekip Koçu Mentörlük Paneli */}
      {coachingMember && (
        <YZEkipKocuSheet
          member={coachingMember.member}
          daysInactive={coachingMember.days}
          lang={lang}
          onClose={() => setCoachingMember(null)}
        />
      )}
    </div>
  )
}
