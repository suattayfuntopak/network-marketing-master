'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ChevronRight, Users, UserPlus, Rocket, PartyPopper, ArrowRight } from 'lucide-react'
import { useAddCandidate } from '@/hooks/useCandidates'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useUserSettings } from '@/hooks/useUserSettings'
import { writeUserSettingsCache } from '@/lib/ui/userSettingsStorage'

interface Props {
  workspaceId: string
  inviteCode: string
  /** İlk açılışta kullanıcının zaten adayı var mıydı — yeni kullanıcı tespiti (mount'ta sabitlenir). */
  hasCandidatesInitially?: boolean
}

export function OnboardingModal({ workspaceId, inviteCode, hasCandidatesInitially = false }: Props) {
  const { data: ws } = useWorkspace()
  const userId = ws?.userId
  const { settings, isLoading: settingsLoading, patchSettings } = useUserSettings(userId)

  const [step, setStep] = useState(1)
  const [visible, setVisible] = useState(false)
  const [candidateName, setCandidateName] = useState('')
  const [inviteInput, setInviteInput] = useState('')
  const [joining, setJoining] = useState(false)
  const addCandidate = useAddCandidate(workspaceId)
  const qc = useQueryClient()
  const hadCandidatesAtMount = useRef(hasCandidatesInitially)
  const dismissedRef = useRef(false)

  useBodyScrollLock(visible)

  // Gösterim kararı:
  //  • Tekrar-başlat: Ayarlar'dan gelen tek seferlik geçici işaret (kalıcı veri
  //    değil) — aday guard'ını bypass eder, kalıcı flag'e dokunmaz.
  //  • Otomatik: kalıcı flag false + mount'ta aday yoktu (yeni kullanıcı).
  useEffect(() => {
    if (!userId || settingsLoading || dismissedRef.current) return
    const forceTour =
      typeof window !== 'undefined' && sessionStorage.getItem('nmm_force_tour') === '1'
    if (forceTour) {
      sessionStorage.removeItem('nmm_force_tour')
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setStep(1)
      setVisible(true)
      return
    }
    if (!settings.onboardingDone && !hadCandidatesAtMount.current) {
      setVisible(true)
    }
  }, [userId, settingsLoading, settings.onboardingDone])

  async function dismiss() {
    dismissedRef.current = true
    setVisible(false)
    if (!userId) return
    writeUserSettingsCache(userId, { ...settings, onboardingDone: true })
    try {
      await patchSettings({ onboardingDone: true })
    } catch {
      /* Modal kapalı; bir sonraki yüklemede sunucu senkron olur */
    }
  }

  const firstName = ws?.fullName?.trim().split(' ')[0] ?? ''

  async function handleAddCandidate() {
    const name = candidateName.trim()
    if (!name) { setStep(3); return }
    await addCandidate.mutateAsync({ full_name: name, phone: null, note: null, stage: 'yeni', last_contact_at: null })
    toast.success(`İlk adayın eklendi: ${name} 🎉`)
    setStep(3)
  }

  async function handleJoin() {
    const code = inviteInput.trim().toUpperCase()
    if (!code) { setStep(4); return }
    if (code === inviteCode) { toast.error('Zaten bu çalışma alanındasınız!'); setStep(4); return }
    setJoining(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Oturum yok.')

      const { error: rpcError } = await supabase.rpc('nmm_join_workspace', { p_invite_code: code })
      if (rpcError) {
        toast.error(rpcError.message?.includes('invalid_invite_code') ? 'Geçersiz davet kodu.' : 'Ekibe katılım sırasında bir hata oluştu.')
        setJoining(false)
        return
      }

      toast.success('Başarıyla ekibe katıldınız!')
      qc.invalidateQueries({ queryKey: ['workspace'] })
      qc.invalidateQueries({ queryKey: ['team'] })
      qc.invalidateQueries({ queryKey: ['candidates'] })
    } catch {
      toast.error('Katılım başarısız oldu.')
    } finally {
      setJoining(false)
    }
    setStep(4)
  }

  if (!visible) return null

  const steps = [
    { icon: Rocket,       title: 'Hoş geldin!',      num: 1 },
    { icon: UserPlus,     title: 'İlk adayını ekle',  num: 2 },
    { icon: Users,        title: 'Bir ekibe katıl',    num: 3 },
    { icon: PartyPopper,  title: 'Hazırsın!',          num: 4 },
  ]

  return (
    <>
      <div className={`fixed inset-0 ${Z.confirmBackdrop} bg-black/40 backdrop-blur-sm`} onClick={dismiss} />
      <div className={`fixed left-1/2 top-1/2 ${Z.confirm} w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] shadow-2xl overflow-hidden`}>
        {/* Adım göstergesi */}
        <div className="flex border-b border-[var(--border)]">
          {steps.map(s => (
            <div key={s.num} className={`flex-1 py-2.5 text-center text-[10px] font-semibold uppercase tracking-widest transition-colors
              ${step === s.num ? 'bg-[#534AB7] text-white' : step > s.num ? 'bg-[#EEEDFE] text-[#534AB7]' : 'text-[var(--text-3)]'}`}>
              {s.num}
            </div>
          ))}
        </div>

        <div className="p-6">
          <button onClick={dismiss} className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-3)] hover:text-[var(--text-1)]">
            <X className="h-3.5 w-3.5" />
          </button>

          {step === 1 && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEEDFE]">
                <Rocket className="h-7 w-7 text-[#534AB7]" strokeWidth={1.75} />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-1)]">
                {firstName ? `Hoş geldin, ${firstName}! 👋` : 'NMM\'ye Hoş Geldin! 👋'}
              </h2>
              <p className="text-sm text-[var(--text-2)] leading-relaxed">
                Seni <strong>3 küçük adımda</strong> kuruluma alalım. Sadece 1 dakika sürer — söz!
              </p>
              <button
                onClick={() => setStep(2)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#534AB7] py-3 text-sm font-semibold text-white hover:bg-[#453DA0]"
              >
                Başlayalım <ChevronRight className="h-4 w-4" />
              </button>
              <button onClick={dismiss} className="text-xs text-[var(--text-3)] hover:underline">Atla</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E1F5EE]">
                  <UserPlus className="h-5 w-5 text-[#0F6E56]" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-1)]">İlk Adayını Ekle</h2>
                  <p className="text-xs text-[var(--text-2)]">Tanıştığın, takip etmek istediğin birini ekle.</p>
                </div>
              </div>
              <input
                type="text"
                value={candidateName}
                onChange={e => setCandidateName(e.target.value)}
                placeholder="Ad Soyad..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none focus:border-[#0F6E56] focus:ring-2 focus:ring-[#E1F5EE]"
                onKeyDown={e => e.key === 'Enter' && handleAddCandidate()}
              />
              <button
                onClick={handleAddCandidate}
                disabled={addCandidate.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F6E56] py-3 text-sm font-semibold text-white hover:bg-[#0a5a44] disabled:opacity-60"
              >
                {addCandidate.isPending ? 'Ekleniyor...' : 'Ekle ve Devam Et'}
                {!addCandidate.isPending && <ChevronRight className="h-4 w-4" />}
              </button>
              <button onClick={() => setStep(3)} className="w-full text-center text-xs text-[var(--text-3)] hover:underline">Şimdi değil, atla</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAEEDA]">
                  <Users className="h-5 w-5 text-[#854F0B]" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-1)]">Liderinizin Ekibine Katıl</h2>
                  <p className="text-xs text-[var(--text-2)]">Bir lideriniz varsa davet kodunu gir.</p>
                </div>
              </div>
              <input
                type="text"
                value={inviteInput}
                onChange={e => setInviteInput(e.target.value.toUpperCase())}
                placeholder="Davet Kodu (örn. AHMET42)"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 font-mono text-sm text-[var(--text-1)] placeholder:font-sans placeholder:text-[var(--text-3)] outline-none focus:border-[#854F0B] focus:ring-2 focus:ring-[#FAEEDA] uppercase"
              />
              <button
                onClick={handleJoin}
                disabled={joining}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#854F0B] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {joining ? 'Katılınıyor...' : 'Ekibe Katıl ve Başla'}
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={joining}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-3 text-sm font-semibold text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)] disabled:opacity-60"
              >
                Liderim yok, tek başıma devam et
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEEDFE]">
                <PartyPopper className="h-7 w-7 text-[#534AB7]" strokeWidth={1.75} />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-1)]">
                {firstName ? `Hazırsın, ${firstName}! 🚀` : 'Hazırsın! 🚀'}
              </h2>
              <p className="text-sm text-[var(--text-2)] leading-relaxed">
                Kurulum tamam. Şimdi panonu keşfet — adaylarını ekle, takip et ve ekibini büyüt.
              </p>
              <button
                onClick={dismiss}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#534AB7] py-3 text-sm font-semibold text-white hover:bg-[#453DA0]"
              >
                Panomu Keşfet <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
