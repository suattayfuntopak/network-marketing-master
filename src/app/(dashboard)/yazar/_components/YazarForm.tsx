'use client'

import { useActionState, useState, useRef } from 'react'
import { Copy, Loader2, Bot, Users, X, Search } from 'lucide-react'
import { clsx } from 'clsx'
import { generateMessageAction } from '../actions'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import type { NmmCandidate } from '@/types/database.types'

const STAGES = [
  { value: 'yeni',     label: 'Yeni Aday' },
  { value: 'iletisim', label: 'İletişim Kuruldu' },
  { value: 'takip',    label: 'Takip Bekliyor' },
  { value: 'sunum',    label: 'Sunum Yapıldı' },
  { value: 'kararsiz', label: 'Kararsız' },
]

const TONES = [
  { value: 'samimi',  label: 'Samimi' },
  { value: 'resmi',   label: 'Resmi' },
  { value: 'neşeli',  label: 'Neşeli' },
  { value: 'meraklı', label: 'Meraklı' },
]

const STAGE_LABEL: Partial<Record<NmmCandidate['stage'], string>> = {
  yeni:     'Yeni Aday',
  iletisim: 'İletişim',
  takip:    'Takip',
  sunum:    'Sunum',
  kararsiz: 'Kararsız',
}

const labelClass = 'mb-1.5 block text-sm font-medium text-[var(--text-1)]'
const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition focus:border-[#0F6E56] focus:ring-2 focus:ring-[#E1F5EE]'

export function YazarForm() {
  const [state, action, isPending] = useActionState(generateMessageAction, {})
  const [selectedName, setSelectedName] = useState('')
  const [selectedStage, setSelectedStage] = useState('')
  const [search, setSearch] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
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
    setSelectedStage(c.stage in { yeni:1, iletisim:1, takip:1, sunum:1, kararsiz:1 } ? c.stage : '')
    setSearch('')
    setPickerOpen(false)
  }

  function openPicker() {
    setPickerOpen(true)
    setTimeout(() => searchRef.current?.focus(), 50)
  }

  function handleCopy() {
    if (state.message) navigator.clipboard.writeText(state.message)
  }

  function handleWhatsApp(phone: string | null | undefined) {
    if (!state.message || !phone) return
    const number = `90${phone.replace(/^0/, '')}`
    const encoded = encodeURIComponent(state.message)
    window.open(`https://wa.me/${number}?text=${encoded}`, '_blank')
  }

  const selectedCandidate = candidates.find(c => c.full_name === selectedName)

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4">
        {/* Aday adı — arama / seçim */}
        <div>
          <label className={labelClass} htmlFor="name">Aday Adı</label>
          <div className="relative flex items-center">
            <input
              id="name"
              name="name"
              required
              value={selectedName}
              onChange={e => setSelectedName(e.target.value)}
              placeholder="Aday adı yazın veya seçin"
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={openPicker}
              title="Adaylardan seç"
              className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-3)] transition hover:text-[#534AB7]"
            >
              <Users className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Aşama */}
        <div>
          <label className={labelClass} htmlFor="stage">Aşama</label>
          <select
            id="stage"
            name="stage"
            required
            value={selectedStage}
            onChange={e => setSelectedStage(e.target.value)}
            className={inputClass}
          >
            <option value="">Seç...</option>
            {STAGES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Ek bilgi */}
        <div>
          <label className={labelClass} htmlFor="context">Ek Bilgi (isteğe bağlı)</label>
          <textarea
            id="context"
            name="context"
            rows={2}
            placeholder="Geçen hafta konuştuk, ürünü merak ediyordu..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Ton */}
        <div>
          <label className={labelClass}>Ton</label>
          <div className="flex flex-wrap gap-2">
            {TONES.map(t => (
              <label key={t.value} className="cursor-pointer">
                <input type="radio" name="tone" value={t.value} defaultChecked={t.value === 'samimi'} className="peer sr-only" />
                <span className="rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-medium text-[var(--text-2)] transition peer-checked:border-[#0F6E56] peer-checked:bg-[#E1F5EE] peer-checked:text-[#0F6E56]">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {state.error && (
          <p className="rounded-xl bg-[#FBEAF0] px-4 py-2.5 text-sm text-[#72243E]">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F6E56] py-3 text-sm font-semibold text-white transition hover:bg-[#0a5a44] disabled:opacity-60"
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
                className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-2)] shadow-sm transition hover:bg-[var(--bg-subtle)]"
              >
                <Copy className="h-3.5 w-3.5" />
                Kopyala
              </button>
              {selectedCandidate?.phone && (
                <button
                  onClick={() => handleWhatsApp(selectedCandidate.phone)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  WhatsApp
                </button>
              )}
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm text-[var(--text-1)] leading-relaxed">{state.message}</p>
        </div>
      )}

      {/* Aday seçici modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPickerOpen(false)}
          />
          <div className="relative z-10 flex w-full max-w-lg flex-col rounded-t-3xl bg-[var(--bg-card)] shadow-2xl md:rounded-2xl" style={{ maxHeight: '80vh' }}>
            {/* Başlık */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <p className="text-sm font-bold text-[var(--text-1)]">Aday Seç</p>
              <button
                onClick={() => setPickerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Arama */}
            <div className="border-b border-[var(--border)] px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Ara..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-2 pl-9 pr-4 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none focus:border-[#534AB7]"
                />
              </div>
            </div>

            {/* Liste */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--text-3)]">Aday bulunamadı</p>
              ) : (
                filtered.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCandidate(c)}
                    className="flex w-full items-center gap-3 border-b border-[var(--border)] px-4 py-3 text-left transition hover:bg-[var(--bg-subtle)] last:border-b-0"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-xs font-bold text-[#534AB7]">
                      {c.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-1)]">{c.full_name}</p>
                      {c.phone && <p className="text-xs text-[var(--text-3)]">{c.phone}</p>}
                    </div>
                    {STAGE_LABEL[c.stage] && (
                      <span className="shrink-0 rounded-full bg-[#EEEDFE] px-2 py-0.5 text-[10px] font-semibold text-[#534AB7]">
                        {STAGE_LABEL[c.stage]}
                      </span>
                    )}
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
