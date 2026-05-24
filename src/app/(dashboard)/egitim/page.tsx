'use client'

import { useState, useEffect, Suspense } from 'react'
import { BookOpen, ChevronDown, Clock, Star, CheckCircle2, Circle, Copy, Check, MessageSquare } from 'lucide-react'
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
  const [copiedId, setCopiedId] = useState<string | null>(null)

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
                            {/* Paylaşım butonları */}
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              {/* Kopyala */}
                              <button
                                onClick={async e => {
                                  e.stopPropagation()
                                  const text = konu.maddeler.join('\n')
                                  try {
                                    await navigator.clipboard.writeText(text)
                                    setCopiedId(konu.id)
                                    setTimeout(() => setCopiedId(null), 2000)
                                  } catch {}
                                }}
                                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                                  copiedId === konu.id
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30'
                                    : 'bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[#EEF2FF] hover:text-[#3730A3]'
                                }`}
                              >
                                {copiedId === konu.id
                                  ? <><Check className="h-3 w-3" /> {lang === 'en' ? 'Copied!' : 'Kopyalandı!'}</>
                                  : <><Copy className="h-3 w-3" /> {lang === 'en' ? 'Copy' : 'Kopyala'}</>
                                }
                              </button>
                              {/* SMS İle Gönder */}
                              <a
                                href={`sms:?body=${encodeURIComponent(konu.maddeler.join('\n'))}`}
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 transition-all hover:bg-sky-100"
                              >
                                <MessageSquare className="h-3 w-3" />
                                {lang === 'en' ? 'Send via SMS' : 'SMS İle Gönder'}
                              </a>
                              {/* WhatsApp İle Gönder */}
                              <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(konu.maddeler.join('\n'))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1.5 rounded-xl bg-[#E7FBF0] dark:bg-[#0d2e1a]/50 px-3 py-1.5 text-xs font-semibold text-[#1a9e4f] dark:text-[#4ade80] transition-all hover:bg-[#d4f7e4]"
                              >
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.118 1.523 5.845L0 24l6.335-1.508A11.927 11.927 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.807 9.807 0 01-5.031-1.386l-.361-.214-3.761.896.953-3.651-.235-.374A9.778 9.778 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                                </svg>
                                {lang === 'en' ? 'Send via WhatsApp' : 'WhatsApp İle Gönder'}
                              </a>
                            </div>
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

