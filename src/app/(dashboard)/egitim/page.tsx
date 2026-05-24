'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { BookOpen, ChevronDown, Clock, Star, CheckCircle2, Circle, Copy, Check, MessageSquare, Search, X } from 'lucide-react'
import { getTrainingData } from '@/lib/trainingData'
import { useTranslation } from '@/providers/LanguageProvider'
import { useSearchParams } from 'next/navigation'

const SEVIYE_RENK: Record<string, string> = {
  'Temel': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/20',
  'Orta': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/20',
  'İleri': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/20',
  'Basic': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/20',
  'Medium': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/20',
  'Advanced': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/20',
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

const PAGE_SIZE = 10

function EgitimPageContent() {
  const { lang, t } = useTranslation()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState('')
  const [aktifKategori, setAktifKategori] = useState(0)
  const [page, setPage] = useState(1)
  const [acikId, setAcikId] = useState<string | null>(null)
  
  const [read, setRead] = useState<Set<string>>(new Set())
  const [favs, setFavs] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const KATEGORILER_DATA = getTrainingData(lang)

  // Load state & query param
  useEffect(() => {
    setRead(loadRead())
    setFavs(loadFavs())
    
    const topicId = searchParams.get('id')
    if (topicId) {
      setAcikId(topicId)
      setTimeout(() => {
        const el = document.getElementById(`konu-${topicId}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [searchParams])

  // Category array (Tümü, Favoriler, and individual categories)
  const KATEGORILER = useMemo(() => {
    const base = lang === 'en'
      ? ['All', 'Favorites']
      : ['Tümü', 'Favoriler']
    const unique = KATEGORILER_DATA.map(c => c.baslik)
    return [...base, ...unique]
  }, [lang, KATEGORILER_DATA])

  // Flattened training topics
  const ALL_TOPICS = useMemo(() => {
    const list: {
      id: string
      baslik: string
      emoji: string
      sure: string
      seviye: string
      ozet: string
      maddeler: string[]
      kategoriId: string
      kategoriBaslik: string
      kategoriRenk: string
    }[] = []
    
    KATEGORILER_DATA.forEach(cat => {
      cat.konular.forEach(konu => {
        list.push({
          ...konu,
          kategoriId: cat.id,
          kategoriBaslik: cat.baslik,
          kategoriRenk: cat.renk
        })
      })
    })
    return list
  }, [KATEGORILER_DATA])

  // Filtered topics
  const filtrelenmis = useMemo(() => {
    const activeLabel = KATEGORILER[aktifKategori]
    const isAll = activeLabel === 'Tümü' || activeLabel === 'All'
    const isFavFilter = activeLabel === 'Favoriler' || activeLabel === 'Favorites'
    const q = search.trim().toLowerCase()

    return ALL_TOPICS.filter(konu => {
      if (isFavFilter) return favs.has(konu.id)
      const matchesCategory = isAll || konu.kategoriBaslik === activeLabel
      if (!matchesCategory) return false
      
      if (!q) return true
      const baslikMatch = konu.baslik.toLowerCase().includes(q)
      const ozetMatch = konu.ozet.toLowerCase().includes(q)
      const maddelerMatch = konu.maddeler.some(m => m.toLowerCase().includes(q))
      return baslikMatch || ozetMatch || maddelerMatch
    })
  }, [search, aktifKategori, favs, ALL_TOPICS, KATEGORILER])

  // Reset page when category changes
  useEffect(() => {
    setPage(1)
    setAcikId(null)
  }, [aktifKategori])

  // Reset page when search query changes
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
        <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-[#E0E7FF] dark:border-[#312e81]/40 bg-[#EEF2FF] dark:bg-[#1e1b4b]/70 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-2xl">📖</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#3730A3] dark:text-[#a5b4fc]">
              {t('training.heroTitle')}
            </p>
            <p className="text-[11px] text-[#3730A3]/70 dark:text-[#a5b4fc]/70 leading-relaxed truncate">
              {t('training.heroDesc')}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {favCount > 0 && (
              <span className="rounded-full bg-[#3730A3] px-2 py-0.5 text-[9px] font-bold text-white dark:bg-[#a5b4fc] dark:text-[#1e1b4b]">
                {favCount} {lang === 'en' ? 'fav' : 'favori'}
              </span>
            )}
            {readCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white dark:bg-emerald-500">
                <CheckCircle2 className="h-2.5 w-2.5" />
                {readCount}/{ALL_TOPICS.length}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Arama Barı */}
      <div className="mb-4 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-3)] pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={lang === 'en' ? 'Search training topics or content...' : 'Eğitim konusu veya içeriği ara...'}
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-3 pl-10 pr-10 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition-all"
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

      {/* Kategori Filtreleri */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {KATEGORILER.map((k, idx) => (
          <button
            key={k}
            onClick={() => setAktifKategori(idx)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
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

      {/* Sonuç Sayısı */}
      {search && (
        <p className="mb-3 text-xs text-[var(--text-3)]">
          {filtrelenmis.length} {lang === 'en' ? 'topics found' : 'konu bulundu'}
        </p>
      )}

      {/* Favoriler Boş Uyarısı */}
      {isFavoritesEmpty && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
          <p className="mb-2 text-3xl">⭐</p>
          <p className="text-sm font-semibold text-[var(--text-1)]">
            {lang === 'en' ? 'No favorites yet' : 'Henüz favori yok'}
          </p>
          <p className="mt-1 text-xs text-[var(--text-2)]">
            {lang === 'en' ? 'Tap ⭐ next to a topic to save it' : 'Eğitim konularının yanındaki ⭐ ile sabitleyebilirsin'}
          </p>
        </div>
      )}

      {/* Konu Listesi */}
      {!isFavoritesEmpty && filtrelenmis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
          <p className="mb-2 text-3xl">🔍</p>
          <p className="text-sm font-semibold text-[var(--text-1)]">
            {lang === 'en' ? 'No matching topics' : 'Eşleşen eğitim konusu bulunamadı'}
          </p>
          <p className="mt-1 text-xs text-[var(--text-2)]">
            {lang === 'en' ? 'Try different keywords' : 'Farklı kelimelerle arama yap'}
          </p>
        </div>
      ) : !isFavoritesEmpty && (
        <>
          <ul className="space-y-3">
            {pageItems.map(konu => {
              const acik = acikId === konu.id
              const isFav = favs.has(konu.id)
              const isRead = read.has(konu.id)
              const copied = copiedId === konu.id
              
              // Custom category specific styles
              const catTextColor = 
                konu.kategoriId === 'zihniyet' ? 'text-[#3730A3] dark:text-[#a5b4fc]' :
                konu.kategoriId === 'iletisim' ? 'text-[#0F6E56] dark:text-[#4ade80]' :
                konu.kategoriId === 'davet' ? 'text-[#0369A1] dark:text-[#38bdf8]' :
                konu.kategoriId === 'sunum' ? 'text-[#9A3412] dark:text-[#fb923c]' :
                konu.kategoriId === 'ekip' ? 'text-[#854F0B] dark:text-[#fbbf24]' :
                konu.kategoriId === 'strateji' ? 'text-[#72243E] dark:text-[#f9a8d4]' :
                konu.kategoriId === 'uyum' ? 'text-[#166534] dark:text-[#86efac]' :
                'text-[#6B21A8] dark:text-[#d8b4fe]'

              const catBorderColorHover = 
                konu.kategoriId === 'zihniyet' ? 'hover:border-[#3730A3]/30 dark:hover:border-[#a5b4fc]/30' :
                konu.kategoriId === 'iletisim' ? 'hover:border-[#0F6E56]/30 dark:hover:border-[#4ade80]/30' :
                konu.kategoriId === 'davet' ? 'hover:border-[#0369A1]/30 dark:hover:border-[#38bdf8]/30' :
                konu.kategoriId === 'sunum' ? 'hover:border-[#9A3412]/30 dark:hover:border-[#fb923c]/30' :
                konu.kategoriId === 'ekip' ? 'hover:border-[#854F0B]/30 dark:hover:border-[#fbbf24]/30' :
                konu.kategoriId === 'strateji' ? 'hover:border-[#72243E]/30 dark:hover:border-[#f9a8d4]/30' :
                konu.kategoriId === 'uyum' ? 'hover:border-[#166534]/30 dark:hover:border-[#86efac]/30' :
                'hover:border-[#6B21A8]/30 dark:hover:border-[#d8b4fe]/30'

              const catBorderColorActive = 
                konu.kategoriId === 'zihniyet' ? 'border-[#3730A3]/25 dark:border-[#a5b4fc]/25 shadow-[#3730A3]/5' :
                konu.kategoriId === 'iletisim' ? 'border-[#0F6E56]/25 dark:border-[#4ade80]/25 shadow-[#0F6E56]/5' :
                konu.kategoriId === 'davet' ? 'border-[#0369A1]/25 dark:border-[#38bdf8]/25 shadow-[#0369A1]/5' :
                konu.kategoriId === 'sunum' ? 'border-[#9A3412]/25 dark:border-[#fb923c]/25 shadow-[#9A3412]/5' :
                konu.kategoriId === 'ekip' ? 'border-[#854F0B]/25 dark:border-[#fbbf24]/25 shadow-[#854F0B]/5' :
                konu.kategoriId === 'strateji' ? 'border-[#72243E]/25 dark:border-[#f9a8d4]/25 shadow-[#72243E]/5' :
                konu.kategoriId === 'uyum' ? 'border-[#166534]/25 dark:border-[#86efac]/25 shadow-[#166534]/5' :
                'border-[#6B21A8]/25 dark:border-[#d8b4fe]/25 shadow-[#6B21A8]/5'

              return (
                <li key={konu.id} id={`konu-${konu.id}`}>
                  <div
                    className={`rounded-2xl border transition-all duration-200 ${
                      acik
                        ? `${catBorderColorActive} bg-[var(--bg-card)] shadow-md`
                        : `border-[var(--border)] bg-[var(--bg-card)] ${catBorderColorHover} hover:shadow-sm`
                    }`}
                  >
                    <button
                      onClick={() => toggle(konu.id)}
                      className="flex w-full items-center gap-3 p-4 text-left"
                    >
                      <span className={`shrink-0 text-xl leading-none transition-opacity ${isRead ? 'opacity-40' : ''}`}>
                        {konu.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${catTextColor}`}>
                            {konu.kategoriBaslik}
                          </p>
                          <span className={`rounded-full px-2 py-0.2 text-[8px] font-black uppercase tracking-wider shrink-0 ${SEVIYE_RENK[konu.seviye]}`}>
                            {konu.seviye}
                          </span>
                        </div>
                        <p className={`text-sm font-semibold leading-snug ${isRead ? 'text-[var(--text-3)] line-through' : 'text-[var(--text-1)]'}`}>
                          {konu.baslik}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex items-center gap-1 text-[11px] text-[var(--text-3)]">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>{konu.sure}</span>
                          </div>
                          <span className="text-[var(--text-3)] text-xs">·</span>
                          <span className="text-[11px] text-[var(--text-3)] truncate block max-w-[200px] sm:max-w-none">{konu.ozet}</span>
                        </div>
                      </div>

                      {/* Okundu toggle */}
                      <button
                        onClick={e => toggleRead(konu.id, e)}
                        title={isRead ? t('training.markAsUnread') : t('training.markAsRead')}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                          isRead
                            ? 'text-emerald-600 dark:text-emerald-400 hover:scale-105'
                            : 'text-[var(--text-3)] hover:text-emerald-600 dark:hover:text-emerald-400 hover:scale-105'
                        }`}
                      >
                        {isRead ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </button>

                      {/* Favori butonu */}
                      <button
                        onClick={e => toggleFav(konu.id, e)}
                        title={isFav ? t('training.removeFromFavorites') : t('training.addToFavorites')}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                          isFav
                            ? 'bg-amber-500/10 text-amber-500 hover:scale-105'
                            : 'text-[var(--text-3)] hover:text-amber-500 hover:scale-105'
                        }`}
                      >
                        <Star className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[var(--text-3)] transition-transform duration-200 ${acik ? 'rotate-180' : ''}`}
                        strokeWidth={2}
                      />
                    </button>

                    {/* Açık içerik maddeleri */}
                    {acik && (
                      <div className="border-t border-[var(--border)] px-4 pb-4 pt-3 bg-[var(--bg-subtle)]/30 rounded-b-2xl animate-in fade-in duration-200">
                        <ul className="space-y-2.5">
                          {konu.maddeler.map((madde, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <span className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                                konu.kategoriId === 'zihniyet' ? 'bg-[#EEF2FF] dark:bg-[#1e1b4b] text-[#3730A3] dark:text-[#a5b4fc]' :
                                konu.kategoriId === 'iletisim' ? 'bg-[#E1F5EE] dark:bg-[#0d3d2e] text-[#0F6E56] dark:text-[#4ade80]' :
                                konu.kategoriId === 'davet' ? 'bg-[#F0F9FF] dark:bg-[#0c1a2e] text-[#0369A1] dark:text-[#38bdf8]' :
                                konu.kategoriId === 'sunum' ? 'bg-[#FFF7ED] dark:bg-[#2a1500] text-[#9A3412] dark:text-[#fb923c]' :
                                konu.kategoriId === 'ekip' ? 'bg-[#FAEEDA] dark:bg-[#3a2200] text-[#854F0B] dark:text-[#fbbf24]' :
                                konu.kategoriId === 'strateji' ? 'bg-[#FBEAF0] dark:bg-[#3d0f1f] text-[#72243E] dark:text-[#f9a8d4]' :
                                konu.kategoriId === 'uyum' ? 'bg-[#F0FDF4] dark:bg-[#052e16] text-[#166534] dark:text-[#86efac]' :
                                'bg-[#FAF5FF] dark:bg-[#1a0030] text-[#6B21A8] dark:text-[#d8b4fe]'
                              }`}>
                                {idx + 1}
                              </span>
                              <p className="text-sm leading-relaxed text-[var(--text-2)]">{madde}</p>
                            </li>
                          ))}
                        </ul>

                        {/* Paylaşım butonları */}
                        <div className="mt-4 ml-7 flex flex-wrap items-center gap-2">
                          {/* Kopyala */}
                          <button
                            onClick={e => copyKonu(konu.maddeler, konu.id, e)}
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                              copied
                                ? 'bg-[#E1F5EE] text-[#0F6E56] dark:bg-[#0d3d2e] dark:text-[#4ade80]'
                                : 'bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[#EEF2FF] hover:text-[#3730A3]'
                            }`}
                          >
                            {copied
                              ? <><Check className="h-3 w-3" /> {lang === 'en' ? 'Copied!' : 'Kopyalandı!'}</>
                              : <><Copy className="h-3 w-3" /> {lang === 'en' ? 'Copy Content' : 'İçeriği Kopyala'}</>
                            }
                          </button>

                          {/* SMS ile Gönder */}
                          <a
                            href={`sms:?body=${encodeURIComponent(konu.maddeler.join('\n'))}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 transition-all hover:bg-sky-100 dark:hover:bg-sky-950/50"
                          >
                            <MessageSquare className="h-3 w-3" />
                            {lang === 'en' ? 'Send via SMS' : 'SMS İle Gönder'}
                          </a>

                          {/* WhatsApp ile Gönder */}
                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(konu.maddeler.join('\n'))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1.5 rounded-xl bg-[#E7FBF0] dark:bg-[#0d2e1a]/50 px-3 py-1.5 text-xs font-semibold text-[#1a9e4f] dark:text-[#4ade80] transition-all hover:bg-[#d4f7e4] dark:hover:bg-[#0d2e1a]"
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

          {/* Sayfalama */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => { setPage(p); setAcikId(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className={`h-9 w-9 rounded-xl text-sm font-semibold transition-all ${
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
    </main>
  )
}

export default function EgitimPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--text-3)] flex items-center justify-center min-h-[300px]">Loading training...</div>}>
      <EgitimPageContent />
    </Suspense>
  )
}
