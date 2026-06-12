'use client'

import { useEffect, useState, useTransition } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useWorkspace } from '@/hooks/useWorkspace'
import { submitModeratedRequestAction } from '@/app/(dashboard)/actions/moderation'
import { translateObjectionFieldsAction } from '../actions'
import type { Json } from '@/types/database.types'
import { SympatheticPopup } from '@/components/ui/SympatheticPopup'
import type { CustomItiraz } from '../types'

type Props = {
  open: boolean
  onClose: () => void
  onAdd: (objection: CustomItiraz) => void
  /** Edit modu: dolu gelirse form bu itirazla doldurulur ve kaydet → güncelle olur. */
  editing?: CustomItiraz | null
  onUpdate?: (objection: CustomItiraz) => void
}

export function AddObjectionModal({ open, onClose, onAdd, editing = null, onUpdate }: Props) {
  const { t, lang } = useTranslation()
  const { data: ws } = useWorkspace()
  const [isPending, startTransition] = useTransition()

  const [newSoru, setNewSoru] = useState('')
  const [newKategori, setNewKategori] = useState('Genel')
  const [newKisaCevap, setNewKisaCevap] = useState('')
  const [newDetayliCevap, setNewDetayliCevap] = useState('')
  const [newYaklasim, setNewYaklasim] = useState('')
  const [newOrnekDiyalog, setNewOrnekDiyalog] = useState('')
  const [newEmoji, setNewEmoji] = useState('🛡️')
  const [newTags, setNewTags] = useState('')

  const [showSympathetic, setShowSympathetic] = useState(false)

  useBodyScrollLock(open || showSympathetic)

  const isEdit = !!editing

  // Form açıldığında: edit modunda mevcut itirazla doldur (kullanıcının diline göre
  // WYSIWYG); ekleme modunda temiz başla.
  useEffect(() => {
    if (!open) return
    /* eslint-disable react-hooks/set-state-in-effect */
    if (editing) {
      const en = lang === 'en'
      setNewSoru(en ? editing.soru.en : editing.soru.tr)
      setNewKategori(en ? editing.kategori.en : editing.kategori.tr)
      setNewKisaCevap((en ? editing.kisaCevapEn ?? editing.kisaCevap : editing.kisaCevap) ?? '')
      setNewDetayliCevap((en ? editing.detayliCevapEn ?? editing.detayliCevap : editing.detayliCevap) ?? '')
      setNewYaklasim((en ? editing.yaklasimEn ?? editing.yaklasim : editing.yaklasim) ?? '')
      setNewOrnekDiyalog((en ? editing.ornekDiyalogEn ?? editing.ornekDiyalog : editing.ornekDiyalog) ?? '')
      setNewEmoji(editing.emoji || '🛡️')
      setNewTags((editing.tags ?? []).join(', '))
    } else {
      setNewSoru('')
      setNewKategori('Genel')
      setNewKisaCevap('')
      setNewDetayliCevap('')
      setNewYaklasim('')
      setNewOrnekDiyalog('')
      setNewEmoji('🛡️')
      setNewTags('')
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, editing, lang])

  if (!open && !showSympathetic) return null

  function resetForm() {
    setNewSoru('')
    setNewKisaCevap('')
    setNewDetayliCevap('')
    setNewYaklasim('')
    setNewOrnekDiyalog('')
    setNewTags('')
    setNewEmoji('🛡️')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newSoru.trim()) return

    const sourceLang: 'tr' | 'en' = lang === 'en' ? 'en' : 'tr'
    const tags = newTags.split(',').map(tag => tag.trim()).filter(Boolean)

    startTransition(async () => {
      try {
        // Kalıcı çeviri: kullanıcının dilindeki alanları karşı dile çevir (CLAUDE.md).
        const src = {
          kategori: newKategori,
          soru: newSoru,
          kisaCevap: newKisaCevap,
          detayliCevap: newDetayliCevap,
          yaklasim: newYaklasim,
          ornekDiyalog: newOrnekDiyalog,
        }
        const other = await translateObjectionFieldsAction(src, sourceLang)
        const tr = sourceLang === 'en' ? other : src
        const en = sourceLang === 'en' ? src : other

        const itemKey = editing ? editing.id : Date.now()
        const obj: CustomItiraz = {
          id: itemKey,
          kategori: { tr: tr.kategori, en: en.kategori },
          soru: { tr: tr.soru, en: en.soru },
          emoji: newEmoji || '🛡️',
          kisaCevap: tr.kisaCevap,
          kisaCevapEn: en.kisaCevap,
          detayliCevap: tr.detayliCevap,
          detayliCevapEn: en.detayliCevap,
          yaklasim: tr.yaklasim,
          yaklasimEn: en.yaklasim,
          ornekDiyalog: tr.ornekDiyalog,
          ornekDiyalogEn: en.ornekDiyalog,
          tags,
        }

        if (isEdit) {
          onUpdate?.(obj)
          toast.success(t('objectionsPage.objectionUpdated'))
          onClose()
          return
        }

        const res = await submitModeratedRequestAction(
          'objection',
          ws?.workspaceId ?? null,
          String(itemKey),
          obj as unknown as Record<string, Json>
        )

        resetForm()

        if (res.isApproved) {
          onAdd(obj)
          toast.success(t('objectionsPage.objectionAdded'))
          onClose()
        } else {
          // Regular user submitted successfully, closed and show sympathetic modal
          onClose()
          setShowSympathetic(true)
        }
      } catch (err: unknown) {
        toast.error((err instanceof Error ? err.message : '') || 'Hata oluştu.')
      }
    })
  }

  return (
    <>
      {open && (
        <div className={`fixed inset-0 ${Z.fullscreen} flex items-center justify-center p-4 md:p-6 bg-black/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200`}>
          <div className="relative w-full max-w-xl md:max-w-2xl rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-6 md:p-7 shadow-2xl overflow-y-auto my-auto max-h-[85vh] md:max-h-[90vh] animate-in zoom-in-95 duration-200 space-y-4 md:space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-[var(--text-1)]">{isEdit ? t('objectionsPage.editObjection') : t('objectionsPage.addObjection')}</h2>
                <p className="text-[11px] md:text-sm text-[var(--text-3)] font-medium mt-0.5">
                  {t('objectionsPage.addObjectionHint')}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 text-[11px] md:text-sm font-bold text-[var(--text-3)] hover:text-[#16A34A] dark:hover:text-[#fda4af] transition cursor-pointer"
              >
                <X className="h-4 w-4" />
                <span>Formu Kapat</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] md:text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">İtiraz (Soru)</label>
                  <input
                    type="text"
                    required
                    value={newSoru}
                    onChange={e => setNewSoru(e.target.value)}
                    placeholder="Örn. Bu iş uzun vadede yorucu gelmiyor mu?"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-sm md:text-base text-[var(--text-1)] outline-none focus:border-[#16A34A] dark:focus:border-[#fda4af] transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] md:text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">Kategori</label>
                  <select
                    value={newKategori}
                    onChange={e => setNewKategori(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-sm md:text-base text-[var(--text-1)] outline-none focus:border-[#16A34A] dark:focus:border-[#fda4af] transition"
                  >
                    <option value="Para & Kazanç">Para & Kazanç</option>
                    <option value="Zaman & Yoğunluk">Zaman & Yoğunluk</option>
                    <option value="Güven & Şüphe">Güven & Şüphe</option>
                    <option value="Yetenek & Kimlik">Yetenek & Kimlik</option>
                    <option value="Aile & Çevre">Aile & Çevre</option>
                    <option value="Ürün & Sistem">Ürün & Sistem</option>
                    <option value="Genel">Genel</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] md:text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">Kısa Cevap</label>
                <textarea
                  rows={3}
                  value={newKisaCevap}
                  onChange={e => setNewKisaCevap(e.target.value)}
                  placeholder="Kısa ve hızlı saha cevabı..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-sm md:text-base text-[var(--text-1)] outline-none focus:border-[#16A34A] dark:focus:border-[#fda4af] transition resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] md:text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">Detaylı Cevap</label>
                <textarea
                  rows={4}
                  value={newDetayliCevap}
                  onChange={e => setNewDetayliCevap(e.target.value)}
                  placeholder="Detaylı cevap metni..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-sm md:text-base text-[var(--text-1)] outline-none focus:border-[#16A34A] dark:focus:border-[#fda4af] transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] md:text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">Yaklaşım</label>
                  <textarea
                    rows={3}
                    value={newYaklasim}
                    onChange={e => setNewYaklasim(e.target.value)}
                    placeholder="Bu itirazı nasıl ele almak gerektiğini yaz..."
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-sm md:text-base text-[var(--text-1)] outline-none focus:border-[#16A34A] dark:focus:border-[#fda4af] transition resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] md:text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">Örnek Diyalog</label>
                  <textarea
                    rows={3}
                    value={newOrnekDiyalog}
                    onChange={e => setNewOrnekDiyalog(e.target.value)}
                    placeholder="Kısa örnek konuşma..."
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-sm md:text-base text-[var(--text-1)] outline-none focus:border-[#16A34A] dark:focus:border-[#fda4af] transition resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] md:text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">Emoji</label>
                  <select
                    value={newEmoji}
                    onChange={e => setNewEmoji(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-sm md:text-base text-[var(--text-1)] outline-none focus:border-[#16A34A] dark:focus:border-[#fda4af] transition"
                  >
                    <option value="🛡️">🛡️ Kalkan</option>
                    <option value="⚖️">⚖️ Terazi</option>
                    <option value="💰">💰 Para Torbası</option>
                    <option value="⏳">⏳ Kum Saati</option>
                    <option value="🤝">🤝 El Sıkışma</option>
                    <option value="🗣️">🗣️ Konuşma</option>
                    <option value="🚪">🚪 Kapı</option>
                    <option value="🕌">🕌 Cami</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] md:text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">Etiketler (Virgülle Ayır)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={e => setNewTags(e.target.value)}
                    placeholder="örn. güven, fiyat, zamanlama"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-sm md:text-base text-[var(--text-1)] outline-none focus:border-[#16A34A] dark:focus:border-[#fda4af] transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] text-[var(--text-2)] px-4 py-2 md:py-2.5 text-sm md:text-base font-bold transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white px-5 py-2 md:py-2.5 text-sm md:text-base font-bold shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{t('objectionsPage.savingTranslating')}</span>
                    </>
                  ) : (
                    <span>{isEdit ? t('objectionsPage.update') : t('objectionsPage.addBtn')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <SympatheticPopup open={showSympathetic} onClose={() => setShowSympathetic(false)} />
    </>
  )
}
