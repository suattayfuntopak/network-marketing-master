'use client'

import { useActionState, useState, useRef } from 'react'
import { Copy, Loader2, Bot, X, Search } from 'lucide-react'
import { clsx } from 'clsx'
import { generateMessageAction } from '../actions'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { STAGE_LABEL } from '@/lib/stages'
import { waHref } from '@/lib/waLink'
import type { NmmCandidate } from '@/types/database.types'

const MESSAGE_TYPES = [
  { value: 'genel',    label: 'Genel' },
  { value: 'davet',    label: 'Davet' },
  { value: 'sunum',    label: 'Sunum' },
  { value: 'takip',    label: 'Takip' },
  { value: 'tesekkur', label: 'Teşekkür' },
]

const TONES = [
  { value: 'samimi',  label: 'Samimi' },
  { value: 'resmi',   label: 'Resmi' },
  { value: 'neseli',  label: 'Neşeli' },
  { value: 'merakli', label: 'Meraklı' },
]

const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition focus:border-[#0F6E56] focus:ring-2 focus:ring-[#E1F5EE]'

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-full border px-3.5 py-1.5 text-sm font-medium transition whitespace-nowrap',
        active
          ? 'border-[#0F6E56] bg-[#E1F5EE] text-[#0F6E56]'
          : 'border-[var(--border)] text-[var(--text-2)] hover:border-[#0F6E56]/50 hover:text-[var(--text-1)]'
      )}
    >
      {children}
    </button>
  )
}

export function YazarForm() {
  const [state, action, isPending] = useActionState(generateMessageAction, {})
  const [selectedName, setSelectedName] = useState('')
  const [selectedStage, setSelectedStage] = useState('')
  const [search, setSearch] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [messageType, setMessageType] = useState('genel')
  const [tone, setTone] = useState('samimi')
  const searchRef = useRef<HTMLInputElement>(null)

  const { data: ws } = useWorkspace()
  const { candidates } = useCandidates(ws?.workspaceId)

  const sorted = [...candidates].sort((a, b) =>
    a.full_name.localeCompare(b.full_name, 'tr')
  )
  const filtered = search
    ? sorted.filter(c => c.full_name.toLowerCase().includes(search.toLowerCase()))
    : sorted

  function selectCandidate(c: NmmCandidate) {
    setSelectedName(c.full_name)
    setSelectedStage(c.stage)
    setSearch('')
    setPickerOpen(false)
  }

  function handleCopy() {
    if (state.message) navigator.clipboard.writeText(state.message)
  }

  const selectedCandidate = candidates.find(c => c.full_name === selectedName)
  const waLink = waHref(selectedCandidate?.phone, state.message)

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-5">
        {/* Hidden fields */}
        <input type="hidden" name="messageType" value={messageType} />
        <input type="hidden" name="tone" value={tone} />
        <input type="hidden" name="stage" value={selectedStage} />

        {/* Mesaj Türü + Ton — side by side on desktop */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-[var(--text-1)]">Mesaj Türü</p>
            <div className="flex flex-wrap gap-2">
              {MESSAGE_TYPES.map(t => (
                <Pill key={t.value} active={messageType === t.value} onClick={() => setMessageType(t.value)}>
                  {t.label}
                </Pill>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-[var(--text-1)]">Ton</p>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <Pill key={t.value} active={tone === t.value} onClick={() => setTone(t.value)}>
                  {t.label}
                </Pill>
              ))}
            </div>
          </div>
        </div>

        {/* Kişi seçimi */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[var(--text-1)]" htmlFor="name">
            Kişi
          </label>
          <input
            id="name"
            name="name"
            required
            value={selectedName}
            onChange={e => setSelectedName(e.target.value)}
            onFocus={() => setPickerOpen(true)}
            placeholder="Kişi adını yaz veya listeden seç..."
            autoComplete="off"
            className={inputClass}
          />
        </div>

        {/* Ek bilgi */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[var(--text-1)]" htmlFor="context">
            Ek Bilgi{' '}
            <span className="text-xs font-normal text-[var(--text-3)]">(isteğe bağlı)</span>
          </label>
          <textarea
            id="context"
            name="context"
            rows={2}
            maxLength={500}
            placeholder="Geçen hafta konuştuk, ürünü merak ediyordu..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {state.error && (
          <p className="rounded-xl bg-[#FBEAF0] px-4 py-2.5 text-sm text-[#72243E]">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F6E56] py-3.5 text-sm font-semibold text-white transition hover:bg-[#0a5a44] disabled:opacity-60"
        >
          {isPending
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Yazıyor...</>
            : <><Bot className="h-4 w-4" /> Yapay Zeka Mesajı Oluştur</>
          }
        </button>
      </form>

      {/* Oluşturulan mesaj */}
      {state.message && (
        <div className="rounded-2xl border border-[#D2EFE4] bg-[#F4FBF8] dark:border-[#2d5a47] dark:bg-[#1a2e28] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-[#0F6E56]">Oluşturulan Mesaj</p>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)]"
              >
                <Copy className="h-3.5 w-3.5" />
                Kopyala
              </button>
              {waLink && (
                <button
                  onClick={() => window.open(waLink, '_blank')}
                  className="flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  WhatsApp
                </button>
              )}
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-1)]">{state.message}</p>
        </div>
      )}

      {/* Kişi seçici modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPickerOpen(false)}
          />
          <div className="relative z-10 flex w-full max-w-lg flex-col rounded-t-3xl bg-[var(--bg-card)] shadow-2xl md:rounded-2xl" style={{ maxHeight: '80vh' }}>
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <p className="text-sm font-bold text-[var(--text-1)]">Kişi Seç</p>
              <button
                onClick={() => setPickerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="border-b border-[var(--border)] px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Ara..."
                  autoFocus
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-2 pl-9 pr-4 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none focus:border-[#534AB7]"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--text-3)]">Kişi bulunamadı</p>
              ) : (
                filtered.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={() => selectCandidate(c)}
                    className="flex w-full items-center gap-3 border-b border-[var(--border)] px-4 py-3 text-left transition hover:bg-[var(--bg-subtle)] last:border-b-0"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-xs font-bold text-[#534AB7]">
                      {c.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-1)]">{c.full_name}</p>
                      {c.phone && <p className="text-xs text-[var(--text-3)]">{c.phone}</p>}
                    </div>
                    <span className="shrink-0 rounded-full bg-[#EEEDFE] px-2 py-0.5 text-[10px] font-semibold text-[#534AB7]">
                      {STAGE_LABEL[c.stage]}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
