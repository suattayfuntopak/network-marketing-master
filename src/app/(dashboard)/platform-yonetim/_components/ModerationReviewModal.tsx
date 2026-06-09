'use client'

import { useState, useTransition } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Z } from '@/lib/ui/zIndex'
import { useTranslation } from '@/providers/LanguageProvider'
import { defaultRejectReason } from '@/lib/domain/moderationDefaults'
import {
  approveRequestAction,
  buildBilingualRejectReasonAction,
  rejectRequestAction,
  type ModerationRequestItem,
} from '@/app/(dashboard)/actions/moderation'
import { RejectModerationDialog } from './RejectModerationDialog'

interface Props {
  request: ModerationRequestItem
  onClose: () => void
  onSuccess: () => void
}

export function ModerationReviewModal({ request, onClose, onSuccess }: Props) {
  const { lang, t } = useTranslation()
  const uiLang = lang === 'en' ? 'en' : 'tr'
  type DVal = Record<string, string> | string | string[] | undefined
  const d = request.data as unknown as Record<string, DVal>
  const isTraining = request.contentType === 'training'

  function ds(v: DVal, fallback = ''): string {
    if (v === undefined || v === null) return fallback
    if (typeof v === 'string') return v || fallback
    if (Array.isArray(v)) return v.join(', ')
    return v.tr ?? v.en ?? Object.values(v)[0] ?? fallback
  }

  const [editTitle, setEditTitle] = useState<string>(() =>
    isTraining ? ds(d.baslik) : ds(d.soru)
  )
  const [editCategory, setEditCategory] = useState<string>(() =>
    isTraining ? ds(d.kategoriBaslik, 'Zihniyet') : ds(d.kategori, 'Genel')
  )
  const [editOzet, setEditOzet] = useState<string>(isTraining ? ds(d.ozet) : '')
  const [editIcerik, setEditIcerik] = useState<string>(
    isTraining && Array.isArray(d.maddeler) ? (d.maddeler as string[]).join('\n') : ''
  )
  const [editKisaCevap, setEditKisaCevap] = useState<string>(!isTraining ? ds(d.kisaCevap) : '')
  const [editDetayliCevap, setEditDetayliCevap] = useState<string>(!isTraining ? ds(d.detayliCevap) : '')
  const [editYaklasim, setEditYaklasim] = useState<string>(!isTraining ? ds(d.yaklasim) : '')
  const [editOrnekDiyalog, setEditOrnekDiyalog] = useState<string>(!isTraining ? ds(d.ornekDiyalog) : '')
  const [editEmoji, setEditEmoji] = useState<string>(ds(d.emoji, isTraining ? '📖' : '🛡️'))
  const [editTags, setEditTags] = useState<string>(Array.isArray(d.tags) ? (d.tags as string[]).join(', ') : '')

  const [isModerating, startModerationTransition] = useTransition()
  const [rejectOpen, setRejectOpen] = useState(false)

  function handleApproveSubmit(e: React.FormEvent) {
    e.preventDefault()

    startModerationTransition(async () => {
      try {
        let edited: Record<string, unknown> = {}

        if (isTraining) {
          edited = {
            ...d,
            baslik: editTitle,
            ozet: editOzet || editIcerik.slice(0, 100) + '...',
            maddeler: editIcerik.split('\n').map(l => l.trim()).filter(Boolean),
            kategoriBaslik: editCategory,
            kategoriId: editCategory.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-'),
            emoji: editEmoji,
            tags: editTags.split(',').map(tg => tg.trim()).filter(Boolean),
          }
        } else {
          edited = {
            ...d,
            kategori: { tr: editCategory, en: editCategory },
            soru: { tr: editTitle, en: editTitle },
            emoji: editEmoji,
            kisaCevap: editKisaCevap,
            detayliCevap: editDetayliCevap,
            yaklasim: editYaklasim,
            ornekDiyalog: editOrnekDiyalog,
            tags: editTags.split(',').map(tg => tg.trim()).filter(Boolean),
          }
        }

        const res = await approveRequestAction(request.id, request.contentType, edited as unknown as import('@/types/database.types').Json)
        if (res.success) {
          toast.success(t('moderationReview.approvedToast'))
          onClose()
          onSuccess()
        }
      } catch (err: unknown) {
        toast.error((err instanceof Error ? err.message : '') || t('moderationReview.approveFailed'))
      }
    })
  }

  function confirmReject(reason: string) {
    setRejectOpen(false)

    startModerationTransition(async () => {
      try {
        const bilingual = await buildBilingualRejectReasonAction(reason, uiLang)
        const res = await rejectRequestAction(request.id, request.contentType, bilingual)
        if (res.success) {
          toast.success(t('moderationReview.rejectedToast'))
          onClose()
          onSuccess()
        }
      } catch (err: unknown) {
        toast.error((err instanceof Error ? err.message : '') || t('moderationReview.rejectFailed'))
      }
    })
  }

  const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-1)] outline-none focus:border-brand transition'
  const textareaClass = (accent = '#534AB7') =>
    `w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-sm text-[var(--text-1)] outline-none focus:border-[${accent}] transition resize-none`

  return (
    <>
      <div
        className={`fixed inset-0 ${Z.confirmBackdrop} bg-black/60 backdrop-blur-sm`}
        onClick={onClose}
      />
      <div className={`fixed left-1/2 top-1/2 ${Z.confirm} w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] shadow-2xl border border-[var(--border)] overflow-hidden my-auto max-h-[85vh] overflow-y-auto`}>
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-amber-500" />

        <form onSubmit={handleApproveSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[var(--text-1)]">{t('moderationReview.title')}</h3>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-xl bg-[var(--bg-subtle)] p-3 text-sm leading-relaxed text-[var(--text-2)] font-semibold border border-[var(--border)] space-y-0.5">
            <div><strong>{t('moderationReview.submitter')}</strong> {request.userName} ({request.userEmail})</div>
            <div><strong>{t('moderationReview.type')}</strong> {isTraining ? t('moderationReview.typeTraining') : t('moderationReview.typeObjection')}</div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[var(--text-1)]">
              {isTraining ? t('moderationReview.labelTitleTraining') : t('moderationReview.labelTitleObjection')}
            </label>
            <input type="text" required value={editTitle} onChange={e => setEditTitle(e.target.value)} className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[var(--text-1)]">{t('moderationReview.labelCategory')}</label>
            <input type="text" required value={editCategory} onChange={e => setEditCategory(e.target.value)} className={inputClass} />
          </div>

          {isTraining ? (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[var(--text-1)]">{t('moderationReview.labelSummary')}</label>
                <input type="text" required value={editOzet} onChange={e => setEditOzet(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[var(--text-1)]">{t('moderationReview.labelContentItems')}</label>
                <textarea rows={4} required value={editIcerik} onChange={e => setEditIcerik(e.target.value)} className={textareaClass()} />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[var(--text-1)]">{t('moderationReview.labelShortAnswer')}</label>
                <textarea rows={2} value={editKisaCevap} onChange={e => setEditKisaCevap(e.target.value)} className={textareaClass('#9B1D47')} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[var(--text-1)]">{t('moderationReview.labelDetailedAnswer')}</label>
                <textarea rows={3} value={editDetayliCevap} onChange={e => setEditDetayliCevap(e.target.value)} className={textareaClass('#9B1D47')} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[var(--text-1)]">{t('moderationReview.labelApproach')}</label>
                <textarea rows={2} value={editYaklasim} onChange={e => setEditYaklasim(e.target.value)} className={textareaClass('#9B1D47')} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[var(--text-1)]">{t('moderationReview.labelExampleDialog')}</label>
                <textarea rows={2} value={editOrnekDiyalog} onChange={e => setEditOrnekDiyalog(e.target.value)} className={textareaClass('#9B1D47')} />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[var(--text-1)]">{t('moderationReview.labelEmoji')}</label>
              <input type="text" required value={editEmoji} onChange={e => setEditEmoji(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[var(--text-1)]">{t('moderationReview.labelTags')}</label>
              <input type="text" value={editTags} onChange={e => setEditTags(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setRejectOpen(true)}
              disabled={isModerating}
              className="flex-1 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-500 py-3 text-sm font-bold transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {t('moderationReview.rejectDelete')}
            </button>
            <button
              type="submit"
              disabled={isModerating}
              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-sm font-bold transition active:scale-95 cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isModerating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /><span>{t('moderationReview.approving')}</span></>
              ) : (
                <span>{t('moderationReview.approvePublish')}</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {rejectOpen && (
        <RejectModerationDialog
          defaultReason={defaultRejectReason(uiLang)}
          onConfirm={confirmReject}
          onCancel={() => setRejectOpen(false)}
        />
      )}
    </>
  )
}
