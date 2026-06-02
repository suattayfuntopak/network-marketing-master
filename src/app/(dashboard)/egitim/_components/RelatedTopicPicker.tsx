'use client'

import { useMemo, useState } from 'react'
import { X, Search, Check, BookOpen, MessageCircleQuestion } from 'lucide-react'
import { Z } from '@/lib/ui/zIndex'
import { useTranslation } from '@/providers/LanguageProvider'
import { getTrainingData } from '@/lib/domain/trainingData'
import { ITIRAZLAR } from '@/app/(dashboard)/itirazlar/data/itirazlar'

export type TopicOption = {
  value: string
  label: string
  emoji: string
  group: string
  kind: 'content' | 'objection'
}

/** İçerik (training) + itiraz başlıklarını tek listede toplar (id → /egitim veya /itirazlar). */
export function getRelatedTopicOptions(lang: 'tr' | 'en'): TopicOption[] {
  const out: TopicOption[] = []
  for (const cat of getTrainingData(lang)) {
    for (const konu of cat.konular) {
      out.push({
        value: konu.id, // harf önekli (z1, i1…) → /egitim?id=
        label: konu.baslik,
        emoji: konu.emoji,
        group: `${lang === 'en' ? 'Content' : 'İçerik'} · ${cat.baslik}`,
        kind: 'content',
      })
    }
  }
  for (const it of ITIRAZLAR) {
    out.push({
      value: String(it.id), // sayısal → /itirazlar?id=
      label: it.soru[lang],
      emoji: it.emoji,
      group: `${lang === 'en' ? 'Objection' : 'İtiraz'} · ${it.kategori[lang]}`,
      kind: 'objection',
    })
  }
  return out
}

/** Kayıtlı id'yi insan-okur başlığa çevirir (kart/alan gösterimi için). */
export function resolveTopicLabel(value: string | null | undefined, lang: 'tr' | 'en'): string | null {
  if (!value) return null
  return getRelatedTopicOptions(lang).find(o => o.value === value)?.label ?? value
}

export function RelatedTopicPicker({
  current,
  onSelect,
  onClose,
}: {
  current: string | null
  onSelect: (value: string) => void
  onClose: () => void
}) {
  const { lang } = useTranslation()
  const [q, setQ] = useState('')
  const options = useMemo(() => getRelatedTopicOptions(lang), [lang])

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase()
    const filtered = s
      ? options.filter(o => o.label.toLowerCase().includes(s) || o.group.toLowerCase().includes(s))
      : options
    const map = new Map<string, TopicOption[]>()
    for (const o of filtered) {
      const arr = map.get(o.group) ?? []
      arr.push(o)
      map.set(o.group, arr)
    }
    return [...map.entries()]
  }, [options, q])

  return (
    <div
      className={`fixed inset-0 ${Z.fullscreen} flex items-center justify-center bg-black/55 backdrop-blur-sm p-4`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h3 className="text-base font-bold text-[var(--text-1)]">
            {lang === 'en' ? 'Pick a related topic' : 'İlgili konuyu seç'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-[var(--border)] p-3">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3">
            <Search className="h-4 w-4 text-[var(--text-3)]" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              autoFocus
              placeholder={lang === 'en' ? 'Search content or objections…' : 'İçerik veya itiraz ara…'}
              className="w-full bg-transparent py-2.5 text-sm text-[var(--text-1)] outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {groups.length === 0 && (
            <p className="py-8 text-center text-sm text-[var(--text-3)]">
              {lang === 'en' ? 'No match.' : 'Eşleşme yok.'}
            </p>
          )}
          {groups.map(([group, items]) => (
            <div key={group} className="space-y-1.5">
              <p className="flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">
                {items[0].kind === 'content' ? (
                  <BookOpen className="h-3.5 w-3.5" />
                ) : (
                  <MessageCircleQuestion className="h-3.5 w-3.5" />
                )}
                {group}
              </p>
              <ul className="space-y-1">
                {items.map(o => {
                  const active = current === o.value
                  return (
                    <li key={`${o.kind}_${o.value}`}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(o.value)
                          onClose()
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition ${
                          active
                            ? 'border-[#534AB7] bg-[#534AB7]/10 text-[var(--text-1)]'
                            : 'border-transparent hover:bg-[var(--bg-subtle)] text-[var(--text-2)]'
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            active ? 'border-[#534AB7] bg-[#534AB7] text-white' : 'border-[var(--border)]'
                          }`}
                        >
                          {active && <Check className="h-3 w-3" />}
                        </span>
                        <span className="shrink-0">{o.emoji}</span>
                        <span className="line-clamp-1">{o.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
