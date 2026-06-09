'use client'

import { useState } from 'react'
import { X, Loader2, Film, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Z } from '@/lib/ui/zIndex'
import { useTranslation } from '@/providers/LanguageProvider'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { RelatedTopicPicker, resolveTopicLabel } from './RelatedTopicPicker'
import {
  createTrainingVideoAction,
  updateTrainingVideoAction,
  type TrainingVideoAdmin,
  type VideoInput,
} from '@/app/(dashboard)/egitim/videoActions'
import { useWorkspace } from '@/hooks/useWorkspace'
import { SympatheticPopup } from '@/components/ui/SympatheticPopup'

type Props = {
  /** null → yeni ekle; dolu → düzenle */
  editing: TrainingVideoAdmin | null
  onClose: () => void
  onSaved: () => void
}

const inputCls =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-1)] outline-none focus:border-brand transition'
const labelCls = 'text-xs font-bold text-[var(--text-2)]'

export function VideoEditModal({ editing, onClose, onSaved }: Props) {
  const [form, setForm] = useState<VideoInput>({
    youtubeUrlOrId: editing?.youtubeId ?? '',
    titleTr: editing?.titleTr ?? '',
    titleEn: editing?.titleEn ?? '',
    descriptionTr: editing?.descriptionTr ?? '',
    descriptionEn: editing?.descriptionEn ?? '',
    durationMin: editing?.durationMin ?? 10,
    categoryTr: editing?.categoryTr ?? '',
    categoryEn: editing?.categoryEn ?? '',
    relatedTrainingId: editing?.relatedTrainingId ?? '',
    sortOrder: editing?.sortOrder ?? 999,
  })
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [showSympathetic, setShowSympathetic] = useState(false)
  const { lang, t } = useTranslation()
  const { data: ws } = useWorkspace()
  useBodyScrollLock(true)

  const set = <K extends keyof VideoInput>(k: K, v: VideoInput[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  async function submit() {
    if (!form.youtubeUrlOrId.trim() || !form.titleTr.trim()) {
      toast.error(t('videoTraining.requiredFieldsError'))
      return
    }
    if (!ws?.workspaceId) return
    setSaving(true)
    try {
      if (editing) {
        await updateTrainingVideoAction(editing.id, form)
        toast.success(t('videoTraining.videoUpdated'))
        onSaved()
        onClose()
      } else {
        const res = await createTrainingVideoAction(ws.workspaceId, form)
        if (res.isApproved) {
          toast.success(t('videoTraining.videoAdded'))
          onSaved()
          onClose()
        } else {
          onClose()
          setShowSympathetic(true)
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('videoTraining.operationFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`fixed inset-0 ${Z.confirm} flex items-center justify-center bg-black/50 backdrop-blur-sm p-4`}>
      <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl bg-[var(--bg-card)] shadow-2xl border border-[var(--border)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-[var(--text-1)]">
            <Film className="h-4 w-4 text-brand-readable" />
            {editing ? t('videoTraining.editVideo') : t('videoTraining.addVideo')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div className="space-y-1">
            <label className={labelCls}>{t('videoTraining.youtubeLabel')}</label>
            <input
              className={inputCls}
              value={form.youtubeUrlOrId}
              onChange={e => set('youtubeUrlOrId', e.target.value)}
              placeholder={t('videoTraining.youtubePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>{t('videoTraining.titleTrLabel')}</label>
              <input className={inputCls} value={form.titleTr} onChange={e => set('titleTr', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>{t('videoTraining.titleEnLabel')}</label>
              <input className={inputCls} value={form.titleEn} onChange={e => set('titleEn', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>{t('videoTraining.descTrLabel')}</label>
              <textarea className={`${inputCls} min-h-[64px]`} value={form.descriptionTr} onChange={e => set('descriptionTr', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>{t('videoTraining.descEnLabel')}</label>
              <textarea className={`${inputCls} min-h-[64px]`} value={form.descriptionEn} onChange={e => set('descriptionEn', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>{t('videoTraining.categoryTrLabel')}</label>
              <input className={inputCls} value={form.categoryTr} onChange={e => set('categoryTr', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>{t('videoTraining.categoryEnLabel')}</label>
              <input className={inputCls} value={form.categoryEn} onChange={e => set('categoryEn', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>{t('videoTraining.durationLabel')}</label>
              <input type="number" min={1} className={inputCls} value={form.durationMin} onChange={e => set('durationMin', Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>{t('videoTraining.sortOrderLabel')}</label>
              <input type="number" className={inputCls} value={form.sortOrder} onChange={e => set('sortOrder', Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>{t('videoTraining.relatedTopic')}</label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className={`${inputCls} flex flex-1 items-center justify-between gap-1 text-left`}
                >
                  <span className={`line-clamp-1 ${form.relatedTrainingId ? 'text-[var(--text-1)]' : 'text-[var(--text-3)]'}`}>
                    {resolveTopicLabel(form.relatedTrainingId ?? null, lang) ?? t('videoTraining.selectPlaceholder')}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                </button>
                {form.relatedTrainingId && (
                  <button
                    type="button"
                    onClick={() => set('relatedTrainingId', '')}
                    title={t('videoTraining.clearSelection')}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-3)] transition hover:bg-red-500/10 hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text-2)] hover:bg-[var(--bg-subtle)] transition"
          >
            {t('videoTraining.cancel')}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3730A3] hover:bg-[#28227d] px-4 py-2 text-sm font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? t('videoTraining.save') : t('videoTraining.add')}
          </button>
        </div>
      </div>

      {pickerOpen && (
        <RelatedTopicPicker
          current={form.relatedTrainingId ?? null}
          onSelect={v => set('relatedTrainingId', v ?? '')}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <SympatheticPopup open={showSympathetic} onClose={() => setShowSympathetic(false)} />
    </div>
  )
}
