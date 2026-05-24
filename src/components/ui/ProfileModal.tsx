'use client'

import { useState, useEffect } from 'react'
import { X, User, Mail, Lock, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface ProfileModalProps {
  onClose: () => void
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Form states
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  useEffect(() => {
    // Escape key listener
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    // Fetch initial profile
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setEmail(user.email ?? '')
          
          // Get workspace member info for name
          const { data: member } = await supabase
            .from('nmm_workspace_members')
            .select('full_name')
            .eq('user_id', user.id)
            .maybeSingle()

          if (member?.full_name) {
            setFullName(member.full_name)
          }
        }
      } catch (err) {
        console.error('Profil yüklenirken hata:', err)
      } finally {
        setFetching(false)
      }
    }

    loadProfile()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, supabase])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    if (password && password !== passwordConfirm) {
      toast.error('Şifreler eşleşmiyor!')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Oturum bulunamadı.')

      // 1. Update Display Name in database
      if (fullName.trim()) {
        const { error: memberError } = await supabase
          .from('nmm_workspace_members')
          .update({ full_name: fullName.trim() })
          .eq('user_id', user.id)

        if (memberError) throw memberError
      }

      // 2. Update Auth email if changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email })
        if (emailError) throw emailError
        toast.info('E-posta güncellemesi için doğrulama e-postası gönderildi.')
      }

      // 3. Update Auth password if filled
      if (password) {
        const { error: passwordError } = await supabase.auth.updateUser({ password })
        if (passwordError) throw passwordError
        toast.success('Şifre başarıyla güncellendi.')
        setPassword('')
        setPasswordConfirm('')
      }

      // Invalidate workspace cache to update header
      queryClient.invalidateQueries({ queryKey: ['workspace'] })
      toast.success('Profil güncellendi')
      onClose()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Güncellenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border)] transition-all">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-1)]">Profil Bilgileri</h2>
            <p className="text-xs text-[var(--text-3)]">Hesap ve kişisel detaylarınızı düzenleyin</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {fetching ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-[#534AB7]" />
            <p className="text-sm text-[var(--text-2)]">Yükleniyor...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Ad Soyad */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-2)]">Ad Soyad</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Örn: Selda Kıratlı"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3 pl-10 pr-4 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7] transition-all"
                />
              </div>
            </div>

            {/* E-posta */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-2)]">E-posta Adresi</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ornek@domain.com"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3 pl-10 pr-4 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7] transition-all"
                />
              </div>
            </div>

            {/* Şifre Alanları */}
            <div className="border-t border-[var(--border)] pt-4 mt-6 space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">Şifre Değiştir</h3>
                <p className="text-[10px] text-[var(--text-3)]">Değiştirmek istemiyorsanız boş bırakın</p>
              </div>

              {/* Yeni Şifre */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-2)]">Yeni Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    minLength={6}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3 pl-10 pr-4 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7] transition-all"
                  />
                </div>
              </div>

              {/* Yeni Şifre Tekrar */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-2)]">Yeni Şifre Tekrar</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    placeholder="Şifreyi onaylayın"
                    minLength={6}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3 pl-10 pr-4 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Kaydet Butonu */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#534AB7] py-3 text-sm font-semibold text-white transition hover:bg-[#433a9f] active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                'Değişiklikleri Kaydet'
              )}
            </button>
          </form>
        )}
      </div>
    </>
  )
}
