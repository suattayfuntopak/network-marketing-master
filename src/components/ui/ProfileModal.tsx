'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, User, Mail, Lock, Loader2, Camera } from 'lucide-react'
import {
  getProfileAction,
  uploadAvatarAction,
  setUserAvatarAction,
  updateProfileAction,
} from '@/app/(dashboard)/actions/profile'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useHistoryBackClose } from '@/hooks/useHistoryBackClose'

import { queryInvalidator } from '@/lib/query/invalidator'

interface ProfileModalProps {
  onClose: () => void
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mounted] = useState(() => typeof window !== 'undefined')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Form states
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useBodyScrollLock()
  useHistoryBackClose(true, onClose)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    async function loadProfile() {
      try {
        const profile = await getProfileAction()
        setUserId(profile.userId)
        setEmail(profile.email)
        setAvatarUrl(profile.avatarUrl)
        setAvatarPreview(profile.avatarUrl)
        if (profile.fullName) setFullName(profile.fullName)
      } catch (err) {
        console.error('Profil yüklenirken hata:', err)
      } finally {
        setFetching(false)
      }
    }

    loadProfile()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    // Validate
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Fotoğraf 2MB\'den büyük olamaz.')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir resim dosyası seçin.')
      return
    }

    // Local preview
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploadingAvatar(true)
    try {
      // 1. Resmi tarayıcı tarafında (Client-side) sıkıştır
      const compressionOptions = {
        maxSizeMB: 0.5, // 500KB maksimum dosya boyutu
        maxWidthOrHeight: 1024, // Genişlik veya yükseklik maksimum 1024px olsun
        useWebWorker: true,
        fileType: 'image/jpeg' // Hızlı ve boyut açısından verimli olan formata dönüştür
      }

      toast.info('Fotoğraf sıkıştırılıyor...')
      const compressedFile = await imageCompression(file, compressionOptions)

      const fd = new FormData()
      fd.set('file', new File([compressedFile], 'avatar.jpg', { type: 'image/jpeg' }))
      fd.set('scope', 'user')
      if (avatarUrl) fd.set('oldAvatarUrl', avatarUrl)
      const { publicUrl } = await uploadAvatarAction(fd)

      // Save to auth metadata
      await setUserAvatarAction(publicUrl)

      const { syncMemberAvatarAction } = await import('@/app/(dashboard)/ekip/actions')
      await syncMemberAvatarAction(publicUrl)

      setAvatarUrl(publicUrl)
      setAvatarPreview(publicUrl)
      queryInvalidator.invalidateWorkspace(queryClient)
      queryInvalidator.invalidateTeam(queryClient)
      toast.success('Profil fotoğrafı güncellendi!')
    } catch (err: unknown) {
      console.error(err)
      // Bucket might not exist yet — store as base64 in metadata as fallback
      toast.error('Fotoğraf yüklenemedi. Supabase Storage "nmm-avatars" bucket\'ı için upload policy gerekiyor.')
      setAvatarPreview(avatarUrl) // revert preview
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    if (password && password !== passwordConfirm) {
      toast.error('Şifreler eşleşmiyor!')
      return
    }

    setLoading(true)
    try {
      const { emailChangeRequested } = await updateProfileAction({
        fullName,
        email,
        password: password || undefined,
      })

      if (emailChangeRequested) {
        toast.info('E-posta güncellemesi için doğrulama e-postası gönderildi.')
      }
      if (password) {
        toast.success('Şifre başarıyla güncellendi.')
        setPassword('')
        setPasswordConfirm('')
      }

      queryInvalidator.invalidateWorkspace(queryClient)
      toast.success('Profil güncellendi')
      onClose()
    } catch (err: unknown) {
      console.error(err)
      toast.error((err instanceof Error ? err.message : '') || 'Güncellenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  if (!mounted) return null

  return createPortal(
    <div className={`fixed inset-0 ${Z.sheet} flex items-center justify-center p-4 overscroll-contain`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border)] transition-all" style={{ maxHeight: 'calc(100dvh - 2rem)', overflowY: 'auto' }}>
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
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm text-[var(--text-2)]">Yükleniyor...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">

            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3 pb-2">
              <div className="relative">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Profil fotoğrafı"
                    width={80}
                    height={80}
                    unoptimized
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-[#534AB7]/30"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-subtle text-2xl font-bold text-brand">
                    {initials}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow-md transition hover:bg-[#433a9f] disabled:opacity-60"
                  title="Fotoğraf değiştir"
                >
                  {uploadingAvatar
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Camera className="h-3.5 w-3.5" />
                  }
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <p className="text-[10px] text-[var(--text-3)]">JPG, PNG veya GIF · Maks 2MB</p>
            </div>

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
                  placeholder="Örn: Ayşe Yılmaz"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3 pl-10 pr-4 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-brand focus:ring-1 focus:ring-[#534AB7] transition-all"
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
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3 pl-10 pr-4 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-brand focus:ring-1 focus:ring-[#534AB7] transition-all"
                />
              </div>
            </div>

            {/* Şifre */}
            <div className="border-t border-[var(--border)] pt-4 mt-2 space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">Şifre Değiştir</h3>
                <p className="text-[10px] text-[var(--text-3)]">Değiştirmek istemiyorsanız boş bırakın</p>
              </div>
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
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3 pl-10 pr-4 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-brand focus:ring-1 focus:ring-[#534AB7] transition-all"
                  />
                </div>
              </div>
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
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3 pl-10 pr-4 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-brand focus:ring-1 focus:ring-[#534AB7] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Kaydet */}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-[#433a9f] active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Güncelleniyor...</>
              ) : 'Değişiklikleri Kaydet'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}
