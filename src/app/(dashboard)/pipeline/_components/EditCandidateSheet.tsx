'use client'

import { useRef, useState, useCallback } from 'react'
import { X, Trash2, Camera, Upload } from 'lucide-react'
import { useUpdateCandidate, useDeleteCandidate } from '@/hooks/useCandidates'
import { STAGES_FORM } from '@/lib/domain/stages'
import { deleteWithUndo } from '@/lib/ui/deleteWithUndo'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import type { NmmCandidate, CandidateStage } from '@/types/database.types'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { createClient } from '@/lib/supabase/client'
import { resolveCandidateFields, buildCandidateContentFields } from '@/lib/domain/candidateFields'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'

const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]'
const labelClass = 'mb-1.5 block text-sm font-medium text-[var(--text-1)]'

// localStorage helpers deleted

interface Props {
  candidate: NmmCandidate
  workspaceId: string
  onClose: () => void
}

export function EditCandidateSheet({ candidate, workspaceId, onClose }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  
  // central note parsing
  const parsed = resolveCandidateFields(candidate)
  const [photo, setPhoto] = useState<string | null>(parsed.avatarUrl || null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const update = useUpdateCandidate(workspaceId)
  const del = useDeleteCandidate(workspaceId)

  useBodyScrollLock()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (uploadingPhoto) return

    const fd = new FormData(e.currentTarget)
    const rawPhone = (fd.get('phone') as string).trim()

    // Sadece Türkçe telefon numarasını boşluksuz ve harfsiz yakala
    const digitsOnly = rawPhone.replace(/\D/g, '')
    
    // Telefon numarası boş değilse ancak 10 haneden kısaysa hata ver
    if (rawPhone && digitsOnly.length < 10) {
      setPhoneError('Geçerli bir numara girin (ör. 05xx xxx xx xx)')
      return
    }
    
    // Telefon numarasını standart formata dönüştür (varsa +90 ekleyebilirsin veya sadece digits olarak bırakabilirsin)
    // Şimdilik hatasız kaydetmesi için digits formatını tercih ediyoruz (veya orijinal raw formunu)
    const phone = rawPhone ? rawPhone : ''
    setPhoneError('')

    setUploadingPhoto(true)
    try {
      let avatarUrl = photo || ''

      if (photoFile) {
        // 1. Resmi tarayıcı tarafında (Client-side) sıkıştır
        const compressionOptions = {
          maxSizeMB: 0.5, // 500KB maksimum dosya boyutu
          maxWidthOrHeight: 1024, // Genişlik veya yükseklik maksimum 1024px olsun
          useWebWorker: true,
          fileType: 'image/jpeg' // Hızlı ve boyut açısından verimli olan formata dönüştür
        }

        toast.info('Fotoğraf sıkıştırılıyor...')
        const compressedFile = await imageCompression(photoFile, compressionOptions)

        const supabase = createClient()
        const ext = 'jpg'
        const path = `avatars/candidate_${candidate.id}_${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('nmm-avatars')
          .upload(path, compressedFile, { contentType: 'image/jpeg' })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('nmm-avatars')
          .getPublicUrl(path)
        
        avatarUrl = publicUrl
      }

      // Format note combining tr, en, new/existing avatarUrl and warmth
      const rawNoteInput = (fd.get('note') as string).trim()
      const warmth = (fd.get('warmth') as 'sicak' | 'ilik' | 'soguk') || 'ilik'

      await update.mutateAsync({
        id: candidate.id,
        full_name: (fd.get('fullName') as string).trim(),
        phone: phone || null,
        stage: fd.get('stage') as CandidateStage,
        ...buildCandidateContentFields({
          noteTr: rawNoteInput,
          noteEn: parsed.noteEn,
          avatarUrl: avatarUrl || null,
          warmth,
        }),
      })
      onClose()
    } catch (err: unknown) {
      console.error(err)
      toast.error('Fotoğraf kaydedilirken hata oluştu.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  function handleDelete() {
    setConfirmOpen(true)
  }

  function handleDeleteConfirmed() {
    setConfirmOpen(false)
    deleteWithUndo(candidate.full_name, () => del.mutate(candidate.id))
    onClose()
  }

  const handleConfirmCancel = useCallback(() => setConfirmOpen(false), [])

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
      const dataUrl = ev.target?.result as string
      setPhoto(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  function handleRemovePhoto() {
    setPhoto(null)
    setPhotoFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <div className={`fixed inset-0 ${Z.sheetBackdrop} bg-black/30 backdrop-blur-sm`} onClick={onClose} />
      <div className={`fixed left-1/2 top-4 md:top-1/2 ${Z.sheet} w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 translate-y-0 md:-translate-y-1/2 rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl`} style={{ maxHeight: 'calc(100dvh - 5.5rem)', overflowY: 'auto' }}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-1)]">Düzenle</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Profil Fotoğrafı */}
        <div className="mb-5">
          <label className={labelClass}>Profil Fotoğrafı</label>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <PersonAvatar
                name={candidate.full_name}
                imageUrl={photo}
                size="2xl"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#534AB7] text-white shadow-md transition hover:bg-[#453DA0]"
                title="Fotoğraf Yükle"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-xs font-semibold text-[var(--text-2)] transition hover:bg-[#EEEDFE] hover:text-[#534AB7]"
              >
                <Upload className="h-3.5 w-3.5" />
                Fotoğraf Yükle
              </button>
              {photo && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="flex items-center gap-1.5 rounded-xl border border-[#FBEAF0] bg-[#FBEAF0] px-3 py-2 text-xs font-semibold text-[#72243E] transition hover:bg-[#f5d4e0]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Fotoğrafı Kaldır
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
            <label className={labelClass} htmlFor="edit-fullName">Ad Soyad *</label>
            <input id="edit-fullName" name="fullName" required defaultValue={candidate.full_name} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-phone">Telefon</label>
            <input
              id="edit-phone" name="phone" type="tel"
              defaultValue={candidate.phone ?? ''} placeholder="05xxxxxxxxx"
              className={`${inputClass} ${phoneError ? 'border-[#72243E] focus:border-[#72243E] focus:ring-[#FBEAF0]' : ''}`}
              onChange={() => phoneError && setPhoneError('')}
            />
            {phoneError && <p className="mt-1 text-xs text-[#72243E]">{phoneError}</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-stage">Aşama</label>
            <select id="edit-stage" name="stage" defaultValue={candidate.stage} className={inputClass}>
              {STAGES_FORM.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-warmth">İlişki Derecesi (Sıcaklık)</label>
            <select id="edit-warmth" name="warmth" defaultValue={parsed.warmth || 'ilik'} className={inputClass}>
              <option value="sicak">🔥 Sıcak (Hot)</option>
              <option value="ilik">☀️ Ilık (Warm)</option>
              <option value="soguk">❄️ Soğuk (Cold)</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-note">
              Not <span className="font-normal text-[var(--text-3)]">(max 1000 karakter)</span>
            </label>
            <textarea id="edit-note" name="note" rows={3} maxLength={1000} defaultValue={parsed.noteTr} placeholder="Kısa bir not..." className={`${inputClass} resize-none`} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={update.isPending || uploadingPhoto} className="flex-1 rounded-xl bg-[#534AB7] py-3 text-sm font-semibold text-white transition hover:bg-[#453DA0] disabled:opacity-60">
              {update.isPending || uploadingPhoto ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button type="button" onClick={handleDelete} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FBEAF0] text-[#72243E] transition hover:bg-[#f5d4e0]">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      {confirmOpen && (
        <ConfirmDeleteModal
          onConfirm={handleDeleteConfirmed}
          onCancel={handleConfirmCancel}
        />
      )}
    </>
  )
}
