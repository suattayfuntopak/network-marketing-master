'use client'

import { useRef } from 'react'
import { X } from 'lucide-react'
import { useAddCandidate } from '@/hooks/useCandidates'

interface AddCandidateSheetProps {
  workspaceId: string
  onClose: () => void
}

export function AddCandidateSheet({ workspaceId, onClose }: AddCandidateSheetProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const add = useAddCandidate(workspaceId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const fullName = (fd.get('fullName') as string).trim()
    const phone = (fd.get('phone') as string).trim()
    const note = (fd.get('note') as string).trim()

    if (!fullName) return

    await add.mutateAsync({
      full_name: fullName,
      phone: phone || null,
      note: note || null,
      stage: 'yeni',
      last_contact_at: null,
    })

    formRef.current?.reset()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl bg-white p-6 pb-10 shadow-2xl md:left-auto md:right-8 md:top-8 md:bottom-auto md:w-96 md:rounded-2xl md:pb-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Yeni Aday Ekle</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-900" htmlFor="fullName">
              Ad Soyad *
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder="Adı Soyadı"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-900" htmlFor="phone">
              Telefon
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="05xxxxxxxxx"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-900" htmlFor="note">
              Not <span className="font-normal text-gray-400">(max 200 karakter)</span>
            </label>
            <textarea
              id="note"
              name="note"
              rows={2}
              maxLength={200}
              placeholder="Kısa bir not..."
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]"
            />
          </div>

          {add.isError && (
            <p className="rounded-xl bg-[#FBEAF0] px-4 py-2.5 text-sm text-[#72243E]">
              Aday eklenemedi. Tekrar dene.
            </p>
          )}

          <button
            type="submit"
            disabled={add.isPending}
            className="w-full rounded-xl bg-[#534AB7] py-3 text-sm font-semibold text-white transition hover:bg-[#453DA0] disabled:opacity-60"
          >
            {add.isPending ? 'Ekleniyor...' : 'Aday Ekle'}
          </button>
        </form>
      </div>
    </>
  )
}
