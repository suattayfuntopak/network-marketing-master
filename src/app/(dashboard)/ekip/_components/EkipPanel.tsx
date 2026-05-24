'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  Crown, Copy, Check, UserPlus, LogIn, Loader2, Trash2,
  TrendingUp, BarChart2, Send, FileText, MessageSquare,
  Users, CheckSquare, Square,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useTranslation } from '@/providers/LanguageProvider'

function SpoilerCode({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  
  useEffect(() => {
    if (revealed) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let animationFrameId: number
    
    const resize = () => {
      if (!canvas) return
      canvas.width = canvas.parentElement?.clientWidth || 200
      canvas.height = canvas.parentElement?.clientHeight || 40
    }
    resize()
    window.addEventListener('resize', resize)
    
    const numParticles = 60
    const particles: {x: number, y: number, size: number, speed: number, alpha: number}[] = []
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * (canvas.width || 200),
        y: Math.random() * 40,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.03 + 0.01,
        alpha: Math.random()
      })
    }
    
    const draw = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 5,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
      )
      gradient.addColorStop(0, 'rgba(83, 74, 183, 0.15)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(p => {
        p.alpha += p.speed
        if (p.alpha > 1 || p.alpha < 0) {
          p.speed = -p.speed
        }
        ctx.fillStyle = `rgba(165, 243, 252, ${Math.max(0, Math.min(1, p.alpha))})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })
      
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const size = Math.random() * 1
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`
        ctx.fillRect(x, y, size, size)
      }
      
      animationFrameId = requestAnimationFrame(draw)
    }
    
    draw()
    
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [revealed])
  
  return (
    <div 
      onClick={() => setRevealed(true)}
      className="relative flex-1 min-w-0 h-10 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] font-mono text-base font-bold tracking-widest text-[var(--text-1)] cursor-pointer flex items-center justify-center transition-all select-none"
    >
      <span className={`transition-all duration-500 ease-out transform ${revealed ? 'scale-100 opacity-100 blur-0' : 'scale-90 opacity-0 blur-md'}`}>
        {code}
      </span>
      
      {!revealed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center transition-all duration-500 ease-out">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          <span className="relative z-20 text-[10px] uppercase tracking-widest text-cyan-200/60 font-sans font-bold animate-pulse pointer-events-none">
            Açmak için tıkla ✨
          </span>
        </div>
      )}
    </div>
  )
}

interface MemberRow {
  user_id: string
  full_name: string | null
  role: 'leader' | 'member'
  joined_at: string | null
  candidate_count: number
  yeni_count: number
  sunum_count: number
  takip_count: number
  katildi_count: number
}

async function fetchMembers(workspaceId: string): Promise<MemberRow[]> {
  const supabase = createClient()
  const [{ data: members, error }, { data: candidatesRaw }] = await Promise.all([
    supabase
      .from('nmm_workspace_members')
      .select('user_id, full_name, role, joined_at')
      .eq('workspace_id', workspaceId),
    supabase
      .from('nmm_candidates')
      .select('owner_id, stage')
      .eq('workspace_id', workspaceId),
  ])
  if (error) throw error
  const candidates = candidatesRaw ?? []
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
      }
    })
    .sort((a, b) => b.candidate_count - a.candidate_count)
}

export function EkipPanel() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { lang, t } = useTranslation()
  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Invite/Join states
  const [copied, setCopied] = useState(false)
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [joining, setJoining] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Broadcast states
  const [broadcastMode, setBroadcastMode] = useState<'doc' | 'motiv'>('motiv')
  const [broadcastLink, setBroadcastLink] = useState('')
  const [broadcastNote, setBroadcastNote] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastTarget, setBroadcastTarget] = useState<'grup' | 'tekli'>('grup')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())

  const { data: members = [], isLoading: mLoading, isError: mError, error: queryError } = useQuery({
    queryKey: ['members', ws?.workspaceId],
    queryFn: () => fetchMembers(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user))
  }, [supabase])

  const handleMemberRemoveCancel = useCallback(() => setMemberToRemove(null), [])

  function composeBroadcastMessage() {
    if (broadcastMode === 'doc') {
      const linkLine = broadcastLink.trim()
      const noteLine = broadcastNote.trim()
      const header = lang === 'en' ? '📄 *Document / Link*' : '📄 *Doküman / Link*'
      return [header, linkLine, noteLine].filter(Boolean).join('\n\n')
    }
    return broadcastMessage.trim()
  }

  function handleGroupBroadcast() {
    const text = composeBroadcastMessage()
    if (!text) { toast.error(t('team.broadcastEmpty')); return }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  function handleIndividualBroadcast(memberId: string) {
    const text = composeBroadcastMessage()
    if (!text) { toast.error(t('team.broadcastEmpty')); return }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  function toggleMember(id: string) {
    setSelectedMembers(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function selectAllMembers() {
    setSelectedMembers(new Set(members.map(m => m.user_id)))
  }

  function clearMemberSelection() {
    setSelectedMembers(new Set())
  }

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
  const broadcastPreviewText = composeBroadcastMessage()
  const selectedCount = selectedMembers.size

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
      const { data: targetWs, error: wsError } = await supabase
        .from('nmm_workspaces')
        .select('id, name')
        .eq('invite_code', code)
        .maybeSingle()
      if (wsError || !targetWs) { toast.error(t('team.invalidCode')); setJoining(false); return }
      if (!currentUser?.id) throw new Error(t('team.noSessionError'))
      const { error: memError } = await supabase
        .from('nmm_workspace_members')
        .update({ workspace_id: targetWs.id, role: 'member' })
        .eq('user_id', currentUser.id)
      if (memError) throw memError
      await supabase.from('nmm_candidates').update({ workspace_id: targetWs.id }).eq('owner_id', currentUser.id)
      toast.success(t('team.joinSuccess', { name: targetWs.name }))
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
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      const newCode = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      const { data: newWs, error: wsError } = await supabase
        .from('nmm_workspaces')
        .insert({ name: `${memberName}'in Ekibi`, owner_id: memberId, invite_code: newCode })
        .select('id')
        .single()
      if (wsError || !newWs) throw wsError
      const { error: memError } = await supabase
        .from('nmm_workspace_members')
        .update({ workspace_id: newWs.id, role: 'leader' })
        .eq('user_id', memberId)
      if (memError) throw memError
      await supabase.from('nmm_candidates').update({ workspace_id: newWs.id }).eq('owner_id', memberId)
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
          <div className="rounded-2xl border border-[#4169E1]/20 bg-[#EEF2FF] dark:bg-[#0a0f2e]/40 p-5">
            <p className="text-3xl font-extrabold text-[#4169E1]">
              {members.reduce((s, m) => s + m.candidate_count, 0)}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#3658C7]">{t('team.totalCandidates')}</p>
          </div>
        </div>

        {/* Üye performans listesi */}
        <ul className="space-y-3">
          {members.map(m => {
            const isCurrentUser = m.user_id === currentUser?.id
            return (
              <li
                key={m.user_id}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm transition hover:shadow-md space-y-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-base font-bold text-[#534AB7]">
                    {(m.full_name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-bold text-[var(--text-1)]">
                        {m.full_name ?? 'İsimsiz Üye'}
                        {isCurrentUser && <span className="ml-1.5 text-[10px] font-normal text-[var(--text-3)]">({t('common.you')})</span>}
                      </p>
                      {m.role === 'leader' && (
                        <Crown className="h-3.5 w-3.5 shrink-0 text-[#854F0B]" strokeWidth={2} />
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-3)] capitalize mt-0.5">
                      {m.role === 'leader' ? t('common.leader') : t('common.member')}
                      {m.joined_at && (
                        <span className="ml-1.5 text-[10px]">
                          · {new Date(m.joined_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} {t('team.joined')}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-black text-[#4169E1]">{m.candidate_count}</p>
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
                    <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[#534AB7]" />
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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#534AB7] text-white hover:bg-[#433a9f] transition active:scale-95"
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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white hover:bg-[#20ba56] transition active:scale-95"
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
                className="flex-1 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#534AB7] transition-all"
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
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-3)] flex items-center gap-1.5">
          <Send className="h-4 w-4" />
          {t('team.broadcastTitle')}
        </h2>

        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
          {/* Üst başlık bantı */}
          <div className="flex items-start gap-3 border-b border-[var(--border)] bg-gradient-to-r from-[#534AB7]/8 to-[#25D366]/8 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#534AB7]/10 text-[#534AB7] dark:bg-[#534AB7]/20">
              <Send className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--text-1)]">{t('team.broadcastTitle')}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-2)]">{t('team.broadcastSubtitle')}</p>
            </div>
          </div>

          <div className="space-y-5 p-4">
            {/* İçerik türü seçici */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-3)]">
                {lang === 'en' ? 'Content Type' : 'İçerik Türü'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setBroadcastMode('doc')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition ${
                    broadcastMode === 'doc'
                      ? 'border-[#534AB7] bg-[#534AB7] text-white'
                      : 'border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--bg)]'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  {t('team.broadcastTypeDoc')}
                </button>
                <button
                  onClick={() => setBroadcastMode('motiv')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition ${
                    broadcastMode === 'motiv'
                      ? 'border-[#534AB7] bg-[#534AB7] text-white'
                      : 'border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--bg)]'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  {t('team.broadcastTypeMotiv')}
                </button>
              </div>
            </div>

            {/* İçerik girişi */}
            {broadcastMode === 'doc' ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">
                    {t('team.broadcastLinkLabel')}
                  </label>
                  <input
                    type="url"
                    value={broadcastLink}
                    onChange={e => setBroadcastLink(e.target.value)}
                    placeholder={t('team.broadcastLinkPlaceholder')}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#534AB7] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">
                    {t('team.broadcastNoteLabel')}
                  </label>
                  <textarea
                    rows={2}
                    value={broadcastNote}
                    onChange={e => setBroadcastNote(e.target.value)}
                    placeholder={t('team.broadcastNotePlaceholder')}
                    className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#534AB7] transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[var(--text-2)]">
                  {t('team.broadcastMsgLabel')}
                </label>
                <textarea
                  rows={4}
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  placeholder={t('team.broadcastMsgPlaceholder')}
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#534AB7] transition-all"
                />
              </div>
            )}

            {/* Alıcı seçimi */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-3)]">
                {lang === 'en' ? 'Recipients' : 'Alıcılar'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setBroadcastTarget('grup')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition ${
                    broadcastTarget === 'grup'
                      ? 'border-[#25D366] bg-[#25D366]/10 text-[#1a9e4f] dark:text-[#25D366]'
                      : 'border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--bg)]'
                  }`}
                >
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  {t('team.broadcastRecipientGroup')}
                </button>
                <button
                  onClick={() => setBroadcastTarget('tekli')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition ${
                    broadcastTarget === 'tekli'
                      ? 'border-[#25D366] bg-[#25D366]/10 text-[#1a9e4f] dark:text-[#25D366]'
                      : 'border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--bg)]'
                  }`}
                >
                  <CheckSquare className="h-3.5 w-3.5 shrink-0" />
                  {t('team.broadcastRecipientSelect')}
                </button>
              </div>

              {/* Grup gönder */}
              {broadcastTarget === 'grup' && (
                <button
                  onClick={handleGroupBroadcast}
                  disabled={!broadcastPreviewText}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white shadow-sm shadow-[#25D366]/20 transition hover:bg-[#1fb85a] active:scale-[0.98] disabled:opacity-40"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {t('team.broadcastSendGroup')}
                </button>
              )}

              {/* Tekli seçim */}
              {broadcastTarget === 'tekli' && (
                <div className="space-y-2">
                  {members.length > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--text-3)]">
                        {selectedCount > 0
                          ? t('team.broadcastMembersSelected', { count: String(selectedCount) })
                          : lang === 'en' ? 'Select recipients' : 'Kişileri seçin'}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={selectAllMembers} className="text-[11px] font-semibold text-[#534AB7] hover:underline">
                          {t('team.broadcastSelectAll')}
                        </button>
                        <span className="text-[var(--border)]">·</span>
                        <button onClick={clearMemberSelection} className="text-[11px] font-semibold text-[var(--text-3)] hover:underline">
                          {t('team.broadcastClearAll')}
                        </button>
                      </div>
                    </div>
                  )}
                  <ul className="space-y-2">
                    {members.map(m => {
                      const selected = selectedMembers.has(m.user_id)
                      return (
                        <li key={m.user_id} className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2.5 transition hover:bg-[var(--bg)]">
                          <button
                            onClick={() => toggleMember(m.user_id)}
                            className="shrink-0 text-[var(--text-3)] transition hover:text-[#534AB7]"
                          >
                            {selected
                              ? <CheckSquare className="h-4 w-4 text-[#534AB7]" />
                              : <Square className="h-4 w-4" />}
                          </button>
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-xs font-bold text-[#534AB7]">
                            {(m.full_name ?? '?').charAt(0).toUpperCase()}
                          </span>
                          <span className="flex-1 truncate text-xs font-semibold text-[var(--text-1)]">
                            {m.full_name ?? 'İsimsiz Üye'}
                          </span>
                          {selected && (
                            <a
                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(broadcastPreviewText || '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => { if (!broadcastPreviewText) { e.preventDefault(); toast.error(t('team.broadcastEmpty')) } }}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white transition hover:bg-[#1fb85a] active:scale-95"
                              title={`WhatsApp: ${m.full_name ?? ''}`}
                            >
                              <WhatsAppIcon className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  {members.length <= 1 && (
                    <p className="rounded-xl bg-[var(--bg-subtle)] px-4 py-3 text-center text-xs text-[var(--text-2)]">
                      {lang === 'en' ? 'No other team members yet.' : 'Henüz başka ekip üyeniz yok.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Ekipten Çıkarma Onay Modalı */}
      {memberToRemove && (
        <ConfirmDeleteModal
          message={t('team.removeMemberMsg', { name: memberToRemove.name })}
          onConfirm={handleRemoveMemberConfirmed}
          onCancel={handleMemberRemoveCancel}
        />
      )}
    </div>
  )
}
