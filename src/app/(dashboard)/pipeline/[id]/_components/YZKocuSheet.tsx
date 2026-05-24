'use client'

import { useActionState, useState } from 'react'
import { X, Bot, Copy, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { generateCoachMessage } from '../actions'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { waHref } from '@/lib/waLink'
import type { NmmCandidate } from '@/types/database.types'

const MESSAGE_TYPES = [
  { value: 'davet',    label: 'Davet' },
  { value: 'sunum',    label: 'Sunum' },
  { value: 'takip',    label: 'Takip' },
  { value: 'tesekkur', label: 'Teşekkür' },
  { value: 'genel',    label: 'Genel' },
]

interface Props {
  candidate: NmmCandidate
  onClose: () => void
}

export function YZKocuSheet({ candidate, onClose }: Props) {
  const [state, action, isPending] = useActionState(generateCoachMessage, {})
  const [messageType, setMessageType] = useState('takip')

  function handleCopy() {
    if (state.message) navigator.clipboard.writeText(state.message)
  }

  function handleWhatsApp() {
    const href = waHref(candidate.phone, state.message)
    if (href) window.open(href, '_blank')
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-4 md:top-1/2 z-50 w-[calc(100%-2rem)] md:w-[420px] -translate-x-1/2 translate-y-0 md:-translate-y-1/2 rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl" style={{ maxHeight: 'calc(100dvh - 5.5rem)', overflowY: 'auto' }}>
        {/* Başlık */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEEDFE]">
              <Bot className="h-4 w-4 text-[#534AB7]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-1)]">YZ Koçu</p>
              <p className="text-xs text-[var(--text-3)]">{candidate.full_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={action} className="space-y-4">
          {/* Gizli alanlar */}
          <input type="hidden" name="candidateId" value={candidate.id} />
          <input type="hidden" name="name" value={candidate.full_name} />
          <input type="hidden" name="stage" value={candidate.stage} />
          <input type="hidden" name="note" value={candidate.note ? candidate.note.split('|||')[0].trim() : ''} />
          <input type="hidden" name="messageType" value={messageType} />

          {/* Mesaj türü */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">Mesaj Amacı</p>
            <div className="flex flex-wrap gap-2">
              {MESSAGE_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setMessageType(t.value)}
                  className={clsx(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                    messageType === t.value
                      ? 'border-[#534AB7] bg-[#EEEDFE] text-[#534AB7]'
                      : 'border-[var(--border)] text-[var(--text-2)] hover:border-[#534AB7]/50'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {state.error && (
            <p className="rounded-xl bg-[#FBEAF0] px-4 py-2.5 text-sm text-[#72243E]">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#534AB7] py-3 text-sm font-semibold text-white transition hover:bg-[#453DA0] disabled:opacity-60"
          >
            {isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Oluşturuluyor...</>
              : <><Bot className="h-4 w-4" /> Mesaj Oluştur</>
            }
          </button>
        </form>

        {state.message && (
          <div className="mt-4 rounded-2xl border border-[#d4d0f7] bg-[#f5f4fe] dark:border-[#2d2a5e] dark:bg-[#1a1830] p-4">
            <p className="mb-3 text-xs font-semibold text-[#534AB7]">Oluşturulan Mesaj</p>
            <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-1)]">{state.message}</p>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-2.5 text-xs font-semibold text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)]"
              >
                <Copy className="h-3.5 w-3.5" />
                Kopyala
              </button>
              {candidate.phone && (
                <button
                  onClick={handleWhatsApp}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  WhatsApp
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
