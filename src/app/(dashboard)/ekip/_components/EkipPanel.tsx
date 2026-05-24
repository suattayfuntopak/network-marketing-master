'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Crown, Copy, Check, UserPlus, LogIn, Loader2, Trash2, TrendingUp, BarChart2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'

interface MemberRow {
  user_id: string
  full_name: string | null
  role: 'leader' | 'member'
  candidate_count: number
  yeni_count: number
  sunum_count: number
  takip_count: number
  katildi_count: number
}

async function fetchMembers(workspaceId: string): Promise<MemberRow[]> {
  const supabase = createClient()
  const { data: members, error } = await supabase
    .from('nmm_workspace_members')
    .select('user_id, full_name, role')
    .eq('workspace_id', workspaceId)
  if (error) throw error

  const counts = await Promise.all(
    (members ?? []).map(async m => {
      const { data: candidates } = await supabase
        .from('nmm_candidates')
        .select('stage')
        .eq('workspace_id', workspaceId)
        .eq('owner_id', m.user_id)

      const list = candidates ?? []
      return {
        ...m,
        candidate_count: list.length,
        yeni_count: list.filter(c => c.stage === 'yeni').length,
        sunum_count: list.filter(c => c.stage === 'sunum').length,
        takip_count: list.filter(c => c.stage === 'takip').length,
        katildi_count: list.filter(c => c.stage === 'katildi').length,
      }
    })
  )
  return counts.sort((a, b) => b.candidate_count - a.candidate_count)
}

export function EkipPanel() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // UI states
  const [copied, setCopied] = useState(false)
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [joining, setJoining] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const { data: members = [], isLoading: mLoading } = useQuery({
    queryKey: ['members', ws?.workspaceId],
    queryFn: () => fetchMembers(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user)
    })
  }, [supabase])

  if (wsLoading || mLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
        ))}
      </div>
    )
  }

  const isLeader = ws?.role === 'leader'
  const isSolo = members.length <= 1

  function handleCopyInviteCode() {
    if (!ws?.workspaceId) return
    navigator.clipboard.writeText(ws.workspaceId)
    setCopied(true)
    toast.success('Davet kodu kopyalandı!')
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleJoinWorkspace(e: React.FormEvent) {
    e.preventDefault()
    if (joining) return
    
    const code = inviteCodeInput.trim()
    if (!code) {
      toast.error('Lütfen bir davet kodu girin!')
      return
    }

    if (code === ws?.workspaceId) {
      toast.error('Zaten bu çalışma alanındasınız!')
      return
    }

    setJoining(true)
    try {
      // 1. Check if workspace exists
      const { data: targetWs, error: wsError } = await supabase
        .from('nmm_workspaces')
        .select('id, name')
        .eq('id', code)
        .maybeSingle()

      if (wsError || !targetWs) {
        toast.error('Geçersiz veya bulunamayan davet kodu!')
        setJoining(false)
        return
      }

      if (!currentUser?.id) throw new Error('Oturum bilgisi alınamadı.')

      // 2. Update membership to member in the target workspace
      const { error: memError } = await supabase
        .from('nmm_workspace_members')
        .update({ workspace_id: targetWs.id, role: 'member' })
        .eq('user_id', currentUser.id)

      if (memError) throw memError

      // 3. Move their existing candidates to the new workspace so their data is merged
      await supabase
        .from('nmm_candidates')
        .update({ workspace_id: targetWs.id })
        .eq('owner_id', currentUser.id)

      toast.success(`"${targetWs.name}" ekibine başarıyla katıldınız!`)
      setInviteCodeInput('')
      
      // Invalidate all query caches
      queryClient.invalidateQueries({ queryKey: ['workspace'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Ekibe katılırken bir hata oluştu.')
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
      // 1. Create a new solo workspace for the removed user
      const { data: newWs, error: wsError } = await supabase
        .from('nmm_workspaces')
        .insert({ name: `${memberName}'in Ekibi`, owner_id: memberId })
        .select('id')
        .single()

      if (wsError || !newWs) throw wsError

      // 2. Re-assign their membership row to their new solo workspace as 'leader'
      const { error: memError } = await supabase
        .from('nmm_workspace_members')
        .update({ workspace_id: newWs.id, role: 'leader' })
        .eq('user_id', memberId)

      if (memError) throw memError

      // 3. Move their candidate records back to their new solo workspace
      await supabase
        .from('nmm_candidates')
        .update({ workspace_id: newWs.id })
        .eq('owner_id', memberId)

      toast.success(`${memberName} başarıyla ekipten çıkarıldı.`)
      queryClient.invalidateQueries({ queryKey: ['members'] })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Üye çıkarılırken bir hata oluştu.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Üst İstatistik Kartları */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#F5D76E]/30 bg-[#FFFBE6] dark:bg-[#3a3000]/30 p-5">
          <p className="text-3xl font-extrabold text-[#D4A017]">{members.length}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#C9940A]">Ekip Üyesi</p>
        </div>
        <div className="rounded-2xl border border-[#4169E1]/20 bg-[#EEF2FF] dark:bg-[#0a0f2e]/40 p-5">
          <p className="text-3xl font-extrabold text-[#4169E1]">
            {members.reduce((s, m) => s + m.candidate_count, 0)}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#3658C7]">Toplam Aday</p>
        </div>
      </div>

      {/* 2. Lider Davet Kartı / Üye Katılma Kartı */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Lider Davet Kodu Üretici */}
        {isLeader && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A56DB]">
                <UserPlus className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-1)]">Ekip Arkadaşı Davet Et</h3>
            </div>
            <p className="text-xs text-[var(--text-2)] leading-relaxed">
              Ekip üyelerinizin uygulamaya kendi hesaplarıyla üye olmasını sağlayın. Ardından aşağıdaki kodu "Ekibim" sayfasından girerek ekibinize dahil olmalarını isteyin.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 truncate rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2.5 font-mono text-xs text-[var(--text-1)]">
                {ws?.workspaceId}
              </div>
              <button
                onClick={handleCopyInviteCode}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#534AB7] text-white hover:bg-[#433a9f] transition active:scale-95"
                title="Kodu Kopyala"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Merhaba! Network Marketing Master ekibimize katılman için bu davet kodunu kullanabilirsin:\n\n*${ws?.workspaceId}*\n\nUygulamaya üye olduktan sonra "Ekibim" sayfasından bu kodu girerek ekibe anında katılabilirsin!`
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
        )}

        {/* Solo Lider veya normal üyeler için "Bir Ekibe Katıl" kutusu */}
        {(isSolo || !isLeader) && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E1F5EE] text-[#0F6E56]">
                <LogIn className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-1)]">Bir Liderin Ekibine Katıl</h3>
            </div>
            <p className="text-xs text-[var(--text-2)] leading-relaxed">
              Liderinizin sizinle paylaştığı davet kodunu aşağıya girerek onun çalışma alanına dahil olun. Mevcut tüm aday verileriniz otomatik olarak bu ekibe aktarılacaktır.
            </p>
            <form onSubmit={handleJoinWorkspace} className="flex gap-2">
              <input
                type="text"
                required
                value={inviteCodeInput}
                onChange={e => setInviteCodeInput(e.target.value)}
                placeholder="Davet kodunu yapıştırın..."
                className="flex-1 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#534AB7] transition-all"
              />
              <button
                type="submit"
                disabled={joining}
                className="flex h-10 px-4 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0F6E56] text-sm font-semibold text-white hover:bg-[#0a5a44] transition active:scale-95 disabled:opacity-50"
              >
                {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Katıl'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 3. Detaylı Ekip Listesi & Performans Analizi */}
      <section className="space-y-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)] flex items-center gap-1.5">
            <BarChart2 className="h-4 w-4" />
            Ekip Performans Paneli
          </h2>
          <span className="text-[10px] text-[var(--text-3)]">Aday aşamalarına göre dağılım</span>
        </div>

        <ul className="space-y-3">
          {members.map(m => {
            const isCurrentUser = m.user_id === currentUser?.id;
            
            return (
              <li
                key={m.user_id}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm transition hover:shadow-md space-y-4"
              >
                {/* Üye Bilgisi Satırı */}
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-base font-bold text-[#534AB7]">
                    {(m.full_name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-bold text-[var(--text-1)]">
                        {m.full_name ?? 'İsimsiz Üye'}
                        {isCurrentUser && <span className="ml-1.5 text-[10px] font-normal text-[var(--text-3)]">(Siz)</span>}
                      </p>
                      {m.role === 'leader' && (
                        <Crown className="h-3.5 w-3.5 shrink-0 text-[#854F0B]" strokeWidth={2} />
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-3)] capitalize mt-0.5">
                      {m.role === 'leader' ? 'Lider' : 'Ekip Üyesi'}
                    </p>
                  </div>

                  {/* Toplam Aday Sayısı */}
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-black text-[#4169E1]">{m.candidate_count}</p>
                    <p className="text-[10px] text-[var(--text-3)] font-semibold uppercase">Toplam Aday</p>
                  </div>

                  {/* Liderler diğer üyeleri ekipten çıkarabilir (kendini çıkaramaz) */}
                  {isLeader && m.role !== 'leader' && (
                    <button
                      onClick={() => setMemberToRemove({ id: m.user_id, name: m.full_name ?? 'Üye' })}
                      disabled={removingId === m.user_id}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition active:scale-95 disabled:opacity-50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                      title="Ekipten Çıkar"
                    >
                      {removingId === m.user_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* PRO Performans Dağılım Grafiği */}
                <div className="border-t border-[var(--border)] pt-3.5 space-y-2">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-2)]">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[#534AB7]" />
                    <span>Aday Hunisi Dağılımı</span>
                  </div>

                  {m.candidate_count === 0 ? (
                    <p className="text-[11px] text-[var(--text-3)] italic py-1">Bu üyenin henüz boru hattında kayıtlı adayı bulunmuyor.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1 text-center sm:grid-cols-4">
                      {/* Yeni Aday */}
                      <div className="rounded-xl bg-blue-50/50 dark:bg-blue-950/10 p-2 border border-blue-100/30 dark:border-blue-900/10">
                        <span className="block text-xs font-bold text-blue-600 dark:text-blue-400">{m.yeni_count}</span>
                        <span className="text-[9px] text-[var(--text-3)] font-medium">Yeni</span>
                      </div>
                      
                      {/* Sunum */}
                      <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 p-2 border border-emerald-100/30 dark:border-emerald-900/10">
                        <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">{m.sunum_count}</span>
                        <span className="text-[9px] text-[var(--text-3)] font-medium">Sunum</span>
                      </div>

                      {/* Takip */}
                      <div className="rounded-xl bg-amber-50/50 dark:bg-amber-950/10 p-2 border border-amber-100/30 dark:border-amber-900/10">
                        <span className="block text-xs font-bold text-amber-600 dark:text-amber-400">{m.takip_count}</span>
                        <span className="text-[9px] text-[var(--text-3)] font-medium">Takipte</span>
                      </div>

                      {/* Katıldı (Gold/Premium) */}
                      <div className="rounded-xl bg-[#FAEEDA]/50 dark:bg-[#FAEEDA]/5 p-2 border border-[#FAEEDA]/30 dark:border-[#FAEEDA]/10">
                        <span className="block text-xs font-bold text-[#854F0B] dark:text-[#fcd34d]">{m.katildi_count}</span>
                        <span className="text-[9px] text-[var(--text-3)] font-semibold text-[#854F0B] dark:text-[#fcd34d]">Katıldı</span>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Solo Liderler İçin Bilgilendirme */}
      {!isLeader && (
        <p className="rounded-xl bg-[var(--bg-subtle)] px-4 py-3 text-center text-xs text-[var(--text-2)] leading-relaxed">
          Bir ekibe dahil olduğunuz için ekip yönetimi yetkiniz bulunmamaktadır. Kendi boru hattınızı yönetmeye devam edebilir, performansınızı liderinizle paylaşabilirsiniz.
        </p>
      )}

      {/* Ekipten Çıkarma Onay Modalı */}
      {memberToRemove && (
        <ConfirmDeleteModal
          name={memberToRemove.name}
          onConfirm={handleRemoveMemberConfirmed}
          onCancel={() => setMemberToRemove(null)}
        />
      )}
    </div>
  )
}
