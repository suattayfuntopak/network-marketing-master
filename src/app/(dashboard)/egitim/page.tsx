'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { BookOpen, ChevronDown, Clock, Star, CheckCircle2, Circle, Copy, Check, MessageSquare, Search, X, Plus, Trash2 } from 'lucide-react'
import { getTrainingData } from '@/lib/trainingData'
import { useTranslation } from '@/providers/LanguageProvider'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useProgressSync } from '@/hooks/useProgressSync'

const SEVIYE_RENK: Record<string, string> = {
  'Temel': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/20',
  'Orta': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/20',
  'İleri': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/20',
  'Basic': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/20',
  'Medium': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/20',
  'Advanced': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/20',
}

const PAGE_SIZE = 10

function EgitimPageContent() {
  const { lang, t } = useTranslation()
  const searchParams = useSearchParams()
  
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

  // Custom trainings state & form variables
  const [customTrainings, setCustomTrainings] = useState<any[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [newBaslik, setNewBaslik] = useState('')
  const [newOzet, setNewOzet] = useState('')
  const [newKategori, setNewKategori] = useState('Zihniyet')
  const [newTur, setNewTur] = useState('Ders Notu')
  const [newSeviye, setNewSeviye] = useState('Başlangıç')
  const [newIcerik, setNewIcerik] = useState('')
  const [newEmoji, setNewEmoji] = useState('📖')
  const [newTags, setNewTags] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('nmm_custom_training_v1')
      if (stored) {
        setCustomTrainings(JSON.parse(stored))
      }
    } catch {}
  }, [])

  const KATEGORILER_DATA = getTrainingData(lang)

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
      isCustom?: boolean
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

  const allTopicsMerged = useMemo(() => {
    return [...ALL_TOPICS, ...customTrainings]
  }, [ALL_TOPICS, customTrainings])

  // Category array (Tümü, Favoriler, and individual categories)
  const KATEGORILER = useMemo(() => {
    const base = lang === 'en'
      ? ['All', 'Favorites']
      : ['Tümü', 'Favoriler']
    const unique = Array.from(new Set(allTopicsMerged.map(c => c.kategoriBaslik)))
    return [...base, ...unique]
  }, [lang, allTopicsMerged])

  // Filtered topics
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
      const maddelerMatch = konu.maddeler.some((m: string) => m.toLowerCase().includes(q))
      return baslikMatch || ozetMatch || maddelerMatch
    })
  }, [search, aktifKategori, favs, allTopicsMerged, KATEGORILER])

  function handleAddTraining(e: React.FormEvent) {
    e.preventDefault()
    if (!newBaslik.trim() || !newIcerik.trim()) return

    const newObj = {
      id: `custom_${Date.now()}`,
      baslik: newBaslik,
      emoji: newEmoji || '📖',
      sure: '5 dk',
      seviye: newSeviye,
      ozet: newOzet || newIcerik.slice(0, 100) + '...',
      maddeler: newIcerik.split('\n').map(l => l.trim()).filter(Boolean),
      kategoriId: newKategori.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-'),
      kategoriBaslik: newKategori,
      kategoriRenk: 'bg-purple-100 text-purple-700',
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      isCustom: true
    }

    const updated = [newObj, ...customTrainings]
    setCustomTrainings(updated)
    localStorage.setItem('nmm_custom_training_v1', JSON.stringify(updated))

    // Reset
    setNewBaslik('')
    setNewOzet('')
    setNewIcerik('')
    setNewTags('')
    setNewEmoji('📖')
    setFormOpen(false)
    toast.success(lang === 'en' ? 'Content added successfully!' : 'İçerik başarıyla eklendi!')
  }

  // Load state & query param & auto pagination & scroll to it
  useEffect(() => {
    const topicId = searchParams.get('id')
    if (topicId) {
      const idx = filtrelenmis.findIndex(t => t.id === topicId)
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
      {/* Başlık */}
      <header className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#1e1b4b]">
              <BookOpen className="h-5 w-5 text-[#3730A3] dark:text-[#a5b4fc]" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-1)]">{t('training.title')}</h1>
              <p className="text-sm text-[var(--text-3)]">{t('training.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#3730A3] hover:bg-[#28227d] text-white px-3.5 py-2 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{lang === 'en' ? 'Add Content' : 'İçerik Ekle'}</span>
          </button>
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
                {readCount}/{allTopicsMerged.length}
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
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide no-swipe" data-no-swipe="true">
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
                konu.kategoriId === 'iletisim' || konu.kategoriId === 'iletisim-&-yaklasim' ? 'text-[#0F6E56] dark:text-[#4ade80]' :
                konu.kategoriId === 'davet' || konu.kategoriId === 'davet-pratigi' ? 'text-[#0369A1] dark:text-[#38bdf8]' :
                konu.kategoriId === 'sunum' || konu.kategoriId === 'sunum-&-kapanis' ? 'text-[#9A3412] dark:text-[#fb923c]' :
                konu.kategoriId === 'ekip' || konu.kategoriId === 'ekip-&-liderlik' ? 'text-[#854F0B] dark:text-[#fbbf24]' :
                konu.kategoriId === 'strateji' || konu.kategoriId === 'strateji-&-plan' ? 'text-[#72243E] dark:text-[#f9a8d4]' :
                konu.kategoriId === 'uyum' || konu.kategoriId === 'yasal-uyum' ? 'text-[#166534] dark:text-[#86efac]' :
                'text-[#6B21A8] dark:text-[#d8b4fe]'

              const catBorderColorHover = 
                konu.kategoriId === 'zihniyet' ? 'hover:border-[#3730A3]/30 dark:hover:border-[#a5b4fc]/30' :
                konu.kategoriId === 'iletisim' || konu.kategoriId === 'iletisim-&-yaklasim' ? 'hover:border-[#0F6E56]/30 dark:hover:border-[#4ade80]/30' :
                konu.kategoriId === 'davet' || konu.kategoriId === 'davet-pratigi' ? 'hover:border-[#0369A1]/30 dark:hover:border-[#38bdf8]/30' :
                konu.kategoriId === 'sunum' || konu.kategoriId === 'sunum-&-kapanis' ? 'hover:border-[#9A3412]/30 dark:hover:border-[#fb923c]/30' :
                konu.kategoriId === 'ekip' || konu.kategoriId === 'ekip-&-liderlik' ? 'hover:border-[#854F0B]/30 dark:hover:border-[#fbbf24]/30' :
                konu.kategoriId === 'strateji' || konu.kategoriId === 'strateji-&-plan' ? 'hover:border-[#72243E]/30 dark:hover:border-[#f9a8d4]/30' :
                konu.kategoriId === 'uyum' || konu.kategoriId === 'yasal-uyum' ? 'hover:border-[#166534]/30 dark:hover:border-[#86efac]/30' :
                'hover:border-[#6B21A8]/30 dark:hover:border-[#d8b4fe]/30'

              const catBorderColorActive = 
                konu.kategoriId === 'zihniyet' ? 'border-[#3730A3]/25 dark:border-[#a5b4fc]/25 shadow-[#3730A3]/5' :
                konu.kategoriId === 'iletisim' || konu.kategoriId === 'iletisim-&-yaklasim' ? 'border-[#0F6E56]/25 dark:border-[#4ade80]/25 shadow-[#0F6E56]/5' :
                konu.kategoriId === 'davet' || konu.kategoriId === 'davet-pratigi' ? 'border-[#0369A1]/25 dark:border-[#38bdf8]/25 shadow-[#0369A1]/5' :
                konu.kategoriId === 'sunum' || konu.kategoriId === 'sunum-&-kapanis' ? 'border-[#9A3412]/25 dark:border-[#fb923c]/25 shadow-[#9A3412]/5' :
                konu.kategoriId === 'ekip' || konu.kategoriId === 'ekip-&-liderlik' ? 'border-[#854F0B]/25 dark:border-[#fbbf24]/25 shadow-[#854F0B]/5' :
                konu.kategoriId === 'strateji' || konu.kategoriId === 'strateji-&-plan' ? 'border-[#72243E]/25 dark:border-[#f9a8d4]/25 shadow-[#72243E]/5' :
                konu.kategoriId === 'uyum' || konu.kategoriId === 'yasal-uyum' ? 'border-[#166534]/25 dark:border-[#86efac]/25 shadow-[#166534]/5' :
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

                      {/* Silme Butonu (Sadece Custom Eğitimler için) */}
                      {konu.isCustom && (
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            if (confirm(lang === 'en' ? 'Are you sure you want to delete this training content?' : 'Bu eğitim içeriğini silmek istediğinize emin misiniz?')) {
                              const updated = customTrainings.filter(t => t.id !== konu.id)
                              setCustomTrainings(updated)
                              localStorage.setItem('nmm_custom_training_v1', JSON.stringify(updated))
                              toast.success(lang === 'en' ? 'Content deleted.' : 'İçerik silindi.')
                            }
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-3)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all hover:scale-105"
                          title={lang === 'en' ? 'Delete Content' : 'İçeriği Sil'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

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
                          {konu.maddeler.map((madde: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <span className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                                konu.kategoriId === 'zihniyet' ? 'bg-[#EEF2FF] dark:bg-[#1e1b4b] text-[#3730A3] dark:text-[#a5b4fc]' :
                                konu.kategoriId === 'iletisim' || konu.kategoriId === 'iletisim-&-yaklasim' ? 'bg-[#E1F5EE] dark:bg-[#0d3d2e] text-[#0F6E56] dark:text-[#4ade80]' :
                                konu.kategoriId === 'davet' || konu.kategoriId === 'davet-pratigi' ? 'bg-[#F0F9FF] dark:bg-[#0c1a2e] text-[#0369A1] dark:text-[#38bdf8]' :
                                konu.kategoriId === 'sunum' || konu.kategoriId === 'sunum-&-kapanis' ? 'bg-[#FFF7ED] dark:bg-[#2a1500] text-[#9A3412] dark:text-[#fb923c]' :
                                konu.kategoriId === 'ekip' || konu.kategoriId === 'ekip-&-liderlik' ? 'bg-[#FAEEDA] dark:bg-[#3a2200] text-[#854F0B] dark:text-[#fbbf24]' :
                                konu.kategoriId === 'strateji' || konu.kategoriId === 'strateji-&-plan' ? 'bg-[#FBEAF0] dark:bg-[#3d0f1f] text-[#72243E] dark:text-[#f9a8d4]' :
                                konu.kategoriId === 'uyum' || konu.kategoriId === 'yasal-uyum' ? 'bg-[#F0FDF4] dark:bg-[#052e16] text-[#166534] dark:text-[#86efac]' :
                                'bg-[#FAF5FF] dark:bg-[#1a0030] text-[#6B21A8] dark:text-[#d8b4fe]'
                              }`}>
                                {idx + 1}
                              </span>
                              <p className="text-sm leading-relaxed text-[var(--text-2)] whitespace-pre-wrap">{madde}</p>
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

      {/* Kendi İçeriğini Ekle Pop-up Formu */}
      {formOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-black/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl md:max-w-2xl rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-6 md:p-7 shadow-2xl overflow-y-auto my-auto max-h-[85vh] md:max-h-[90vh] animate-in zoom-in-95 duration-200 space-y-4 md:space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="text-base md:text-lg font-bold text-[var(--text-1)]">
                  {lang === 'en' ? 'Add Content' : 'İçerik Ekle'}
                </h2>
                <p className="text-[11px] md:text-xs text-[var(--text-3)] font-medium mt-0.5">
                  {lang === 'en'
                    ? 'You can add your own script, lecture notes or guides to the NM Master library'
                    : 'NM Master kütüphanesine kendi script, ders notu ya da rehberini ekleyebilirsin'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="flex items-center gap-1 text-[11px] md:text-xs font-bold text-[var(--text-3)] hover:text-[#3730A3] dark:hover:text-[#a5b4fc] transition cursor-pointer"
              >
                <X className="h-4 w-4" />
                <span>{lang === 'en' ? 'Close Form' : 'Formu Kapat'}</span>
              </button>
            </div>

            <form onSubmit={handleAddTraining} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Başlık */}
                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">
                    {lang === 'en' ? 'Title' : 'Başlık'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newBaslik}
                    onChange={e => setNewBaslik(e.target.value)}
                    placeholder={
                      lang === 'en'
                        ? 'e.g. Mini follow-up plan after first presentation'
                        : 'Örn. İlk sunum sonrası mini takip planı'
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs md:text-sm text-[var(--text-1)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition"
                  />
                </div>
                {/* Özet */}
                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">
                    {lang === 'en' ? 'Summary' : 'Özet'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newOzet}
                    onChange={e => setNewOzet(e.target.value)}
                    placeholder={
                      lang === 'en'
                        ? 'Briefly describe what the content is for.'
                        : 'İçeriğin ne iş gördüğünü kısa anlat.'
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs md:text-sm text-[var(--text-1)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Kategori */}
                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">
                    {lang === 'en' ? 'Category' : 'Kategori'}
                  </label>
                  <select
                    value={newKategori}
                    onChange={e => setNewKategori(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs md:text-sm text-[var(--text-1)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition"
                  >
                    <option value="Zihniyet">{lang === 'en' ? 'Mindset' : 'Zihniyet'}</option>
                    <option value="İletişim & Yaklaşım">{lang === 'en' ? 'Communication & Approach' : 'İletişim & Yaklaşım'}</option>
                    <option value="Davet Pratiği">{lang === 'en' ? 'Invitation Practice' : 'Davet Pratiği'}</option>
                    <option value="Sunum & Kapanış">{lang === 'en' ? 'Presentation & Closing' : 'Sunum & Kapanış'}</option>
                    <option value="Ekip & Liderlik">{lang === 'en' ? 'Team & Leadership' : 'Ekip & Liderlik'}</option>
                    <option value="Strateji & Plan">{lang === 'en' ? 'Strategy & Plan' : 'Strateji & Plan'}</option>
                    <option value="Yasal Uyum">{lang === 'en' ? 'Compliance' : 'Yasal Uyum'}</option>
                  </select>
                </div>
                {/* Tür */}
                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">
                    {lang === 'en' ? 'Type' : 'Tür'}
                  </label>
                  <select
                    value={newTur}
                    onChange={e => setNewTur(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs md:text-sm text-[var(--text-1)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition"
                  >
                    <option value="Ders Notu">{lang === 'en' ? 'Lecture Note' : 'Ders Notu'}</option>
                    <option value="Script">Script</option>
                    <option value="Rehber">{lang === 'en' ? 'Guide' : 'Rehber'}</option>
                  </select>
                </div>
                {/* Seviye */}
                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">
                    {lang === 'en' ? 'Level' : 'Seviye'}
                  </label>
                  <select
                    value={newSeviye}
                    onChange={e => setNewSeviye(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs md:text-sm text-[var(--text-1)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition"
                  >
                    <option value="Başlangıç">{lang === 'en' ? 'Beginner' : 'Başlangıç'}</option>
                    <option value="Orta">{lang === 'en' ? 'Intermediate' : 'Orta'}</option>
                    <option value="İleri">{lang === 'en' ? 'Advanced' : 'İleri'}</option>
                  </select>
                </div>
              </div>

              {/* İçerik (Textarea - Split by Newline) */}
              <div className="space-y-1">
                <label className="text-[11px] md:text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">
                  {lang === 'en' ? 'Content (Write Each Item on a New Line)' : 'İçerik (Her Maddeyi Yeni Satıra Yazın)'}
                </label>
                <textarea
                  rows={5}
                  required
                  value={newIcerik}
                  onChange={e => setNewIcerik(e.target.value)}
                  placeholder={
                    lang === 'en'
                      ? 'Add the full content text here, writing each step or item on a new line...'
                      : 'Her bir adım veya maddeyi yeni bir satıra yazarak tam içerik metnini buraya ekleyin...'
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-xs md:text-sm text-[var(--text-1)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Emoji Seçimi */}
                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">
                    {lang === 'en' ? 'Emoji' : 'Emoji'}
                  </label>
                  <select
                    value={newEmoji}
                    onChange={e => setNewEmoji(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs md:text-sm text-[var(--text-1)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition"
                  >
                    <option value="📖">{lang === 'en' ? '📖 Book' : '📖 Kitap'}</option>
                    <option value="💡">{lang === 'en' ? '💡 Bulb' : '💡 Ampul'}</option>
                    <option value="🧠">{lang === 'en' ? '🧠 Brain' : '🧠 Beyin'}</option>
                    <option value="🚀">{lang === 'en' ? '🚀 Rocket' : '🚀 Roket'}</option>
                    <option value="🎯">{lang === 'en' ? '🎯 Target' : '🎯 Hedef'}</option>
                    <option value="🤝">{lang === 'en' ? '🤝 Handshake' : '🤝 El Sıkışma'}</option>
                    <option value="💎">{lang === 'en' ? '💎 Diamond' : '💎 Elmas'}</option>
                  </select>
                </div>

                {/* Etiketler */}
                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">
                    {lang === 'en' ? 'Tags (Comma Separated)' : 'Etiketler (Virgülle Ayır)'}
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={e => setNewTags(e.target.value)}
                    placeholder={
                      lang === 'en' ? 'e.g. follow-up, whatsapp, closing' : 'örn. takip, whatsapp, kapanış'
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs md:text-sm text-[var(--text-1)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] text-[var(--text-2)] px-4 py-2 md:py-2.5 text-xs md:text-sm font-bold transition active:scale-95 cursor-pointer"
                >
                  {lang === 'en' ? 'Cancel' : 'İptal'}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#3730A3] hover:bg-[#28227d] text-white px-5 py-2 md:py-2.5 text-xs md:text-sm font-bold shadow-sm transition active:scale-95 cursor-pointer"
                >
                  {lang === 'en' ? '+ Add' : '+ Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
