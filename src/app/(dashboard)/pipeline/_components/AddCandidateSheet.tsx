'use client'

import { useRef, useState } from 'react'
import { X, Camera, Upload, Trash2, Loader2 } from 'lucide-react'
import { useAddCandidate } from '@/hooks/useCandidates'
import { STAGES_FORM } from '@/lib/stages'
import { Z } from '@/lib/zIndex'
import { PHONE_RE } from '@/lib/validation'
import { createClient } from '@/lib/supabase/client'
import { formatNote } from '@/lib/noteParser'
import { toast } from 'sonner'

const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]'
const labelClass = 'mb-1.5 block text-sm font-medium text-[var(--text-1)]'

interface AddCandidateSheetProps {
  workspaceId: string
  onClose: () => void
}

export function AddCandidateSheet({ workspaceId, onClose }: AddCandidateSheetProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [phoneError, setPhoneError] = useState('')
  
  // Photo upload states
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const add = useAddCandidate(workspaceId)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Fotoğraf 2MB\'den büyük olamaz.')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir resim dosyası seçin.')
      return
    }

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => {
      setPhotoPreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  function handleRemovePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (uploadingPhoto) return

    const fd = new FormData(e.currentTarget)
    const fullName = (fd.get('fullName') as string).trim()
    const phone = (fd.get('phone') as string).trim()
    const note = (fd.get('note') as string).trim()
    const stage = (fd.get('stage') as string | null) || 'yeni'
    const warmth = (fd.get('warmth') as 'sicak' | 'ilik' | 'soguk') || 'ilik'
    
    if (!fullName) return
    if (phone && !PHONE_RE.test(phone)) {
      setPhoneError('Geçerli bir numara girin (ör. 05xx xxx xx xx)')
      return
    }
    setPhoneError('')

    setUploadingPhoto(true)
    try {
      const candidateId = crypto.randomUUID()
      let avatarUrl = ''

      if (photoFile) {
        const supabase = createClient()
        const ext = photoFile.name.split('.').pop() ?? 'jpg'
        const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, '') || 'jpg'
        const path = `avatars/candidate_${candidateId}_${Date.now()}.${cleanExt}`

        const { error: uploadError } = await supabase.storage
          .from('nmm-avatars')
          .upload(path, photoFile, { contentType: photoFile.type })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('nmm-avatars')
          .getPublicUrl(path)
        
        avatarUrl = publicUrl
      }

      // If a photo was uploaded, format note as Delimited (tr ||| en ||| avatarUrl ||| warmth)
      const finalNote = formatNote(note, '', avatarUrl, warmth)

      await add.mutateAsync({
        id: candidateId,
        full_name: fullName,
        phone: phone || null,
        note: finalNote || null,
        stage: stage as any,
        last_contact_at: null
      })

      formRef.current?.reset()
      onClose()
    } catch (err: any) {
      console.error(err)
      toast.error('Fotoğraf yüklenirken veya aday eklenirken hata oluştu.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <>
      <div className={`fixed inset-0 ${Z.sheetBackdrop} bg-black/30 backdrop-blur-sm`} onClick={onClose} />
      <div className={`fixed left-1/2 top-4 md:top-1/2 ${Z.sheet} w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 translate-y-0 md:-translate-y-1/2 rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl`} style={{ maxHeight: 'calc(100dvh - 5.5rem)', overflowY: 'auto' }}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-1)]">Yeni Aday Ekle</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Profil Fotoğrafı Upload UI */}
        <div className="mb-5">
          <label className={labelClass}>Profil Fotoğrafı</label>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Aday Önizleme"
                  className="h-20 w-20 rounded-full object-cover border-2 border-[#EEEDFE]"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EEEDFE] text-2xl font-bold text-[#534AB7]">
                  ?
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#534AB7] text-white shadow-md transition hover:bg-[#453DA0] disabled:opacity-60"
                title="Fotoğraf Yükle"
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-xs font-semibold text-[var(--text-2)] transition hover:bg-[#EEEDFE] hover:text-[#534AB7] disabled:opacity-60"
              >
                <Upload className="h-3.5 w-3.5" />
                Fotoğraf Seç
              </button>
              {photoPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploadingPhoto}
                  className="flex items-center gap-1.5 rounded-xl border border-[#FBEAF0] bg-[#FBEAF0] px-3 py-2 text-xs font-semibold text-[#72243E] transition hover:bg-[#f5d4e0] disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Kaldır
                </button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <p className="mt-1.5 text-[11px] text-[var(--text-3)]">Fotoğraf bulut veritabanında kalıcı olarak saklanır.</p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="fullName">Ad Soyad *</label>
            <input id="fullName" name="fullName" type="text" required placeholder="Adı Soyadı" className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="phone">Telefon</label>
            <input
              id="phone" name="phone" type="tel" placeholder="05xxxxxxxxx"
              className={`${inputClass} ${phoneError ? 'border-[#72243E] focus:border-[#72243E] focus:ring-[#FBEAF0]' : ''}`}
              onChange={() => phoneError && setPhoneError('')}
            />
            {phoneError && <p className="mt-1 text-xs text-[#72243E]">{phoneError}</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="stage">Aşama</label>
            <select id="stage" name="stage" className={inputClass}>
              {STAGES_FORM.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="warmth">İlişki Derecesi (Sıcaklık)</label>
            <select id="warmth" name="warmth" defaultValue="ilik" className={inputClass}>
              <option value="sicak">🔥 Sıcak (Hot)</option>
              <option value="ilik">☀️ Ilık (Warm)</option>
              <option value="soguk">❄️ Soğuk (Cold)</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="note">
              Not <span className="font-normal text-[var(--text-3)]">(max 1000 karakter)</span>
            </label>
            <textarea id="note" name="note" rows={2} maxLength={1000} placeholder="Kısa bir not..." className={`${inputClass} resize-none`} />
          </div>
          {add.isError && (
            <p className="rounded-xl bg-[#FBEAF0] px-4 py-2.5 text-sm text-[#72243E]">Kişi eklenemedi. Tekrar dene.</p>
          )}
          <button type="submit" disabled={add.isPending || uploadingPhoto} className="w-full rounded-xl bg-[#534AB7] py-3 text-sm font-semibold text-white transition hover:bg-[#453DA0] disabled:opacity-60">
            {add.isPending || uploadingPhoto ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Ekleniyor...
              </span>
            ) : 'Aday Ekle'}
          </button>
        </form>
      </div>
    </>
  )
}
