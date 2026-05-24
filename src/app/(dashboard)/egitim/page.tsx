'use client'

import { useState, useEffect, Suspense } from 'react'
import { BookOpen, ChevronDown, Clock, Star, CheckCircle2, Circle } from 'lucide-react'
import { getTrainingData } from '@/lib/trainingData'
import { useTranslation } from '@/providers/LanguageProvider'
import { useSearchParams } from 'next/navigation'

const SEVIYE_RENK: Record<string, string> = {
  'Temel': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Orta': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'İleri': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  'Basic': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Medium': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Advanced': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

const READ_KEY = 'nmm_egitim_read'
const FAV_KEY = 'nmm_egitim_favori'

function loadRead(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(READ_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch { return new Set() }
}

function saveRead(read: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify(Array.from(read)))
}

function loadFavs(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(FAV_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch { return new Set() }
}

function saveFavs(favs: Set<string>) {
  localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(favs)))
}

function EgitimPageContent() {
  const { lang, t } = useTranslation()
  const searchParams = useSearchParams()
  const [acikKonu, setAcikKonu] = useState<string | null>(null)
  const [read, setRead] = useState<Set<string>>(new Set())
  const [favs, setFavs] = useState<Set<string>>(new Set())
  const [aktifTab, setAktifTab] = useState<'all' | 'favorites'>('all')

  const KATEGORILER = getTrainingData(lang)

  useEffect(() => {
    setRead(loadRead())
    setFavs(loadFavs())
    
    // Automatically open category/topic if passed in query param
    const topicId = searchParams.get('id')
    if (topicId) {
      setAcikKonu(topicId)
      // Scroll to element after a slight delay
      setTimeout(() => {
        const el = document.getElementById(`konu-${topicId}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [searchParams])

  function toggle(id: string) {
    setAcikKonu(prev => (prev === id ? null : id))
  }

  function toggleRead(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setRead(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      saveRead(next)
      return next
    })
  }

  function toggleFav(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setFavs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      saveFavs(next)
      return next
    })
  }

  const filteredCategories = KATEGORILER.map(cat => {
    const filteredKonular = cat.konular.filter(konu => {
      if (aktifTab === 'favorites') return favs.has(konu.id)
      return true
    })
    return { ...cat, konular: filteredKonular }
  }).filter(cat => cat.konular.length > 0)

  const toplamKonu = KATEGORILER.reduce((s, k) => s + k.konular.length, 0)
  const okunanKonu = read.size
  const isFavoritesEmpty = aktifTab === 'favorites' && filteredCategories.length === 0

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      {/* Başlık */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#1e1b4b]">
            <BookOpen className="h-5 w-5 text-[#3730A3] dark:text-[#a5b4fc]" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-1)]">{t('training.title')}</h1>
            <p className="text-sm text-[var(--text-3)]">{t('training.subtitle')}</p>
          </div>
        </div>

        {/* Hero bilgi kutusu */}
        <div className="mt-4 rounded-2xl border border-[#E0E7FF] dark:border-[#312e81]/40 bg-[#EEF2FF] dark:bg-[#1e1b4b]/70 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-semibold text-[#3730A3] dark:text-[#a5b4fc] mb-1">
            {t('training.heroTitle')}
          </p>
          <p className="text-xs text-[#3730A3]/70 dark:text-[#a5b4fc]/70 leading-relaxed">
            {t('training.heroDesc')}
          </p>
          <div className="mt-3 flex gap-3">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#3730A3] dark:text-[#a5b4fc]" />
              <span className="text-[11px] font-medium text-[#3730A3] dark:text-[#a5b4fc]">
                {t('training.topicsCount', { count: toplamKonu })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-[#3730A3] dark:text-[#a5b4fc]" />
              <span className="text-[11px] font-medium text-[#3730A3] dark:text-[#a5b4fc]">
                {t('training.categoriesCount', { count: KATEGORILER.length })}
              </span>
            </div>
            {okunanKonu > 0 && (
              <div className="ml-auto flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  {t('training.readCount', { read: okunanKonu, total: toplamKonu })}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Kategori Tabları (Tümü | Favoriler) */}
      <div className="mb-6 flex gap-4 border-b border-[var(--border)] pb-px">
        <button
          onClick={() => setAktifTab('all')}
          className={`relative pb-3 text-sm font-semibold transition-colors ${
            aktifTab === 'all'
              ? 'text-[#3730A3] dark:text-[#a5b4fc]'
              : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
          }`}
        >
          {t('training.allContent')}
          {aktifTab === 'all' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3730A3] dark:bg-[#a5b4fc]" />
          )}
        </button>
        <button
          onClick={() => setAktifTab('favorites')}
          className={`relative pb-3 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
            aktifTab === 'favorites'
              ? 'text-[#3730A3] dark:text-[#a5b4fc]'
              : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
          }`}
        >
          <Star className={`h-4 w-4 ${aktifTab === 'favorites' ? 'fill-current text-amber-500' : ''}`} />
          {t('training.favorites')}
          {favs.size > 0 && (
            <span className="rounded-full bg-[#EEF2FF] dark:bg-[#1e1b4b] px-1.5 py-0.5 text-[10px] font-bold text-[#3730A3] dark:text-[#a5b4fc]">
              {favs.size}
            </span>
          )}
          {aktifTab === 'favorites' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3730A3] dark:bg-[#a5b4fc]" />
          )}
        </button>
      </div>

      {/* Kategoriler & Accordion */}
      {isFavoritesEmpty ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-12 text-center">
          <Star className="mx-auto h-8 w-8 text-[var(--text-3)] mb-3 opacity-60" />
          <h3 className="text-sm font-semibold text-[var(--text-1)] mb-1">
            {t('training.noFavorites')}
          </h3>
          <p className="text-xs text-[var(--text-3)] max-w-xs mx-auto leading-relaxed">
            {t('training.noFavoritesDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCategories.map(kategori => (
            <section key={kategori.id}>
              {/* Kategori başlığı */}
              <div className={`mb-3 flex items-center gap-2 rounded-2xl border px-4 py-3 ${kategori.renk}`}>
                <span className="text-xl leading-none">{kategori.emoji}</span>
                <div>
                  <h2 className="text-sm font-bold leading-tight">{kategori.baslik}</h2>
                  <p className="text-[11px] opacity-70">{t('training.topicsCount', { count: kategori.konular.length })}</p>
                </div>
              </div>

              {/* Konular listesi */}
              <ul className="space-y-2 pl-1">
                {kategori.konular.map(konu => {
                  const acik = acikKonu === konu.id
                  const okundu = read.has(konu.id)
                  const favori = favs.has(konu.id)
                  return (
                    <li key={konu.id}>
                      <div
                        className={`rounded-2xl border transition-all duration-200 ${
                          acik
                            ? 'border-[#3730A3]/20 dark:border-[#a5b4fc]/20 bg-[var(--bg-card)] shadow-md'
                            : 'border-[var(--border)] bg-[var(--bg-card)] hover:shadow-sm hover:border-[#3730A3]/20 dark:hover:border-[#a5b4fc]/20'
                        }`}
                      >
                        {/* Konu başlık satırı */}
                        <div
                          className="flex w-full items-center gap-3 p-3.5 text-left"
                        >
                          <button
                            onClick={() => toggle(konu.id)}
                            className="flex-1 min-w-0 flex items-center gap-3 text-left"
                          >
                            <span className={`text-lg leading-none shrink-0 transition-all ${okundu ? 'opacity-50' : ''}`}>{konu.emoji}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                <p className={`text-sm font-semibold leading-tight ${okundu ? 'text-[var(--text-3)] line-through' : 'text-[var(--text-1)]'}`}>{konu.baslik}</p>
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${SEVIYE_RENK[konu.seviye]}`}>
                                  {konu.seviye}
                                </span>
                                {okundu && (
                                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                                    {t('training.readMarker')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-[var(--text-3)]" />
                                <span className="text-[11px] text-[var(--text-3)]">{konu.sure}</span>
                                <span className="text-[var(--text-3)]">·</span>
                                <span className="text-[11px] text-[var(--text-3)] truncate block max-w-[200px] sm:max-w-none">{konu.ozet}</span>
                              </div>
                            </div>
                          </button>

                          {/* Favori Yıldızı */}
                          <button
                            onClick={e => toggleFav(konu.id, e)}
                            title={favori ? t('training.removeFromFavorites') : t('training.addToFavorites')}
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                              favori
                                ? 'text-amber-500 hover:text-amber-600'
                                : 'text-[var(--text-3)] hover:text-amber-500'
                            }`}
                          >
                            <Star className={`h-4.5 w-4.5 ${favori ? 'fill-current' : ''}`} />
                          </button>

                          {/* Okundu toggle */}
                          <button
                            onClick={e => toggleRead(konu.id, e)}
                            title={okundu ? t('training.markAsUnread') : t('training.markAsRead')}
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                              okundu
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-[var(--text-3)] hover:text-emerald-600 dark:hover:text-emerald-400'
                            }`}
                          >
                            {okundu
                              ? <CheckCircle2 className="h-5 w-5" />
                              : <Circle className="h-5 w-5" />
                            }
                          </button>
                          
                          <button
                            onClick={() => toggle(konu.id)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-[var(--bg-subtle)] text-[var(--text-3)]"
                          >
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${acik ? 'rotate-180' : ''}`}
                              strokeWidth={2}
                            />
                          </button>
                        </div>

                        {/* Açık içerik */}
                        {acik && (
                          <div className="border-t border-[#3730A3]/10 dark:border-[#a5b4fc]/10 px-4 pb-4 pt-3 animate-in fade-in duration-200">
                            <ul className="space-y-2.5">
                              {konu.maddeler.map((madde, idx) => (
                                <li key={idx} className="flex items-start gap-2.5">
                                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] dark:bg-[#1e1b4b] text-[9px] font-bold text-[#3730A3] dark:text-[#a5b4fc]">
                                    {idx + 1}
                                  </span>
                                  <p className="text-sm leading-relaxed text-[var(--text-2)]">{madde}</p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}

export default function EgitimPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--text-3)]">Loading training...</div>}>
      <EgitimPageContent />
    </Suspense>
  )
}

