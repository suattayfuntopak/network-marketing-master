'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import type { NmmCandidate, CandidateStage } from '@/types/database.types'

// Aşamaya göre kaç günde bir takip yapılmalı
const FOLLOW_DAYS: Partial<Record<CandidateStage, number>> = {
  yeni:     2,
  iletisim: 3,
  takip:    3,
  sunum:    1,
  kararsiz: 7,
}

function followUpDate(c: NmmCandidate): Date | null {
  const days = FOLLOW_DAYS[c.stage]
  if (!days) return null
  const base = new Date(c.last_contact_at ?? c.created_at)
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  d.setHours(0, 0, 0, 0)
  return d
}

function toKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                 'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const DAYS   = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']

const STAGE_LABEL: Partial<Record<CandidateStage, string>> = {
  yeni:     'Yeni Aday',
  iletisim: 'İletişim',
  takip:    'Takip',
  sunum:    'Sunum',
  kararsiz: 'Kararsız',
}

const STAGE_COLOR: Partial<Record<CandidateStage, string>> = {
  yeni:     'bg-[#E8F0FE] text-[#1A56DB]',
  iletisim: 'bg-[#EEEDFE] text-[#534AB7]',
  takip:    'bg-[#FAEEDA] text-[#854F0B]',
  sunum:    'bg-[#E1F5EE] text-[#0F6E56]',
  kararsiz: 'bg-[#FBEAF0] text-[#72243E]',
}

export function TakvimClient() {
  const { data: ws } = useWorkspace()
  const { candidates } = useCandidates(ws?.workspaceId)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState<string>(toKey(today))

  // Her aday için takip tarihi hesapla → tarihe göre gruplama
  const byDate = useMemo(() => {
    const map: Record<string, NmmCandidate[]> = {}
    for (const c of candidates) {
      const d = followUpDate(c)
      if (!d) continue
      const k = toKey(d)
      ;(map[k] ??= []).push(c)
    }
    return map
  }, [candidates])

  // Takvim grid'i için günler
  const { days, startPad } = useMemo(() => {
    const year = view.getFullYear()
    const month = view.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    // Pazartesi = 0 başlangıç (JS: 0=Pazar → dönüştür)
    const pad = (firstDay.getDay() + 6) % 7
    const total = lastDay.getDate()
    return { days: total, startPad: pad }
  }, [view])

  function prevMonth() { setView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1)) }
  function nextMonth() { setView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1)) }

  const selectedCandidates = byDate[selected] ?? []

  return (
    <div className="space-y-5">
      {/* Ay navigasyonu */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-subtle)] text-[var(--text-2)] transition hover:text-[var(--text-1)]">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-[var(--text-1)]">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </span>
        <button onClick={nextMonth} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-subtle)] text-[var(--text-2)] transition hover:text-[var(--text-1)]">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Grid */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
        {/* Gün başlıkları */}
        <div className="mb-1 grid grid-cols-7">
          {DAYS.map(d => (
            <div key={d} className="py-1 text-center text-[10px] font-semibold text-[var(--text-3)]">{d}</div>
          ))}
        </div>

        {/* Günler */}
        <div className="grid grid-cols-7 gap-y-1">
          {/* Boş hücreler */}
          {Array.from({ length: startPad }).map((_, i) => <div key={`e${i}`} />)}

          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1
            const date = new Date(view.getFullYear(), view.getMonth(), day)
            const key = toKey(date)
            const isToday = key === toKey(today)
            const isSelected = key === selected
            const hasDot = !!byDate[key]
            const isPast = date < today && !isToday

            return (
              <button
                key={day}
                onClick={() => setSelected(key)}
                className={`relative flex flex-col items-center justify-center rounded-xl py-2 text-sm font-medium transition-colors
                  ${isSelected ? 'bg-[#534AB7] text-white' :
                    isToday ? 'bg-[#EEEDFE] text-[#534AB7]' :
                    'text-[var(--text-1)] hover:bg-[var(--bg-subtle)]'}
                  ${isPast ? 'opacity-40' : ''}`}
              >
                {day}
                {hasDot && (
                  <span className={`mt-0.5 h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#534AB7]'}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Seçilen güne ait adaylar */}
      <div>
        <p className="mb-3 text-sm font-semibold text-[var(--text-1)]">
          {selected === toKey(today) ? 'Bugün' : selected.split('-').reverse().join('.')} — Takip Listesi
        </p>

        {selectedCandidates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] py-10 text-center">
            <p className="text-2xl mb-1">✅</p>
            <p className="text-sm font-semibold text-[var(--text-1)]">Bu gün için takip yok</p>
            <p className="mt-1 text-xs text-[var(--text-2)]">Başka bir güne bak</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {selectedCandidates.map(c => (
              <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-sm font-bold text-[#534AB7]">
                  {c.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-1)]">{c.full_name}</p>
                  {c.phone && <p className="text-xs text-[var(--text-2)]">{c.phone}</p>}
                </div>
                {c.stage && STAGE_COLOR[c.stage] && (
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${STAGE_COLOR[c.stage]}`}>
                    {STAGE_LABEL[c.stage]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Yaklaşan takipler özeti */}
      {(() => {
        const next7 = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today)
          d.setDate(d.getDate() + i + 1)
          return toKey(d)
        }).filter(k => byDate[k])
        if (!next7.length) return null
        return (
          <div>
            <p className="mb-3 text-sm font-semibold text-[var(--text-1)]">Önümüzdeki 7 gün</p>
            <ul className="space-y-1.5">
              {next7.map(k => (
                <button key={k} onClick={() => setSelected(k)}
                  className="flex w-full items-center justify-between rounded-xl bg-[var(--bg-subtle)] px-4 py-3 text-left transition hover:bg-[var(--border)]">
                  <span className="text-sm text-[var(--text-1)]">{k.split('-').reverse().join('.')}</span>
                  <span className="rounded-full bg-[#EEEDFE] px-2.5 py-0.5 text-xs font-semibold text-[#534AB7]">
                    {byDate[k].length} aday
                  </span>
                </button>
              ))}
            </ul>
          </div>
        )
      })()}
    </div>
  )
}
