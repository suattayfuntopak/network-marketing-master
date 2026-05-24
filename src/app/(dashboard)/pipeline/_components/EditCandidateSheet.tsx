'use client'

import { useRef, useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { useUpdateCandidate, useDeleteCandidate } from '@/hooks/useCandidates'
import { STAGES_FORM } from '@/lib/stages'
import { deleteWithUndo } from '@/lib/deleteWithUndo'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import type { NmmCandidate, CandidateStage } from '@/types/database.types'

const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]'
const labelClass = 'mb-1.5 block text-sm font-medium text-[var(--text-1)]'

interface Props {
  candidate: NmmCandidate
  workspaceId: string
  onClose: () => void
}

export function EditCandidateSheet({ candidate, workspaceId, onClose }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
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

  function handleDelete() {
    setConfirmOpen(true)
  }

  function handleDeleteConfirmed() {
    setConfirmOpen(false)
    deleteWithUndo(
      candidate.full_name,
      () => del.mutate(candidate.id),
      onClose,
    )
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-40 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl" style={{ maxHeight: '90dvh', overflowY: 'auto' }}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-1)]">Düzenle</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="edit-fullName">Ad Soyad *</label>
            <input id="edit-fullName" name="fullName" required defaultValue={candidate.full_name} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-phone">Telefon</label>
            <input id="edit-phone" name="phone" type="tel" defaultValue={candidate.phone ?? ''} placeholder="05xxxxxxxxx" className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-stage">Aşama</label>
            <select id="edit-stage" name="stage" defaultValue={candidate.stage} className={inputClass}>
              {STAGES_FORM.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-note">
              Not <span className="font-normal text-[var(--text-3)]">(max 500 karakter)</span>
            </label>
            <textarea id="edit-note" name="note" rows={3} maxLength={500} defaultValue={candidate.note ?? ''} placeholder="Kısa bir not..." className={`${inputClass} resize-none`} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={update.isPending} className="flex-1 rounded-xl bg-[#534AB7] py-3 text-sm font-semibold text-white transition hover:bg-[#453DA0] disabled:opacity-60">
              {update.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button type="button" onClick={handleDelete} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FBEAF0] text-[#72243E] transition hover:bg-[#f5d4e0]">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      {confirmOpen && (
        <ConfirmDeleteModal
          name={candidate.full_name}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  )
}
