'use client'

import { useActionState, useState, useRef, useEffect, useCallback } from 'react'
import { Copy, Loader2, Bot, X, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { clsx } from 'clsx'
import { generateMessageAction } from '../actions'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { STAGE_LABEL } from '@/lib/stages'
import { waHref } from '@/lib/waLink'
import { isAILimitReached, incrementAIUsage, remainingAIUsage, DAILY_AI_LIMIT } from '@/lib/aiUsage'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
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

const HISTORY_KEY = 'nmm_message_history'
const MAX_HISTORY = 5

interface HistoryEntry {
  message: string
  candidateName: string
  messageType: string
  timestamp: number
}

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
  } catch { return [] }
}

function saveToHistory(entry: HistoryEntry) {
  const history = loadHistory()
  const updated = [entry, ...history].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}

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

interface Props {
  initialName?: string
  initialNote?: string
}

export function YazarForm({ initialName = '', initialNote = '' }: Props) {
  const [state, action, isPending] = useActionState(generateMessageAction, {})
  const [query, setQuery] = useState(initialName)
  const [selected, setSelected] = useState<NmmCandidate | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [messageType, setMessageType] = useState('genel')
  const [tone, setTone] = useState('samimi')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const prefilledRef = useRef(false)
  const prevMessageRef = useRef<string | undefined>(undefined)

  const { data: ws } = useWorkspace()
  const { candidates } = useCandidates(ws?.workspaceId)

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const isSuperAdmin = userEmail === 'suattayfuntopak@gmail.com'

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
    })
  }, [])

  // Sayfa yüklenince localStorage'dan history + limit durumunu al
  useEffect(() => {
    setHistory(loadHistory())
    setLimitReached(isAILimitReached(isSuperAdmin))
  }, [isSuperAdmin])

  useEffect(() => {
    if (initialName && candidates.length > 0 && !prefilledRef.current) {
      const match = candidates.find(
        c => c.full_name.toLowerCase() === initialName.toLowerCase()
      )
      if (match) {
        setSelected(match)
        setQuery('')
      }
      prefilledRef.current = true
    }
  }, [initialName, candidates])

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  // Yeni mesaj üretilince history'ye kaydet
  useEffect(() => {
    if (state.message && state.message !== prevMessageRef.current) {
      prevMessageRef.current = state.message
      incrementAIUsage(isSuperAdmin)
      setLimitReached(isAILimitReached(isSuperAdmin))
      const entry: HistoryEntry = {
        message: state.message,
        candidateName: selected?.full_name ?? query ?? 'Kişisiz',
        messageType,
        timestamp: Date.now(),
      }
      saveToHistory(entry)
      setHistory(loadHistory())
    }
  }, [state.message, selected, query, messageType, isSuperAdmin])

  const sorted = [...candidates].sort((a, b) =>
    a.full_name.localeCompare(b.full_name, 'tr')
  )
  const filtered = sorted.filter(c =>
    c.full_name.toLowerCase().includes(query.toLowerCase())
  )

  function selectCandidate(c: NmmCandidate) {
    setSelected(c)
    setQuery('')
    setDropdownOpen(false)
  }

  function clearSelection() {
    setSelected(null)
    setQuery('')
  }

  function handleCopy() {
    if (state.message) {
      navigator.clipboard.writeText(state.message)
      toast.success('Mesaj kopyalandı!')
    }
  }

  function handleCopyHistory(msg: string) {
    navigator.clipboard.writeText(msg)
    toast.success('Mesaj kopyalandı!')
  }

  const waLink = waHref(selected?.phone, state.message)
  const remaining = remainingAIUsage(isSuperAdmin)

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-5">
        <input type="hidden" name="messageType" value={messageType} />
        <input type="hidden" name="tone" value={tone} />
        <input type="hidden" name="stage" value={selected?.stage ?? ''} />
        <input type="hidden" name="name" value={selected?.full_name ?? query} />

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

        {/* Kişi — inline combobox */}
        <div ref={containerRef} className="relative">
          <label className="mb-1.5 block text-sm font-semibold text-[var(--text-1)]">
            Kişi
          </label>

          {selected ? (
            <div className="flex items-center justify-between rounded-xl border border-[#0F6E56] bg-[var(--bg-card)] px-4 py-3 ring-2 ring-[#E1F5EE]">
              <div>
                <p className="text-sm font-semibold text-[var(--text-1)]">{selected.full_name}</p>
                <p className="text-xs text-[var(--text-3)]">{STAGE_LABEL[selected.stage]}</p>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-3)] transition hover:text-[var(--text-1)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                setDropdownOpen(true)
              }}
              onFocus={() => { if (query) setDropdownOpen(true) }}
              placeholder="Kişi adını yaz..."
              autoComplete="off"
              className={inputClass}
            />
          )}

          {dropdownOpen && !selected && query.length > 0 && (
            <div
              className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xl"
              style={{ maxHeight: '240px', overflowY: 'auto' }}
            >
              {filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--text-3)]">Kişi bulunamadı</p>
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
          )}
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
            maxLength={1000}
            defaultValue={initialNote}
            placeholder="Geçen hafta konuştuk, ürünü merak ediyordu..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {state.error && (
          <p className="rounded-xl bg-[#FBEAF0] px-4 py-2.5 text-sm text-[#72243E]">{state.error}</p>
        )}

        {limitReached ? (
          <div className="rounded-xl bg-[#FBEAF0] px-4 py-3 text-sm text-[#72243E]">
            Günlük {DAILY_AI_LIMIT} mesaj limitine ulaştınız. Limit yarın gece yarısı sıfırlanır.
          </div>
        ) : (
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F6E56] py-3.5 text-sm font-semibold text-white transition hover:bg-[#0a5a44] disabled:opacity-60"
          >
            {isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Yazıyor...</>
              : <><Bot className="h-4 w-4" /> Üret {isSuperAdmin ? '(Sınırsız)' : `(${remaining} hak kaldı)`}</>
            }
          </button>
        )}
      </form>

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

      {/* Mesaj Geçmişi */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
          <button
            onClick={() => setHistoryOpen(v => !v)}
            className="flex w-full items-center justify-between px-4 py-3"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text-2)]">
              <Clock className="h-4 w-4" />
              Son Mesajlar ({history.length})
            </span>
            {historyOpen ? <ChevronUp className="h-4 w-4 text-[var(--text-3)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-3)]" />}
          </button>
          {historyOpen && (
            <ul className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
              {history.map((entry, i) => (
                <li key={i} className="p-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--text-1)]">{entry.candidateName}</span>
                      <span className="rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[10px] font-medium text-[#0F6E56]">
                        {MESSAGE_TYPES.find(t => t.value === entry.messageType)?.label ?? entry.messageType}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyHistory(entry.message)}
                      className="flex items-center gap-1 rounded-lg bg-[var(--bg-subtle)] px-2 py-1 text-[10px] font-semibold text-[var(--text-2)] transition hover:bg-[var(--border)]"
                    >
                      <Copy className="h-2.5 w-2.5" />
                      Kopyala
                    </button>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-[var(--text-3)]">{entry.message}</p>
                  <p className="mt-1 text-[10px] text-[var(--text-3)]">
                    {new Date(entry.timestamp).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
