'use client'

import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { getStageLabel, STAGE_COLOR, FOLLOW_DAYS } from '@/lib/stages'
import type { NmmCandidate, CandidateStage } from '@/types/database.types'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/providers/LanguageProvider'

function followUpDate(c: NmmCandidate): Date | null {
  // Önce manuel atanmış tarihi kullan
  if (c.next_follow_up_at) {
    const d = new Date(c.next_follow_up_at)
    d.setHours(12, 0, 0, 0)
    return d
  }
  // Yoksa aşama bazlı formülle hesapla
  const days = FOLLOW_DAYS[c.stage]
  if (!days) return null
  const base = new Date(c.last_contact_at ?? c.created_at)
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  d.setHours(12, 0, 0, 0)
  return d
}

function toKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                 'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const MONTHS_EN = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December']
const DAYS_TR   = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']
const DAYS_EN   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']


export function TakvimClient() {
  const router = useRouter()
  const { data: ws } = useWorkspace()
  const { candidates = [] } = useCandidates(ws?.workspaceId)

  const [mounted, setMounted] = useState(false)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    return d
  }, [])

  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0))
  const [selected, setSelected] = useState<string>(toKey(today))

  useEffect(() => {
    setMounted(true)
  }, [])

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
    const firstDay = new Date(year, month, 1, 12, 0, 0)
    const lastDay = new Date(year, month + 1, 0, 12, 0, 0)
    // Pazartesi = 0 başlangıç (JS: 0=Pazar → dönüştür)
    const pad = (firstDay.getDay() + 6) % 7
    const total = lastDay.getDate()
    return { days: total, startPad: pad }
  }, [view])

  function prevMonth() { setView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1, 12, 0, 0)) }
  function nextMonth() { setView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1, 12, 0, 0)) }

  if (!mounted) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#534AB7] border-t-transparent" />
      </div>
    )
  }

  const { lang } = useTranslation()
  const selectedCandidates = byDate[selected] ?? []

  return (
    <div className="space-y-5">
      {/* Ay navigasyonu */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-subtle)] text-[var(--text-2)] transition hover:text-[var(--text-1)]">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-[var(--text-1)]">
          {(lang === 'en' ? MONTHS_EN : MONTHS_TR)[view.getMonth()]} {view.getFullYear()}
        </span>
        <button onClick={nextMonth} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-subtle)] text-[var(--text-2)] transition hover:text-[var(--text-1)]">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Grid */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
        {/* Gün başlıkları */}
        <div className="mb-1 grid grid-cols-7">
          {(lang === 'en' ? DAYS_EN : DAYS_TR).map(d => (
            <div key={d} className="py-1 text-center text-[10px] font-semibold text-[var(--text-3)]">{d}</div>
          ))}
        </div>

        {/* Günler */}
        <div className="grid grid-cols-7 gap-y-1">
          {/* Boş hücreler */}
          {Array.from({ length: startPad }).map((_, i) => <div key={`e${i}`} />)}

          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1
            const date = new Date(view.getFullYear(), view.getMonth(), day, 12, 0, 0)
            const key = toKey(date)
            const isToday = key === toKey(today)
            const isSelected = key === selected
            const hasDot = !!byDate[key]
            const isPast = date < today && !isToday
            const isOverdue = isPast && hasDot

            return (
              <button
                key={day}
                onClick={() => setSelected(key)}
                className={`relative flex flex-col items-center justify-center rounded-xl py-2 text-sm font-medium transition-colors
                  ${isSelected ? 'bg-[#534AB7] text-white' :
                    isToday ? 'bg-[#EEEDFE] text-[#534AB7]' :
                    isOverdue ? 'text-[#72243E]' :
                    'text-[var(--text-1)] hover:bg-[var(--bg-subtle)]'}
                  ${isPast && !isOverdue ? 'opacity-40' : ''}`}
              >
                {day}
                {hasDot && (
                  <span className={`mt-0.5 h-1 w-1 rounded-full ${
                    isSelected ? 'bg-white' :
                    isOverdue ? 'bg-[#72243E]' :
                    'bg-[#534AB7]'
                  }`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Seçilen güne ait adaylar */}
      <div>
        <p className="mb-3 text-sm font-semibold text-[var(--text-1)]">
          {selected === toKey(today) ? (lang === 'en' ? 'Today' : 'Bugün') : selected.split('-').reverse().join('.')} — {lang === 'en' ? 'Follow-up List' : 'Takip Listesi'}
        </p>

        {selected < toKey(today) && selectedCandidates.length > 0 && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-[#FBEAF0] px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-[#72243E]" />
            <p className="text-xs font-semibold text-[#72243E]">
              {lang === 'en' ? `${selectedCandidates.length} follow-ups missed — act now` : `${selectedCandidates.length} takip kaçırıldı — hemen ilgilen`}
            </p>
          </div>
        )}
        {selectedCandidates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] py-10 text-center">
            <p className="text-2xl mb-1">✅</p>
            <p className="text-sm font-semibold text-[var(--text-1)]">
              {lang === 'en' ? 'No follow-ups for this day' : 'Bu gün için takip yok'}
            </p>
            <p className="mt-1 text-xs text-[var(--text-2)]">
              {lang === 'en' ? 'Check another day' : 'Başka bir güne bak'}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {selectedCandidates.map(c => (
              <li
                key={c.id}
                onClick={() => router.push(`/pipeline/${c.id}`)}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition hover:border-[#534AB7]/30 hover:shadow-sm active:scale-[0.99]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-sm font-bold text-[#534AB7]">
                  {c.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-1)]">{c.full_name}</p>
                  {c.phone && <p className="text-xs text-[var(--text-2)]">{c.phone}</p>}
                </div>
                {c.stage && STAGE_COLOR[c.stage] && (
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${STAGE_COLOR[c.stage]}`}>
                    {getStageLabel(c.stage, lang)}
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
            <p className="mb-3 text-sm font-semibold text-[var(--text-1)]">
              {lang === 'en' ? 'Next 7 days' : 'Önümüzdeki 7 gün'}
            </p>
            <ul className="space-y-1.5">
              {next7.map(k => (
                <button key={k} onClick={() => setSelected(k)}
                  className="flex w-full items-center justify-between rounded-xl bg-[var(--bg-subtle)] px-4 py-3 text-left transition hover:bg-[var(--border)]">
                  <span className="text-sm text-[var(--text-1)]">{k.split('-').reverse().join('.')}</span>
                  <span className="rounded-full bg-[#EEEDFE] px-2.5 py-0.5 text-xs font-semibold text-[#534AB7]">
                    {byDate[k].length} {lang === 'en' ? (byDate[k].length === 1 ? 'prospect' : 'prospects') : 'aday'}
                  </span>
                </button>
              ))}
            </ul>
          </div>
        )
      })()}

      {/* Yaklaşan takipler özeti: Önümüzdeki Ay */}
      {(() => {
        const nextMonthDate = new Date(view.getFullYear(), view.getMonth() + 1, 1, 12, 0, 0)
        const nmYear = nextMonthDate.getFullYear()
        const nmMonth = nextMonthDate.getMonth()
        const daysInNm = new Date(nmYear, nmMonth + 1, 0).getDate()
        
        const nextMonthKeys = Array.from({ length: daysInNm }, (_, i) => {
          const d = new Date(nmYear, nmMonth, i + 1, 12, 0, 0)
          return toKey(d)
        }).filter(k => byDate[k])

        if (!nextMonthKeys.length) return null

        return (
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <p className="mb-3 text-sm font-semibold text-[var(--text-1)]">
              {lang === 'en' ? 'Next Month' : 'Önümüzdeki Ay'} ({(lang === 'en' ? MONTHS_EN : MONTHS_TR)[nmMonth]} {nmYear})
            </p>
            <ul className="space-y-1.5">
              {nextMonthKeys.map(k => (
                <button key={k} onClick={() => {
                  setView(new Date(nmYear, nmMonth, 1))
                  setSelected(k)
                }}
                  className="flex w-full items-center justify-between rounded-xl bg-[var(--bg-subtle)] px-4 py-3 text-left transition hover:bg-[var(--border)]">
                  <span className="text-sm text-[var(--text-1)]">{k.split('-').reverse().join('.')}</span>
                  <span className="rounded-full bg-[#EEEDFE] px-2.5 py-0.5 text-xs font-semibold text-[#534AB7]">
                    {byDate[k].length} {lang === 'en' ? (byDate[k].length === 1 ? 'prospect' : 'prospects') : 'aday'}
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

