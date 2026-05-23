'use client'

import { useRef } from 'react'
import { X, Trash2 } from 'lucide-react'
import { useUpdateCandidate, useDeleteCandidate } from '@/hooks/useCandidates'
import type { NmmCandidate, CandidateStage } from '@/types/database.types'

const STAGES: { value: CandidateStage; label: string }[] = [
  { value: 'yeni',     label: 'Yeni Aday' },
  { value: 'iletisim', label: 'İletişim Kuruldu' },
  { value: 'takip',    label: 'Takip Bekliyor' },
  { value: 'sunum',    label: 'Sunum Yapıldı' },
  { value: 'kararsiz', label: 'Kararsız' },
  { value: 'katildi',  label: 'Katıldı' },
  { value: 'kayboldu', label: 'Kayboldu' },
]

const inputClass = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]'
const labelClass = 'mb-1.5 block text-sm font-medium text-gray-900'

interface Props {
  candidate: NmmCandidate
  workspaceId: string
  onClose: () => void
}

export function EditCandidateSheet({ candidate, workspaceId, onClose }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const update = useUpdateCandidate(workspaceId)
  const del = useDeleteCandidate(workspaceId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await update.mutateAsync({
      id: candidate.id,
      full_name: (fd.get('fullName') as string).trim(),
      phone: (fd.get('phone') as string).trim() || null,
      note: (fd.get('note') as string).trim() || null,
      stage: fd.get('stage') as CandidateStage,
    })
    onClose()
  }

  async function handleDelete() {
    if (!confirm(`"${candidate.full_name}" silinsin mi?`)) return
    await del.mutateAsync(candidate.id)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl bg-white p-6 pb-10 shadow-2xl md:left-auto md:right-8 md:top-8 md:bottom-auto md:w-96 md:rounded-2xl md:pb-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Adayı Düzenle</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="edit-fullName">Ad Soyad *</label>
            <input id="edit-fullName" name="fullName" required defaultValue={candidate.full_name}
              className={inputClass} />
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-phone">Telefon</label>
            <input id="edit-phone" name="phone" type="tel" defaultValue={candidate.phone ?? ''}
              placeholder="05xxxxxxxxx" className={inputClass} />
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-stage">Aşama</label>
            <select id="edit-stage" name="stage" defaultValue={candidate.stage} className={inputClass}>
              {STAGES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-note">Not <span className="font-normal text-gray-400">(max 200 karakter)</span></label>
            <textarea id="edit-note" name="note" rows={2} maxLength={200}
              defaultValue={candidate.note ?? ''} placeholder="Kısa bir not..."
              className={`${inputClass} resize-none`} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={update.isPending}
              className="flex-1 rounded-xl bg-[#534AB7] py-3 text-sm font-semibold text-white transition hover:bg-[#453DA0] disabled:opacity-60">
              {update.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button type="button" onClick={handleDelete} disabled={del.isPending}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FBEAF0] text-[#72243E] transition hover:bg-[#f5d4e0] disabled:opacity-60">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
