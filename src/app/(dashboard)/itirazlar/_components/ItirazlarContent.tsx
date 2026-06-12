'use client'

import { useState, useMemo, useEffect } from 'react'
import { MessageCircleQuestion, Search, X, Star, CheckCircle2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { useProgressSync } from '@/hooks/useProgressSync'
import { useWorkspace } from '@/hooks/useWorkspace'
import { loadCustomContent, addCustomContent, updateCustomContent, deleteCustomContent } from '@/lib/domain/customContent'
import { deleteWithUndo } from '@/lib/ui/deleteWithUndo'
import { useSearchParams } from 'next/navigation'
import { ITIRAZLAR, PAGE_SIZE } from '../data/itirazlar'
import type { CustomItiraz } from '../types'
import { ItirazCard } from './ItirazCard'
import { AddObjectionModal } from './AddObjectionModal'

export function ItirazlarContent({
  embedded = false,
  addFormOpen: addFormOpenProp,
  onAddFormOpenChange,
}: {
  embedded?: boolean
  addFormOpen?: boolean
  onAddFormOpenChange?: (open: boolean) => void
}) {
  const { lang, t } = useTranslation()
  const { data: ws } = useWorkspace()
  const searchParams = useSearchParams()
  const {
    readObjections: read,
    favObjections: favs,
    toggleObjectionRead,
    toggleObjectionFav,
  } = useProgressSync()

  const [search, setSearch] = useState('')
  const [acikId, setAcikId] = useState<number | null>(null)
  const [aktifKategori, setAktifKategori] = useState(0)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [customItirazlar, setCustomItirazlar] = useState<CustomItiraz[]>([])
  const [editingObjection, setEditingObjection] = useState<CustomItiraz | null>(null)
  const [internalFormOpen, setInternalFormOpen] = useState(false)
  const formOpen = addFormOpenProp ?? internalFormOpen
  const setFormOpen = onAddFormOpenChange ?? setInternalFormOpen

  useEffect(() => {
    let cancelled = false
    loadCustomContent('nmm_custom_objections', 'nmm_custom_objections_v1', ws?.workspaceId ?? null)
      .then(items => {
        if (!cancelled) {
          const approved = items.filter(it => (it as Record<string, unknown>).isApproved)
          setCustomItirazlar(approved as unknown as CustomItiraz[])
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [ws?.workspaceId])

  const tumItirazlar = useMemo(() => [...ITIRAZLAR, ...customItirazlar], [customItirazlar])

  const KATEGORILER = useMemo(() => {
    const base = lang === 'en' ? ['All', 'Favorites'] : ['Tümü', 'Favoriler']
    const uniq = Array.from(new Set(tumItirazlar.map(i => lang === 'en' ? i.kategori.en : i.kategori.tr)))
    return [...base, ...uniq]
  }, [tumItirazlar, lang])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1) }, [search, aktifKategori, lang])

  async function copyCevap(cevap: string, id: number, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(cevap)
      setCopiedId(id)
      toast.success(t('objectionsPage.answerCopied'))
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error(t('objectionsPage.copyFailed'))
    }
  }

  function handleAddObjection(newObj: CustomItiraz) {
    const updated = [newObj, ...customItirazlar]
    setCustomItirazlar(updated)
    addCustomContent('nmm_custom_objections', ws?.workspaceId ?? null, newObj as unknown as Record<string, unknown> & { id: number }).catch(() => {})
  }

  function handleUpdateObjection(updatedObj: CustomItiraz) {
    setCustomItirazlar(prev => prev.map(c => (c.id === updatedObj.id ? updatedObj : c)))
    updateCustomContent('nmm_custom_objections', updatedObj.id, updatedObj as unknown as Record<string, unknown> & { id: number }).catch(() => {})
    setEditingObjection(null)
  }

  const filtrelenmis = useMemo(() => {
    const q = search.toLowerCase().trim()
    const label = KATEGORILER[aktifKategori]
    const isFavFilter = label === 'Favoriler' || label === 'Favorites'
    const isAll = label === 'Tümü' || label === 'All'

    return tumItirazlar.filter(i => {
      if (isFavFilter) return favs.has(i.id)
      const kategoriEslesti = isAll || i.kategori.tr === label || i.kategori.en === label
      if (!kategoriEslesti) return false
      if (!q) return true
      const soru = lang === 'en' ? i.soru.en : i.soru.tr
      const cevap = lang === 'en' ? i.cevap?.en ?? '' : i.cevap?.tr ?? ''
      const kisa = i.kisaCevap ?? ''
      const detay = i.detayliCevap ?? ''
      const yakl = i.yaklasim ?? ''
      const diyalog = i.ornekDiyalog ?? ''
      const etiketler = (i.tags ?? []).join(' ')
      return (
        soru.toLowerCase().includes(q) ||
        cevap.toLowerCase().includes(q) ||
        kisa.toLowerCase().includes(q) ||
        detay.toLowerCase().includes(q) ||
        yakl.toLowerCase().includes(q) ||
        diyalog.toLowerCase().includes(q) ||
        etiketler.toLowerCase().includes(q)
      )
    })
  }, [search, aktifKategori, favs, lang, KATEGORILER, tumItirazlar])

  useEffect(() => {
    const topicIdStr = searchParams.get('id')
    if (!topicIdStr) return
    const topicId = parseInt(topicIdStr, 10)
    if (isNaN(topicId)) return
    const idx = filtrelenmis.findIndex(item => item.id === topicId)
    if (idx === -1) return
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setPage(Math.floor(idx / PAGE_SIZE) + 1)
    setAcikId(topicId)
    setTimeout(() => {
      document.getElementById(`konu-${topicId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
  }, [searchParams, filtrelenmis])

  const totalPages = Math.ceil(filtrelenmis.length / PAGE_SIZE)
  const pageItems = filtrelenmis.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const favCount = favs.size
  const readCount = read.size
  const isFavoritesEmpty =
    (KATEGORILER[aktifKategori] === 'Favoriler' || KATEGORILER[aktifKategori] === 'Favorites') &&
    favCount === 0

  const customIds = useMemo(() => new Set(customItirazlar.map(c => c.id)), [customItirazlar])

  const body = (
    <>
      {!embedded && (
        <header className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1F3] dark:bg-[#3d0a1a]">
                <MessageCircleQuestion className="h-5 w-5 text-[#9B1D47] dark:text-[#fda4af]" strokeWidth={1.75} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-1)]">{t('objectionsPage.title')}</h1>
              </div>
            </div>
            <button
              onClick={() => { setEditingObjection(null); setFormOpen(true) }}
              className="flex items-center gap-1.5 rounded-xl bg-[#9B1D47] hover:bg-[#801438] text-white px-3.5 py-2 text-sm font-bold shadow-sm transition active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('objectionsPage.addObjection')}</span>
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#FFE4EA] dark:border-[#3d0a1a] bg-[#FFF1F3] dark:bg-[#3d0a1a]/60 px-4 py-3">
            <span className="text-3xl">🛡️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-relaxed text-[#9B1D47] dark:text-[#fda4af]">
                {t('objectionsPage.subtitle')}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {favCount > 0 ? (
                <span className="rounded-full bg-[#9B1D47] px-2.5 py-1 text-[10px] font-bold text-white dark:bg-[#fda4af] dark:text-[#3d0a1a]">
                  {favCount} {t('objectionsPage.fav')}
                </span>
              ) : (
                <span className="rounded-full bg-[#9B1D47]/10 px-2.5 py-1 text-[10px] font-bold text-[#9B1D47] dark:text-[#fda4af]">
                  {tumItirazlar.length} {t('objectionsPage.objections')}
                </span>
              )}
              {readCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white dark:bg-emerald-500">
                  <CheckCircle2 className="h-3 w-3" />
                  {readCount}/{tumItirazlar.length}
                </span>
              )}
            </div>
          </div>
        </header>
      )}

      {embedded && !onAddFormOpenChange && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => { setEditingObjection(null); setFormOpen(true) }}
            className="flex items-center gap-1.5 rounded-xl bg-[#9B1D47] px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#801438] active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t('objectionsPage.addObjection')}</span>
          </button>
        </div>
      )}

      <div className="mb-4 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-3)] pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('objectionsPage.searchPlaceholder')}
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-3 pl-10 pr-10 text-base text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#9B1D47] dark:focus:border-[#fda4af] transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-3)] hover:text-[var(--text-1)] transition"
          >
            <X className="h-3 w-3" />
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
                ? 'bg-[#9B1D47] text-white dark:bg-[#fda4af] dark:text-[#3d0a1a]'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-2)] hover:border-[#9B1D47] dark:hover:border-[#fda4af]'
            }`}
          >
            {(k === 'Favoriler' || k === 'Favorites') && <Star className="h-3 w-3" />}
            {k}
            {(k === 'Favoriler' || k === 'Favorites') && favCount > 0 && (
              <span className={`rounded-full px-1.5 text-[9px] font-bold ${aktifKategori === idx ? 'bg-white/20' : 'bg-[#9B1D47]/10 text-[#9B1D47] dark:text-[#fda4af]'}`}>
                {favCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {search && (
        <p className="mb-3 text-sm text-[var(--text-3)]">
          {filtrelenmis.length} {t('objectionsPage.resultsFound')}
        </p>
      )}

      {isFavoritesEmpty && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
          <p className="mb-2 text-4xl">⭐</p>
          <p className="text-base font-semibold text-[var(--text-1)]">{t('objectionsPage.noFavorites')}</p>
          <p className="mt-1 text-sm text-[var(--text-2)]">{t('objectionsPage.noFavoritesDesc')}</p>
        </div>
      )}

      {!isFavoritesEmpty && filtrelenmis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
          <p className="mb-2 text-4xl">🔍</p>
          <p className="text-base font-semibold text-[var(--text-1)]">{t('objectionsPage.noMatchingObjections')}</p>
          <p className="mt-1 text-sm text-[var(--text-2)]">{t('objectionsPage.tryDifferentKeywords')}</p>
        </div>
      ) : !isFavoritesEmpty && (
        <>
          <ul className="space-y-3">
            {pageItems.map(itiraz => (
              <ItirazCard
                key={itiraz.id}
                itiraz={itiraz}
                acik={acikId === itiraz.id}
                isFav={favs.has(itiraz.id)}
                isRead={read.has(itiraz.id)}
                copied={copiedId === itiraz.id}
                isCustom={customIds.has(itiraz.id)}
                onToggle={() => setAcikId(prev => (prev === itiraz.id ? null : itiraz.id))}
                onToggleFav={e => {
                  e.stopPropagation()
                  toggleObjectionFav(itiraz.id)
                }}
                onToggleRead={e => {
                  e.stopPropagation()
                  toggleObjectionRead(itiraz.id)
                }}
                onCopy={(value, e) => copyCevap(value, itiraz.id, e)}
                onEdit={
                  customIds.has(itiraz.id) &&
                  (itiraz as unknown as { userId?: string }).userId === ws?.userId
                    ? () => {
                        setEditingObjection(itiraz as CustomItiraz)
                        setFormOpen(true)
                      }
                    : undefined
                }
                onDelete={() =>
                  deleteWithUndo(itiraz.soru[lang] ?? itiraz.soru.tr, () => {
                    setCustomItirazlar(prev => prev.filter(c => c.id !== itiraz.id))
                    deleteCustomContent('nmm_custom_objections', itiraz.id).catch(() => {})
                  })
                }
              />
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => {
                    setPage(p)
                    setAcikId(null)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={`h-9 w-9 rounded-xl text-base font-semibold transition-all ${
                    page === p
                      ? 'bg-[#9B1D47] text-white dark:bg-[#fda4af] dark:text-[#3d0a1a]'
                      : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-2)] hover:border-[#9B1D47] dark:hover:border-[#fda4af]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <AddObjectionModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingObjection(null)
        }}
        onAdd={handleAddObjection}
        editing={editingObjection}
        onUpdate={handleUpdateObjection}
      />
    </>
  )

  if (embedded) return <div>{body}</div>

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      {body}
    </main>
  )
}
