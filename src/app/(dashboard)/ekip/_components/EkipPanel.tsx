'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import {
  Crown, Copy, Check, UserPlus, LogIn, Loader2, Trash2,
  TrendingUp, BarChart2, ChevronDown, ChevronUp, Rocket, Bot
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useTranslation } from '@/providers/LanguageProvider'
import { SpoilerCode } from './SpoilerCode'
import { BroadcastPanel } from './BroadcastPanel'
import { YZEkipKocuSheet } from './YZEkipKocuSheet'
import { useAIUsage } from '@/hooks/useAIUsage'
import { getLimitsForLicense } from '@/lib/aiUsage'
import { generateOnboardingGuidanceAction, resolveTeamAvatarsAction } from '../actions'
import { waHref } from '@/lib/waLink'
import { parseNote } from '@/lib/noteParser'
import { Skeleton } from '@/components/ui/Skeleton'
import { Z } from '@/lib/zIndex'
import { REGISTER_URL } from '@/lib/constants'
import { findLeaderCandidateForMember } from '@/lib/team/matchCandidate'
import { fetchTeamWithDownlines } from '@/lib/team/fetchTeamWithDownlines'

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
  onboarding_steps?: string[]
  phone?: string | null
  isAppUser?: boolean
  avatar_url?: string | null
  /** Candidate id for /pipeline/[id] — never use auth user_id for app users */
  pipeline_id?: string | null
}

export interface OnboardingStep {
  id: string
  week: 1 | 2 | 3 | 4
  label_tr: string
  label_en: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 'step_why', week: 1, label_tr: 'Başlangıç Görüşmesi & "Neden?" Belirleme', label_en: 'Kickoff Meeting & Define "Why"' },
  { id: 'step_list', week: 1, label_tr: '20-50 Kişilik Liste Oluşturma', label_en: 'Create a list of 20-50 Names' },
  { id: 'step_first_5', week: 1, label_tr: 'İlk 5 Adayı Belirleme ve Mesaj Gönderme', label_en: 'Identify first 5 and send messages' },
  
  { id: 'step_3way', week: 2, label_tr: 'Sponsorla İlk 3\'lü Görüşme (3-Way Call)', label_en: 'First 3-Way Call with Sponsor' },
  { id: 'step_social', week: 2, label_tr: 'Sosyal Medyada İlk Ürün Paylaşımı', label_en: 'First Product Post on Social Media' },
  
  { id: 'step_independent', week: 3, label_tr: 'Sponsorsuz İlk Bağımsız Sunum', label_en: 'First Independent Presentation' },
  { id: 'step_objections', week: 3, label_tr: 'İtirazlara Cevaplar Modülü Eğitimi', label_en: 'Study Objection Handling Module' },
  
  { id: 'step_90day', week: 4, label_tr: '90 Günlük Saha Aksiyon Planı Yazımı', label_en: 'Write 90-Day Field Action Plan' },
  { id: 'step_complete', week: 4, label_tr: '30. Gün Kapanış & Değerlendirme', label_en: 'Day 30 Review & Reflection' },
]

async function fetchMembers(workspaceId: string): Promise<MemberRow[]> {
  const supabase = createClient()

  const rpcBundle = await fetchTeamWithDownlines(supabase, workspaceId)
  if (rpcBundle) {
    const allUserIds = rpcBundle.members.map(m => m.user_id)
    const authAvatars = await resolveTeamAvatarsAction(workspaceId, allUserIds)
    const { members, leaderCandidates: candidates, leaderOwnerId } = rpcBundle
    const ownWs = { owner_id: leaderOwnerId }

    const registeredMemberRows = members.map(m => {
      const mc = candidates.filter(c => c.owner_id === m.user_id)
      const matchedPipelineId = ownWs.owner_id
        ? findLeaderCandidateForMember(candidates, ownWs.owner_id, m.full_name)
        : null
      const candidateMatch = matchedPipelineId
        ? candidates.find(c => c.id === matchedPipelineId)
        : undefined
      const phone = candidateMatch?.phone ?? null
      const noteAvatar = candidateMatch?.note ? parseNote(candidateMatch.note).avatarUrl : ''
      const resolvedAvatar = m.avatar_url ?? authAvatars[m.user_id] ?? (noteAvatar || null)

      return {
        user_id: m.user_id,
        full_name: m.full_name,
        role: m.role,
        joined_at: m.joined_at,
        candidate_count: mc.length || m.candidate_count,
        yeni_count: m.yeni_count,
        sunum_count: m.sunum_count,
        takip_count: m.takip_count,
        katildi_count: m.katildi_count,
        last_activity_at: m.last_activity_at,
        onboarding_steps: m.onboarding_steps,
        phone,
        isAppUser: true as const,
        avatar_url: resolvedAvatar,
        pipeline_id: matchedPipelineId,
      }
    })

    const cleanStr = (s: string | null | undefined) => (s ?? '')
      .toLowerCase()
      .replace(/\u0131/g, 'i').replace(/\u011f/g, 'g')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')

    const nonAppMembers: MemberRow[] = []
    if (ownWs.owner_id) {
      candidates
        .filter(c => c.owner_id === ownWs.owner_id && c.stage === 'katildi')
        .forEach(c => {
          const isMatched = registeredMemberRows.some(m => {
            const mf = cleanStr(m.full_name)
            const cf = cleanStr(c.full_name)
            if (!mf || !cf) return false
            if (mf.includes(cf) || cf.includes(mf)) return true
            const mWords = (m.full_name ?? '').split(/\s+/).map((w: string) => cleanStr(w)).filter((w: string) => w.length >= 3)
            return mWords.some((w: string) => cf.includes(w))
          })
          if (!isMatched) {
            const parsedNote = parseNote(c.note)
            nonAppMembers.push({
              user_id: c.id,
              full_name: c.full_name,
              role: 'member',
              joined_at: c.created_at || null,
              candidate_count: 0,
              yeni_count: 0,
              sunum_count: 0,
              takip_count: 0,
              katildi_count: 0,
              last_activity_at: null,
              onboarding_steps: [],
              phone: c.phone || null,
              isAppUser: false,
              avatar_url: parsedNote.avatarUrl || null,
              pipeline_id: c.id,
            })
          }
        })
    }

    return [...registeredMemberRows, ...nonAppMembers].sort((a, b) => {
      if (a.role === 'leader') return -1
      if (b.role === 'leader') return 1
      if (a.isAppUser && !b.isAppUser) return -1
      if (!a.isAppUser && b.isAppUser) return 1
      return b.candidate_count - a.candidate_count
    })
  }

  // 1. Get the workspace owner_id
  const { data: ownWs, error: wsErr } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id')
    .eq('id', workspaceId)
    .single()

  if (wsErr || !ownWs) throw new Error(wsErr?.message || 'Workspace not found')

  // 2. Get all members in this workspace — nmm_join_workspace RPC adds downlines here
  const { data: membersRaw, error } = await supabase
    .from('nmm_workspace_members')
    .select('user_id, full_name, role, joined_at, avatar_url')
    .eq('workspace_id', workspaceId)

  if (error) throw error
  const members = membersRaw ?? []

  // Build deduped members map (leader always present)
  type MemberMapEntry = {
    user_id: string
    full_name: string | null
    role: string
    joined_at: string | null
    avatar_url: string | null
  }
  const uniqueMembersMap: Record<string, MemberMapEntry> = {}
  if (ownWs.owner_id) {
    const leaderRow = members.find(m => m.user_id === ownWs.owner_id)
    uniqueMembersMap[ownWs.owner_id] = {
      user_id: ownWs.owner_id,
      full_name: leaderRow?.full_name ?? 'Lider',
      role: 'leader',
      joined_at: leaderRow?.joined_at ?? new Date().toISOString(),
      avatar_url: leaderRow?.avatar_url ?? null
    }
  }
  members.forEach(m => { uniqueMembersMap[m.user_id] = m })












  // 3. Find all downline workspaces that have parent_id = leader's workspaceId
  // Also support legacy where parent_id = leader's owner_id
  const { data: downlineWs } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id')
    .or(`parent_id.eq.${workspaceId},parent_id.eq.${ownWs.owner_id}`)

  const downlineWsIds = downlineWs?.map(w => w.id) ?? []
  const downlineOwnerIds = (downlineWs?.map(w => w.owner_id).filter(Boolean) ?? []) as string[]

  // Add the downline owners to uniqueMembers if they aren't there yet
  if (downlineOwnerIds.length > 0) {
    const { data: dlMembers } = await supabase
      .from('nmm_workspace_members')
      .select('user_id, full_name, role, joined_at, avatar_url')
      .in('user_id', downlineOwnerIds)

    dlMembers?.forEach(m => {
      const existing = uniqueMembersMap[m.user_id]
      if (!existing) {
        uniqueMembersMap[m.user_id] = m
      } else if (!existing.avatar_url && m.avatar_url) {
        uniqueMembersMap[m.user_id] = { ...existing, avatar_url: m.avatar_url }
      }
    })
  }

  const allUserIds = Object.keys(uniqueMembersMap)

  // Avatar may live on the member's own workspace row while sponsor workspace has null
  const avatarByUser: Record<string, string> = {}
  if (allUserIds.length > 0) {
    const { data: avatarRows } = await supabase
      .from('nmm_workspace_members')
      .select('user_id, avatar_url')
      .in('user_id', allUserIds)
      .not('avatar_url', 'is', null)
    avatarRows?.forEach(row => {
      if (row.avatar_url) avatarByUser[row.user_id] = row.avatar_url
    })
  }
  const uniqueMembers = Object.values(uniqueMembersMap)
  const allWorkspaceIds = [workspaceId, ...downlineWsIds]

  const [
    { data: candidatesRaw },
    { data: recentActions },
    { data: onboardingRaw }
  ] = await Promise.all([
    supabase
      .from('nmm_candidates')
      .select('id, owner_id, stage, full_name, phone, created_at, note')
      .in('workspace_id', allWorkspaceIds),
    supabase
      .from('nmm_daily_actions')
      .select('user_id, created_at')
      .in('workspace_id', allWorkspaceIds)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('nmm_onboarding_progress')
      .select('user_id, step_id')
      .in('user_id', allUserIds)
  ])

  const candidates = candidatesRaw ?? []
  const actions = recentActions ?? []
  const onboarding = onboardingRaw ?? []


  const lastActionMap: Record<string, string> = {}
  uniqueMembers.forEach(m => {
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

  const cleanStr = (s: string | null | undefined) => (s ?? '')
    .toLowerCase()
    .replace(/\u0131/g, 'i').replace(/\u011f/g, 'g')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')

  const authAvatars = await resolveTeamAvatarsAction(workspaceId, allUserIds)

  // 1. Map registered NMM App users
  const registeredMemberRows = uniqueMembers.map(m => {
    const mc = candidates.filter(c => c.owner_id === m.user_id)
    const completedSteps = onboarding
      .filter(o => o.user_id === m.user_id)
      .map(o => o.step_id)

    const matchedPipelineId = ownWs.owner_id
      ? findLeaderCandidateForMember(candidates, ownWs.owner_id, m.full_name)
      : null
    const candidateMatch = matchedPipelineId
      ? candidates.find(c => c.id === matchedPipelineId)
      : undefined
    const phone = candidateMatch?.phone ?? null
    const noteAvatar = candidateMatch?.note ? parseNote(candidateMatch.note).avatarUrl : ''
    const resolvedAvatar = m.avatar_url ?? avatarByUser[m.user_id] ?? authAvatars[m.user_id] ?? (noteAvatar || null)

    return {
      user_id: m.user_id,
      full_name: m.full_name,
      role: (m.user_id === ownWs.owner_id ? 'leader' : 'member') as 'leader' | 'member',
      joined_at: m.joined_at ?? null,
      candidate_count: mc.length,
      yeni_count:    mc.filter(c => c.stage === 'yeni').length,
      sunum_count:   mc.filter(c => c.stage === 'sunum').length,
      takip_count:   mc.filter(c => c.stage === 'takip').length,
      katildi_count: mc.filter(c => c.stage === 'katildi').length,
      last_activity_at: lastActionMap[m.user_id] ?? null,
      onboarding_steps: completedSteps,
      phone: phone,
      isAppUser: true,
      avatar_url: resolvedAvatar,
      pipeline_id: candidateMatch?.id ?? null,
    }
  })

  // 2. Find all candidates of the leader where stage is 'katildi' ( MLM joined )
  const leaderWonCandidates = candidates.filter(c =>
    c.owner_id === ownWs.owner_id &&
    c.stage === 'katildi'
  )

  // 3. For each won candidate, if not matched with an active NMM member, add as Saha Distribütörü
  const nonAppMembers: MemberRow[] = []
  leaderWonCandidates.forEach(c => {
    const isMatched = registeredMemberRows.some(m => {
      const mf = cleanStr(m.full_name)
      const cf = cleanStr(c.full_name)
      if (!mf || !cf) return false
      if (mf.includes(cf) || cf.includes(mf)) return true
      // Token fallback: any word (≥3 chars) from the workspace member name found in the candidate name
      const mWords = (m.full_name ?? '').split(/\s+/).map((w: string) => cleanStr(w)).filter((w: string) => w.length >= 3)
      return mWords.some((w: string) => cf.includes(w))
    })

    if (!isMatched) {
      const parsedNote = parseNote(c.note)
      nonAppMembers.push({
        user_id: c.id,
        full_name: c.full_name,
        role: 'member',
        joined_at: c.created_at || null,
        candidate_count: 0,
        yeni_count: 0,
        sunum_count: 0,
        takip_count: 0,
        katildi_count: 0,
        last_activity_at: null,
        onboarding_steps: [],
        phone: c.phone || null,
        isAppUser: false,
        avatar_url: parsedNote.avatarUrl || null,
        pipeline_id: c.id,
      })
    }
  })

  // 4. Combine and sort
  const combined = [...registeredMemberRows, ...nonAppMembers]

  return combined.sort((a, b) => {
    if (a.role === 'leader') return -1
    if (b.role === 'leader') return 1
    
    // NMM App Users come before Field Partners
    if (a.isAppUser && !b.isAppUser) return -1
    if (!a.isAppUser && b.isAppUser) return 1
    
    return b.candidate_count - a.candidate_count
  })
}

export function EkipPanel() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { lang, t } = useTranslation()
  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const licenseType = ws?.licenseType ?? 'free'
  const licenseExpiresAt = ws?.licenseExpiresAt ?? null
  const isLicenseExpired = licenseExpiresAt
    ? new Date(licenseExpiresAt) < new Date()
    : false
  const hasMasterAccess = (licenseType === 'master' || licenseType === 'pro') && !isLicenseExpired

  const [copied, setCopied] = useState(false)
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [joining, setJoining] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [coachingMember, setCoachingMember] = useState<{ member: MemberRow; days: number } | null>(null)
  const [scorecardOpen, setScorecardOpen] = useState(true)
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>({})

  const [expandedOnboardingId, setExpandedOnboardingId] = useState<string | null>(null)
  const [onboardingWeekTab, setOnboardingWeekTab] = useState<1 | 2 | 3 | 4>(1)
  const [onboardingCoachData, setOnboardingCoachData] = useState<{
    memberName: string
    stepId: string
    phone?: string | null
  } | null>(null)

  const handleInviteMember = (member: MemberRow) => {
    const code = ws?.inviteCode || ''
    const link = REGISTER_URL
    const message = t('team.inviteWaMessage', {
      name: member.full_name ?? t('common.member'),
      link,
      code,
    })
    
    const href = waHref(member.phone, message)
    if (href) {
      window.open(href, '_blank')
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank')
    }
  }

  const toggleOnboardingStep = useCallback(async (userId: string, stepId: string, isStepDone: boolean) => {
    try {
      if (isStepDone) {
        const { error } = await supabase
          .from('nmm_onboarding_progress')
          .delete()
          .eq('user_id', userId)
          .eq('step_id', stepId)
        if (error) throw error
        toast.success(t('team.stepIncomplete'))
      } else {
        const { error } = await supabase
          .from('nmm_onboarding_progress')
          .insert({
            user_id: userId,
            step_id: stepId
          })
        if (error) throw error
        toast.success(t('team.stepComplete'))
      }
      queryClient.invalidateQueries({ queryKey: ['ekip-panel', ws?.workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['members', ws?.workspaceId] })
    } catch (err: any) {
      console.error('[toggleOnboardingStep] error:', err)
      toast.error(t('team.progressUpdateError', { message: err.message }))
    }
  }, [supabase, queryClient, ws?.workspaceId, t])

  const { data: members = [], isLoading: mLoading, isError: mError, error: queryError } = useQuery({
    queryKey: ['ekip-panel', ws?.workspaceId],
    queryFn: () => fetchMembers(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
    staleTime: 2 * 60 * 1000,
  })

  const downlineMembers = members.filter(m => m.role !== 'leader')
  const totalDownlineCount = downlineMembers.length
  const isPlusCapReached = licenseType === 'master' && totalDownlineCount > 50

  const visibleMembers = licenseType === 'master'
    ? [members[0], ...downlineMembers.slice(0, 50)].filter(Boolean)
    : members

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user))
  }, [supabase])

  const handleMemberRemoveCancel = useCallback(() => setMemberToRemove(null), [])

  if (wsLoading || mLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
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
      queryClient.invalidateQueries({ queryKey: ['ekip-panel'] })
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
      queryClient.invalidateQueries({ queryKey: ['ekip-panel'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || t('team.removeError'))
    } finally {
      setRemovingId(null)
    }
  }

  const totalCandidates = members.reduce((s, m) => s + m.candidate_count, 0)
  const totalJoined = members.reduce((s, m) => s + m.katildi_count, 0)
  const totalTakip = members.reduce((s, m) => s + m.takip_count, 0)
  const totalSunum = members.reduce((s, m) => s + m.sunum_count, 0)
  const warmPipelinePotentials = totalTakip + totalSunum

  // Son 7 günde aktif distribütörler (last_activity_at son 7 günde olanlar)
  const activePartnersCount = members.filter(m => {
    if (!m.last_activity_at) return false
    const days = Math.floor((Date.now() - new Date(m.last_activity_at).getTime()) / 86400000)
    return days < 7
  }).length
  const activeRatio = members.length > 0 ? Math.round((activePartnersCount / members.length) * 100) : 0

  return (
    <div className="space-y-7">

      {/* ─── 1. EKİP PERFORMANS PANELİ ─── */}
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

        {/* Üye performans listesi */}
        <ul className="space-y-5">
          {visibleMembers.map(m => {
            const isCurrentUser = m.user_id === currentUser?.id
            const lastActiveDate = m.last_activity_at ? new Date(m.last_activity_at) : null
            const daysInactive = lastActiveDate ? Math.floor((Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)) : 999
            const isInactive = daysInactive >= 7 && !isCurrentUser
            const isCardExpanded = isCurrentUser || !!expandedMembers[m.user_id]

            return (
              <li
                key={m.user_id}
                className={`relative overflow-hidden rounded-2xl border transition-all duration-200 p-6 shadow-sm hover:shadow-md space-y-5 ${
                  isInactive
                    ? 'border-amber-200/50 bg-amber-50/5 dark:border-amber-900/20 dark:bg-amber-950/5'
                    : 'border-[var(--border)] bg-[var(--bg-card)]'
                }`}
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
                    <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-black overflow-hidden ${
                      m.avatar_url
                        ? ''
                        : isInactive
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        : m.isAppUser === false
                        ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800/40 dark:text-zinc-400'
                        : 'bg-[#EEEDFE] text-brand'
                    }`}>
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          alt={m.full_name ?? ''}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // Resim yüklenemezse baş harfe fallback
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.classList.add(m.isAppUser === false ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800/40 dark:text-zinc-400' : 'bg-[#EEEDFE] text-brand')
                              const span = document.createElement('span')
                              span.textContent = (m.full_name ?? '?').charAt(0).toUpperCase()
                              parent.appendChild(span)
                            }
                          }}
                        />
                      ) : (
                        (m.full_name ?? '?').charAt(0).toUpperCase()
                      )}
                    </div>
                    
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
                            onClick={() => setCoachingMember({ member: m, days: daysInactive })}
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

                {/* Kart Alt Bölümü: Huni Dağılımı ve Onboarding (Collapsible) */}
                {isCardExpanded && m.isAppUser !== false && (
                  <div className="border-t border-[var(--border)] pt-5 space-y-5 animate-in fade-in slide-in-from-top-1 duration-200">
                    
                    {!hasMasterAccess && m.user_id !== currentUser?.id ? (
                      <div className="rounded-2xl border border-[#534AB7]/30 bg-[#12111E]/40 p-6 text-center space-y-4 max-w-xl mx-auto my-3 backdrop-blur-xl">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#534AB7]/10 mx-auto text-[#534AB7]">
                          <Crown className="h-5 w-5 animate-bounce" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-white">
                            {t('team.masterRequired')}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                            {t('team.masterRequiredDesc')}
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

      {/* ─── 2. EKİP ARKADAŞI DAVET ET ─── */}
      {isLeader && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-3)] flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('team.inviteTeammate')}
          </h2>
          <div className="w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-4 shadow-sm">
            <p className="text-sm text-[var(--text-2)] font-medium leading-relaxed">
              {t('team.inviteTeammateDesc')}
            </p>
            <div className="flex min-w-0 items-center gap-3 overflow-hidden">
              <SpoilerCode code={ws?.inviteCode ?? ''} />
              <button
                onClick={handleCopyInviteCode}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white hover:bg-[#433a9f] transition active:scale-95 shadow-sm cursor-pointer"
                title={t('team.copyCode')}
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  t('team.waInviteGroup', { code: ws?.inviteCode ?? '', link: REGISTER_URL })
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-whatsapp text-white hover:bg-[#20ba56] transition active:scale-95 shadow-sm cursor-pointer"
                title="WhatsApp ile Paylaş"
              >
                <WhatsAppIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ─── 3. BİR LİDERİN EKİBİNE KATIL ─── */}
      {(isSolo || !isLeader) && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-3)] flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            {t('team.joinATeam')}
          </h2>
          <div className="w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-4 shadow-sm">
            <p className="text-sm text-[var(--text-2)] font-medium leading-relaxed">
              {t('team.joinATeamDesc')}
            </p>
            <form onSubmit={handleJoinWorkspace} className="flex min-w-0 gap-3 overflow-hidden">
              <input
                type="text"
                required
                value={inviteCodeInput}
                onChange={e => setInviteCodeInput(e.target.value)}
                placeholder={t('team.pasteInvitePlaceholder')}
                className="flex-1 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-brand transition-all font-medium"
              />
              <button
                type="submit"
                disabled={joining}
                className="flex h-11 px-5 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0F6E56] text-base font-bold text-white hover:bg-[#0a5a44] transition active:scale-95 disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {joining ? <Loader2 className="h-5 w-5 animate-spin" /> : t('team.joinBtn')}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* ─── 4. EKİBE TOPLU GÖNDER ─── */}
      <BroadcastPanel members={visibleMembers} lang={lang} t={t} />

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

      {/* YZ Onboarding Koçu Popup Modalı */}
      {onboardingCoachData && (
        <YZOnboardingKocuModal
          memberName={onboardingCoachData.memberName}
          stepId={onboardingCoachData.stepId}
          phone={onboardingCoachData.phone}
          onClose={() => setOnboardingCoachData(null)}
        />
      )}
    </div>
  )
}

const ONBOARDING_STEPS_TR: Record<string, string> = {
  'step_why': 'Başlangıç Görüşmesi & "Neden?" Belirleme',
  'step_list': '20-50 Kişilik Liste Oluşturma',
  'step_first_5': 'İlk 5 Adayı Belirleme',
  'step_3way': 'Sponsorla İlk 3\'lü Görüşme (3-Way Call)',
  'step_social': 'Sosyal Medyada İlk Ürün Paylaşımı',
  'step_independent': 'Sponsorsuz İlk Bağımsız Sunum',
  'step_objections': 'İtirazlara Cevaplar Modülü Eğitimi',
  'step_90day': '90 Günlük Saha Aksiyon Planı Yazımı',
  'step_complete': '30. Gün Kapanış & Değerlendirme',
}

const ONBOARDING_STEPS_EN: Record<string, string> = {
  'step_why': 'Kickoff Meeting & Define "Why"',
  'step_list': 'Create a list of 20-50 Names',
  'step_first_5': 'Identify first 5 and send messages',
  'step_3way': 'First 3-Way Call with Sponsor',
  'step_social': 'First Product Post on Social Media',
  'step_independent': 'First Independent Presentation',
  'step_objections': 'Study Objection Handling Module',
  'step_90day': 'Write 90-Day Field Action Plan',
  'step_complete': 'Day 30 Review & Reflection',
}

interface YZOnboardingKocuModalProps {
  memberName: string
  stepId: string
  phone?: string | null
  onClose: () => void
}

function YZOnboardingKocuModal({ memberName, stepId, phone, onClose }: YZOnboardingKocuModalProps) {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { lang, t } = useTranslation()
  const { data: usage, refetch: refetchUsage } = useAIUsage()
  const { data: modalWs } = useWorkspace()
  const { messageLimit } = getLimitsForLicense(modalWs?.licenseType)

  useEffect(() => {
    let active = true
    async function generate() {
      try {
        const res = await generateOnboardingGuidanceAction(memberName, stepId, lang)
        if (!active) return
        if (res.error) {
          setError(res.error)
        } else if (res.message) {
          setMessage(res.message)
          refetchUsage()
        }
      } catch (err: any) {
        if (active) {
          setError(t('team.guidanceError', { message: err.message }))
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    generate()
    return () => {
      active = false
    }
  }, [memberName, stepId, lang, refetchUsage])

  const handleCopy = () => {
    if (!message) return
    navigator.clipboard.writeText(message)
    toast.success(t('team.coachingCopied'))
  }

  const handleSendWhatsApp = () => {
    if (!message) return
    const href = waHref(phone, message)
    if (href) {
      window.open(href, '_blank')
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank')
    }
  }

  const stepLabel = lang === 'en'
    ? (ONBOARDING_STEPS_EN[stepId] || stepId)
    : (ONBOARDING_STEPS_TR[stepId] || stepId)

  return (
    <div 
      className={`fixed inset-0 ${Z.coachModal} flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200`}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-6 shadow-2xl overflow-hidden flex flex-col gap-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <Bot className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <h3 className="text-lg font-black text-[var(--text-1)]">
              {t('team.aiCoachTitle')}
            </h3>
            <p className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider">
              {t('team.aiCoachSubtitle')}
            </p>
          </div>
        </div>

        {/* Member & Step Details */}
        <div className="rounded-2xl bg-[var(--bg-subtle)] p-4 border border-[var(--border)] space-y-2">
          <div>
            <p className="text-[10px] text-[var(--text-3)] font-extrabold uppercase tracking-widest">
              {t('team.downlineMember')}
            </p>
            <p className="text-sm font-extrabold text-[var(--text-1)] mt-0.5">{memberName}</p>
          </div>
          <div className="h-px bg-[var(--border)]" />
          <div>
            <p className="text-[10px] text-[var(--text-3)] font-extrabold uppercase tracking-widest">
              {t('team.targetStep')}
            </p>
            <p className="text-sm font-bold text-brand mt-0.5">
              {stepLabel}
            </p>
          </div>
        </div>

        {/* AI Output Box */}
        <div className="min-h-[140px] flex flex-col justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
              <p className="text-xs font-bold text-[var(--text-3)] animate-pulse">
                {t('team.aiDrafting')}
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200/50 bg-red-50/5 p-4 text-center">
              <p className="text-sm font-bold text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4 max-h-[220px] overflow-y-auto">
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-[var(--text-2)] select-text">
                  {message}
                </p>
              </div>

              {/* Action Buttons (Strictly Icon Only) */}
              <div className="flex gap-4 justify-center items-center">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--bg-card)] hover:text-brand transition shadow-sm active:scale-95 cursor-pointer"
                  title={t('team.copyCoaching')}
                >
                  <Copy className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366] text-white hover:bg-[#20ba59] transition shadow-md hover:shadow-emerald-500/20 active:scale-95 cursor-pointer"
                  title={t('team.sendWhatsApp')}
                >
                  <WhatsAppIcon className="h-5 w-5 fill-white" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center justify-center border-t border-[var(--border)] pt-4 text-center">
          {!usage?.isSuperAdmin && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-3)] mb-4">
              <span>{t('team.dailyCoachingQuota')}</span>
              <span className="font-extrabold text-[#0F6E56] dark:text-[#5eead4]">
                {t('team.remainingQuota', {
                  remaining: Math.max(0, messageLimit - (usage?.messageUsed ?? 0)),
                  limit: messageLimit,
                })}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-black uppercase tracking-wider text-[var(--text-2)] hover:text-[var(--text-1)] transition active:scale-[0.98] cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}

