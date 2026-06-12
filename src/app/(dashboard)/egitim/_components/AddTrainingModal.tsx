'use client'

import { useState, useTransition } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useWorkspace } from '@/hooks/useWorkspace'
import { submitModeratedRequestAction } from '@/app/(dashboard)/actions/moderation'
import type { Json } from '@/types/database.types'
import { SympatheticPopup } from '@/components/ui/SympatheticPopup'
import type { TrainingTopic } from '../types'
import { updateCustomContent } from '@/lib/domain/customContent'
import { useEffect } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  onAdd: (topic: TrainingTopic) => void
  editing?: TrainingTopic | null
  onUpdate?: (topic: TrainingTopic) => void
}

export function AddTrainingModal({ open, onClose, onAdd, editing = null, onUpdate }: Props) {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const [isPending, startTransition] = useTransition()

  const [newBaslik, setNewBaslik] = useState('')
  const [newOzet, setNewOzet] = useState('')
  const [newKategori, setNewKategori] = useState('Zihniyet')
  const [newTur, setNewTur] = useState('Ders Notu')
  const [newSeviye, setNewSeviye] = useState('Başlangıç')
  const [newIcerik, setNewIcerik] = useState('')
  const [newEmoji, setNewEmoji] = useState('📖')
  const [newTags, setNewTags] = useState('')

  const [showSympathetic, setShowSympathetic] = useState(false)

  useBodyScrollLock(open || showSympathetic)

  useEffect(() => {
    if (editing) {
      setNewBaslik(editing.baslik)
      setNewOzet(editing.ozet)
      setNewKategori(editing.kategoriBaslik || 'Zihniyet')
      setNewSeviye(editing.seviye)
      setNewIcerik(editing.maddeler.join('\n'))
      setNewEmoji(editing.emoji || '📖')
      setNewTags((editing.tags ?? []).join(', '))
    } else {
      setNewBaslik('')
      setNewOzet('')
      setNewKategori('Zihniyet')
      setNewTur('Ders Notu')
      setNewSeviye('Başlangıç')
      setNewIcerik('')
      setNewEmoji('📖')
      setNewTags('')
    }
  }, [open, editing])

  if (!open && !showSympathetic) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newBaslik.trim() || !newIcerik.trim()) return

    const itemKey = editing ? editing.id : `custom_${Date.now()}`
    const newObj: TrainingTopic = {
      id: itemKey,
      baslik: newBaslik,
      emoji: newEmoji || '📖',
      sure: editing ? editing.sure : '5 dk',
      seviye: newSeviye,
      ozet: newOzet || newIcerik.slice(0, 100) + '...',
      maddeler: newIcerik.split('\n').map(l => l.trim()).filter(Boolean),
      kategoriId: newKategori.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-'),
      kategoriBaslik: newKategori,
      kategoriRenk: editing ? editing.kategoriRenk : 'bg-purple-100 text-purple-700',
      tags: newTags.split(',').map(tag => tag.trim()).filter(Boolean),
      isCustom: true,
    }

    startTransition(async () => {
      try {
        if (editing && onUpdate) {
          await updateCustomContent('nmm_custom_trainings', itemKey, newObj as any)
          onUpdate(newObj)
          toast.success(t('trainingPage.contentUpdated') || 'İçerik güncellendi!')
          onClose()
        } else {
          const res = await submitModeratedRequestAction(
            'training',
            ws?.workspaceId ?? null,
            itemKey,
            newObj as unknown as Record<string, Json>
          )

          setNewBaslik('')
          setNewOzet('')
          setNewIcerik('')
          setNewTags('')
          setNewEmoji('📖')

          if (res.isApproved) {
            onAdd(newObj)
            toast.success(t('trainingPage.contentAdded'))
            onClose()
          } else {
            // Regular user submitted successfully, closed and show sympathetic modal
            onClose()
            setShowSympathetic(true)
          }
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
                <h2 className="text-lg md:text-xl font-bold text-[var(--text-1)]">
                  {t('trainingPage.addContent')}
                </h2>
                <p className="text-[11px] md:text-sm text-[var(--text-3)] font-medium mt-0.5">
                  {t('trainingPage.addContentDesc')}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 text-[11px] md:text-sm font-bold text-[var(--text-3)] hover:text-[#3730A3] dark:hover:text-[#a5b4fc] transition cursor-pointer"
              >
                <X className="h-4 w-4" />
                <span>{t('trainingPage.closeForm')}</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] md:text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">
                    {t('trainingPage.fieldTitle')}
                  </label>
                  <input
                    type="text"
                    required
                    value={newBaslik}
                    onChange={e => setNewBaslik(e.target.value)}
                    placeholder={t('trainingPage.titlePlaceholder')}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-sm md:text-base text-[var(--text-1)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] md:text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">
                    {t('trainingPage.fieldSummary')}
                  </label>
                  <input
                    type="text"
                    required
                    value={newOzet}
                    onChange={e => setNewOzet(e.target.value)}
                    placeholder={t('trainingPage.summaryPlaceholder')}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-sm md:text-base text-[var(--text-1)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] md:text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">
                    {t('trainingPage.fieldCategory')}
                  </label>
                  <select
                    value={newKategori}
                    onChange={e => setNewKategori(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-sm md:text-base text-[var(--text-1)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition"
                  >
                    <option value="Zihniyet">{t('trainingPage.catMindset')}</option>
                    <option value="İletişim & Yaklaşım">{t('trainingPage.catCommunication')}</option>
                    <option value="Davet Pratiği">{t('trainingPage.catInvitation')}</option>
                    <option value="Sunum & Kapanış">{t('trainingPage.catPresentation')}</option>
                    <option value="Ekip & Liderlik">{t('trainingPage.catTeam')}</option>
                    <option value="Strateji & Plan">{t('trainingPage.catStrategy')}</option>
                    <option value="Yasal Uyum">{t('trainingPage.catCompliance')}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] md:text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">
                    {t('trainingPage.fieldType')}
                  </label>
                  <select
                    value={newTur}
                    onChange={e => setNewTur(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-sm md:text-base text-[var(--text-1)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition"
                  >
                    <option value="Ders Notu">{t('trainingPage.typeLectureNote')}</option>
                    <option value="Script">Script</option>
                    <option value="Rehber">{t('trainingPage.typeGuide')}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] md:text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">
                    {t('trainingPage.fieldLevel')}
                  </label>
                  <select
                    value={newSeviye}
                    onChange={e => setNewSeviye(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-sm md:text-base text-[var(--text-1)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition"
                  >
                    <option value="Başlangıç">{t('trainingPage.levelBeginner')}</option>
                    <option value="Orta">{t('trainingPage.levelIntermediate')}</option>
                    <option value="İleri">{t('trainingPage.levelAdvanced')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] md:text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">
                  {t('trainingPage.fieldContent')}
                </label>
                <textarea
                  rows={5}
                  required
                  value={newIcerik}
                  onChange={e => setNewIcerik(e.target.value)}
                  placeholder={t('trainingPage.contentPlaceholder')}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-sm md:text-base text-[var(--text-1)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] md:text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">
                    {t('trainingPage.fieldEmoji')}
                  </label>
                  <select
                    value={newEmoji}
                    onChange={e => setNewEmoji(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-sm md:text-base text-[var(--text-1)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition"
                  >
                    <option value="📖">{t('trainingPage.emojiBook')}</option>
                    <option value="💡">{t('trainingPage.emojiBulb')}</option>
                    <option value="🧠">{t('trainingPage.emojiBrain')}</option>
                    <option value="🚀">{t('trainingPage.emojiRocket')}</option>
                    <option value="🎯">{t('trainingPage.emojiTarget')}</option>
                    <option value="🤝">{t('trainingPage.emojiHandshake')}</option>
                    <option value="💎">{t('trainingPage.emojiDiamond')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] md:text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">
                    {t('trainingPage.fieldTags')}
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={e => setNewTags(e.target.value)}
                    placeholder={t('trainingPage.tagsPlaceholder')}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-sm md:text-base text-[var(--text-1)] outline-none focus:border-[#3730A3] dark:focus:border-[#a5b4fc] transition"
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
                  {t('trainingPage.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-[#3730A3] hover:bg-[#28227d] text-white px-5 py-2 md:py-2.5 text-sm md:text-base font-bold shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Geri Gönderiliyor...</span>
                    </>
                  ) : (
                    <span>{t('trainingPage.addButton')}</span>
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
