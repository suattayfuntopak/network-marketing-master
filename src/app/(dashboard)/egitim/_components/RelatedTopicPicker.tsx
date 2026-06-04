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

/** İçerik (training) + itiraz başlıklarını tek listede toplar (deep link → Akademi sekmeleri). */
export function getRelatedTopicOptions(lang: 'tr' | 'en'): TopicOption[] {
  const out: TopicOption[] = []
  for (const cat of getTrainingData(lang)) {
    for (const konu of cat.konular) {
      out.push({
        value: konu.id,
        label: konu.baslik,
        emoji: konu.emoji,
        group: `${lang === 'en' ? 'Content' : 'İçerik'} · ${cat.baslik}`,
        kind: 'content',
      })
    }
  }
  for (const it of ITIRAZLAR) {
    out.push({
      value: String(it.id),
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

function groupLabel(group: string): string {
  const parts = group.split(' · ')
  return parts.length > 1 ? parts.slice(1).join(' · ') : group
}

type Tab = 'content' | 'objection'

export function RelatedTopicPicker({
  current,
  onSelect,
  onClose,
}: {
  current: string | null
  onSelect: (value: string | null) => void
  onClose: () => void
}) {
  const { lang, t } = useTranslation()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<Tab>('content')
  const [draft, setDraft] = useState<string | null>(current)
  const options = useMemo(() => getRelatedTopicOptions(lang), [lang])

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase()
    const filtered = options.filter(o => {
      if (o.kind !== tab) return false
      if (!s) return true
      return o.label.toLowerCase().includes(s) || o.group.toLowerCase().includes(s)
    })
    const map = new Map<string, TopicOption[]>()
    for (const o of filtered) {
      const key = groupLabel(o.group)
      const arr = map.get(key) ?? []
      arr.push(o)
      map.set(key, arr)
    }
    return [...map.entries()]
  }, [options, q, tab])

  function handlePick(value: string) {
    setDraft(prev => (prev === value ? null : value))
  }

  function handleConfirm() {
    onSelect(draft)
    onClose()
  }

  const tabBtn = (id: Tab, label: string, Icon: typeof BookOpen) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
        tab === id
          ? 'bg-[var(--bg-subtle)] text-[var(--text-1)] border border-[var(--border)] shadow-sm'
          : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )

  return (
    <div
      className={`fixed inset-0 ${Z.fullscreen} flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm p-0 sm:p-4`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] sm:max-h-[85vh] w-full sm:max-w-2xl md:max-w-3xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
          <h3 className="text-base font-bold text-[var(--text-1)] sm:text-lg">
            {t('videoTraining.pickRelatedTopic')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-[var(--border)] px-4 py-2.5">
          {tabBtn('content', t('videoTraining.contentsTab'), BookOpen)}
          {tabBtn('objection', t('videoTraining.objectionsTab'), MessageCircleQuestion)}
        </div>

        <div className="border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              autoFocus
              placeholder={t('videoTraining.searchTopics')}
              className="w-full bg-transparent py-2.5 text-sm text-[var(--text-1)] outline-none"
            />
          </div>
        </div>

        <div className="min-h-[240px] flex-1 overflow-y-auto px-4 py-3 space-y-4 sm:min-h-[320px]">
          {groups.length === 0 && (
            <p className="py-12 text-center text-sm text-[var(--text-3)]">
              {t('videoTraining.noTopicMatch')}
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
              <ul className="grid gap-1 sm:grid-cols-2">
                {items.map(o => {
                  const active = draft === o.value
                  return (
                    <li key={`${o.kind}_${o.value}`}>
                      <button
                        type="button"
                        onClick={() => handlePick(o.value)}
                        className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                          active
                            ? 'border-[#3730A3]/40 bg-[#3730A3]/10 text-[var(--text-1)] dark:border-[#a5b4fc]/40 dark:bg-[#a5b4fc]/10'
                            : 'border-transparent hover:bg-[var(--bg-subtle)] text-[var(--text-2)]'
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            active
                              ? 'border-[var(--text-1)] bg-[var(--text-1)] text-[var(--bg-card)]'
                              : 'border-[var(--border)]'
                          }`}
                        >
                          {active && <Check className="h-3 w-3" />}
                        </span>
                        <span className="shrink-0 text-base">{o.emoji}</span>
                        <span className="line-clamp-2 leading-snug">{o.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--border)] px-4 py-2.5 sm:px-5">
          <p className="text-sm text-[var(--text-2)]">
            {draft
              ? t('videoTraining.selectedTopic', {
                  label: resolveTopicLabel(draft, lang) ?? draft,
                })
              : t('videoTraining.noTopicSelected')}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--bg-subtle)]/50 px-4 py-3.5 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-semibold text-[var(--text-2)] hover:bg-[var(--bg-subtle)] transition"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-gradient-to-r from-[#3730A3] to-[#534AB7] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-95 transition"
          >
            {t('videoTraining.confirmPick')}
          </button>
        </div>
      </div>
    </div>
  )
}
