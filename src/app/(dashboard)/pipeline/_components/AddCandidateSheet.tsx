'use client'

import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useAddCandidate } from '@/hooks/useCandidates'
import { STAGES_FORM } from '@/lib/stages'
import { Z } from '@/lib/zIndex'

const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]'
const labelClass = 'mb-1.5 block text-sm font-medium text-[var(--text-1)]'

interface AddCandidateSheetProps {
  workspaceId: string
  onClose: () => void
}

const PHONE_RE = /^(\+90|0)5\d{9}$/

export function AddCandidateSheet({ workspaceId, onClose }: AddCandidateSheetProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [phoneError, setPhoneError] = useState('')
  const add = useAddCandidate(workspaceId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const fullName = (fd.get('fullName') as string).trim()
    const phone = (fd.get('phone') as string).trim()
    const note = (fd.get('note') as string).trim()
    const stage = (fd.get('stage') as string | null) || 'yeni'
    if (!fullName) return
    if (phone && !PHONE_RE.test(phone)) {
      setPhoneError('Geçerli bir numara girin (ör. 05xx xxx xx xx)')
      return
    }
    setPhoneError('')
    await add.mutateAsync({ full_name: fullName, phone: phone || null, note: note || null, stage: stage as never, last_contact_at: null })
    formRef.current?.reset()
    onClose()
  }

  return (
    <>
      <div className={`fixed inset-0 ${Z.sheetBackdrop} bg-black/30 backdrop-blur-sm`} onClick={onClose} />
      <div className={`fixed left-1/2 top-1/2 ${Z.sheet} w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl`} style={{ maxHeight: '90dvh', overflowY: 'auto' }}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-1)]">Yeni Kişi Ekle</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)]">
            <X className="h-4 w-4" />
          </button>
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
            <label className={labelClass} htmlFor="note">
              Not <span className="font-normal text-[var(--text-3)]">(max 500 karakter)</span>
            </label>
            <textarea id="note" name="note" rows={2} maxLength={500} placeholder="Kısa bir not..." className={`${inputClass} resize-none`} />
          </div>
          {add.isError && (
            <p className="rounded-xl bg-[#FBEAF0] px-4 py-2.5 text-sm text-[#72243E]">Kişi eklenemedi. Tekrar dene.</p>
          )}
          <button type="submit" disabled={add.isPending} className="w-full rounded-xl bg-[#534AB7] py-3 text-sm font-semibold text-white transition hover:bg-[#453DA0] disabled:opacity-60">
            {add.isPending ? 'Ekleniyor...' : 'Kişi Ekle'}
          </button>
        </form>
      </div>
    </>
  )
}
