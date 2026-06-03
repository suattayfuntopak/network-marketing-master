'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { BookOpen, Search, X, Plus, Star, CheckCircle2, Film } from 'lucide-react'
import { getTrainingData } from '@/lib/domain/trainingData'
import { useTranslation } from '@/providers/LanguageProvider'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useProgressSync } from '@/hooks/useProgressSync'
import { useWorkspace } from '@/hooks/useWorkspace'
import { loadCustomContent, addCustomContent, deleteCustomContent } from '@/lib/domain/customContent'
import { PAGE_SIZE } from '../constants'
import type { TrainingTopic } from '../types'
import { TrainingCard } from './TrainingCard'
import { AddTrainingModal } from './AddTrainingModal'

export function EgitimContent() {
  const { lang, t } = useTranslation()
  const searchParams = useSearchParams()
  const { data: ws } = useWorkspace()

  const [search, setSearch] = useState('')
  const [aktifKategori, setAktifKategori] = useState(0)
  const [page, setPage] = useState(1)
  const [acikId, setAcikId] = useState<string | null>(null)

  const {
    readTrainings: read,
    favTrainings: favs,
    toggleTrainingRead,
    toggleTrainingFav,
  } = useProgressSync()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [customTrainings, setCustomTrainings] = useState<TrainingTopic[]>([])
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadCustomContent('nmm_custom_trainings', 'nmm_custom_training_v1', ws?.workspaceId ?? null)
      .then(items => {
        if (!cancelled) {
          const approved = items.filter(it => (it as any).isApproved)
          setCustomTrainings(approved as unknown as TrainingTopic[])
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [ws?.workspaceId])

  const KATEGORILER_DATA = getTrainingData(lang)

  const ALL_TOPICS = useMemo(() => {
    const list: TrainingTopic[] = []

    KATEGORILER_DATA.forEach(cat => {
      cat.konular.forEach(konu => {
        list.push({
          ...konu,
          kategoriId: cat.id,
          kategoriBaslik: cat.baslik,
          kategoriRenk: cat.renk,
        })
      })
    })
    return list
  }, [KATEGORILER_DATA])

  const allTopicsMerged = useMemo(() => {
    return [...ALL_TOPICS, ...customTrainings]
  }, [ALL_TOPICS, customTrainings])

  const KATEGORILER = useMemo(() => {
    const base = lang === 'en'
      ? ['All', 'Favorites']
      : ['Tümü', 'Favoriler']
    const unique = Array.from(new Set(allTopicsMerged.map(c => c.kategoriBaslik)))
    return [...base, ...unique]
  }, [lang, allTopicsMerged])

  const filtrelenmis = useMemo(() => {
    const activeLabel = KATEGORILER[aktifKategori]
    const isAll = activeLabel === 'Tümü' || activeLabel === 'All'
    const isFavFilter = activeLabel === 'Favoriler' || activeLabel === 'Favorites'
    const q = search.trim().toLowerCase()

    return allTopicsMerged.filter(konu => {
      if (isFavFilter) return favs.has(konu.id)
      const matchesCategory = isAll || konu.kategoriBaslik === activeLabel
      if (!matchesCategory) return false

      if (!q) return true
      const baslikMatch = konu.baslik.toLowerCase().includes(q)
      const ozetMatch = konu.ozet.toLowerCase().includes(q)
      const maddelerMatch = konu.maddeler.some(m => m.toLowerCase().includes(q))
      return baslikMatch || ozetMatch || maddelerMatch
    })
  }, [search, aktifKategori, favs, allTopicsMerged, KATEGORILER])

  function handleAddTraining(topic: TrainingTopic) {
    const updated = [topic, ...customTrainings]
    setCustomTrainings(updated)
    addCustomContent('nmm_custom_trainings', ws?.workspaceId ?? null, topic as unknown as Record<string, unknown> & { id: string | number }).catch(() => {})
  }

  useEffect(() => {
    const topicId = searchParams.get('id')
    if (topicId) {
      const idx = filtrelenmis.findIndex(item => item.id === topicId)
      if (idx !== -1) {
        const targetPage = Math.floor(idx / PAGE_SIZE) + 1
        setPage(targetPage)
        setAcikId(topicId)
        setTimeout(() => {
          const el = document.getElementById(`konu-${topicId}`)
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 300)
      }
    }
  }, [searchParams, filtrelenmis])

  useEffect(() => {
    setPage(1)
    setAcikId(null)
  }, [aktifKategori])

  useEffect(() => {
    setPage(1)
    setAcikId(null)
  }, [search])

  const totalPages = Math.ceil(filtrelenmis.length / PAGE_SIZE)
  const pageItems = filtrelenmis.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const favCount = favs.size
  const readCount = read.size
  const isFavoritesEmpty = (KATEGORILER[aktifKategori] === 'Favoriler' || KATEGORILER[aktifKategori] === 'Favorites') && favCount === 0

  function toggle(id: string) {
    setAcikId(prev => (prev === id ? null : id))
  }

  function toggleRead(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    toggleTrainingRead(id)
  }

  function toggleFav(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    toggleTrainingFav(id)
  }

  async function copyKonu(maddeler: string[], id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const text = maddeler.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {}
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#1e1b4b]">
              <BookOpen className="h-5 w-5 text-[#3730A3] dark:text-[#a5b4fc]" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-1)]">{t('training.title')}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/egitim/videolar"
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm font-bold text-brand-readable hover:border-brand/40 dark:hover:border-[var(--border)] transition"
            >
              <Film className="h-3.5 w-3.5 text-brand-readable" />
              <span className="hidden sm:inline">{t('videoTraining.openTraining')}</span>
            </Link>
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#3730A3] hover:bg-[#28227d] text-white px-3.5 py-2 text-sm font-bold shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('trainingPage.addContent')}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-[#E0E7FF] dark:border-[#312e81]/40 bg-[#EEF2FF] dark:bg-[#1e1b4b]/70 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-3xl">📖</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-relaxed text-[#3730A3] dark:text-[#a5b4fc]">
              {t('training.subtitle')}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {favCount > 0 && (
              <span className="rounded-full bg-[#3730A3] px-2 py-0.5 text-[9px] font-bold text-white dark:bg-[#a5b4fc] dark:text-[#1e1b4b]">
                {favCount} {t('trainingPage.fav')}
              </span>
            )}
            {readCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white dark:bg-emerald-500">
                <CheckCircle2 className="h-2.5 w-2.5" />
                {readCount}/{allTopicsMerged.length}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mb-4 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-3)] pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('trainingPage.searchPlaceholder')}
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-3 pl-10 pr-10 text-base text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-3)] hover:text-[var(--text-1)] transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide no-swipe" data-no-swipe="true">
        {KATEGORILER.map((k, idx) => (
          <button
            key={k}
            onClick={() => setAktifKategori(idx)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all flex items-center gap-1.5 ${
              aktifKategori === idx
                ? 'bg-[#3730A3] text-white dark:bg-[#a5b4fc] dark:text-[#1e1b4b]'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-2)] hover:border-[#3730A3] dark:hover:border-[#a5b4fc]'
            }`}
          >
            {(k === 'Favoriler' || k === 'Favorites') && <Star className="h-3 w-3" />}
            {k}
            {(k === 'Favoriler' || k === 'Favorites') && favCount > 0 && (
              <span className={`rounded-full px-1.5 text-[9px] font-bold ${aktifKategori === idx ? 'bg-white/20' : 'bg-[#3730A3]/10 text-[#3730A3] dark:text-[#a5b4fc]'}`}>
                {favCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {search && (
        <p className="mb-3 text-sm text-[var(--text-3)]">
          {filtrelenmis.length} {t('trainingPage.topicsFound')}
        </p>
      )}

      {isFavoritesEmpty && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
          <p className="mb-2 text-4xl">⭐</p>
          <p className="text-base font-semibold text-[var(--text-1)]">
            {t('trainingPage.noFavorites')}
          </p>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            {t('trainingPage.noFavoritesDesc')}
          </p>
        </div>
      )}

      {!isFavoritesEmpty && filtrelenmis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
          <p className="mb-2 text-4xl">🔍</p>
          <p className="text-base font-semibold text-[var(--text-1)]">
            {t('trainingPage.noMatchingTopics')}
          </p>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            {t('trainingPage.tryDifferentKeywords')}
          </p>
        </div>
      ) : !isFavoritesEmpty && (
        <>
          <ul className="space-y-3">
            {pageItems.map(konu => (
              <TrainingCard
                key={konu.id}
                konu={konu}
                acik={acikId === konu.id}
                isFav={favs.has(konu.id)}
                isRead={read.has(konu.id)}
                copied={copiedId === konu.id}
                onToggle={() => toggle(konu.id)}
                onToggleRead={e => toggleRead(konu.id, e)}
                onToggleFav={e => toggleFav(konu.id, e)}
                onCopy={e => copyKonu(konu.maddeler, konu.id, e)}
                onDelete={
                  konu.isCustom
                    ? () => {
                        if (confirm(t('trainingPage.confirmDelete'))) {
                          const updated = customTrainings.filter(item => item.id !== konu.id)
                          setCustomTrainings(updated)
                          deleteCustomContent('nmm_custom_trainings', konu.id).catch(() => {})
                          toast.success(t('trainingPage.contentDeleted'))
                        }
                      }
                    : undefined
                }
              />
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => { setPage(p); setAcikId(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className={`h-9 w-9 rounded-xl text-base font-semibold transition-all ${
                    page === p
                      ? 'bg-[#3730A3] text-white dark:bg-[#a5b4fc] dark:text-[#1e1b4b]'
                      : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-2)] hover:border-[#3730A3] dark:hover:border-[#a5b4fc]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <AddTrainingModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onAdd={handleAddTraining}
      />
    </main>
  )
}
