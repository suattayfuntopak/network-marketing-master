'use client'

import { useState } from 'react'
import { X, Loader2, Film } from 'lucide-react'
import { toast } from 'sonner'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import {
  createTrainingVideoAction,
  updateTrainingVideoAction,
  type TrainingVideoAdmin,
  type VideoInput,
} from '@/app/(dashboard)/egitim/videoActions'

type Props = {
  /** null → yeni ekle; dolu → düzenle */
  editing: TrainingVideoAdmin | null
  onClose: () => void
  onSaved: () => void
}

const inputCls =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-1)] outline-none focus:border-[#534AB7] transition'
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
  useBodyScrollLock(true)

  const set = <K extends keyof VideoInput>(k: K, v: VideoInput[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  async function submit() {
    if (!form.youtubeUrlOrId.trim() || !form.titleTr.trim()) {
      toast.error('YouTube bağlantısı ve Başlık (TR) zorunlu.')
      return
    }
    setSaving(true)
    try {
      if (editing) await updateTrainingVideoAction(editing.id, form)
      else await createTrainingVideoAction(form)
      toast.success(editing ? 'Video güncellendi.' : 'Video eklendi.')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'İşlem başarısız.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`fixed inset-0 ${Z.confirm} flex items-center justify-center bg-black/50 backdrop-blur-sm p-4`}>
      <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl bg-[var(--bg-card)] shadow-2xl border border-[var(--border)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-[var(--text-1)]">
            <Film className="h-4 w-4 text-brand" />
            {editing ? 'Videoyu Düzenle' : 'Yeni Video Ekle'}
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
            <label className={labelCls}>YouTube Bağlantısı veya Video ID</label>
            <input
              className={inputCls}
              value={form.youtubeUrlOrId}
              onChange={e => set('youtubeUrlOrId', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... veya 11 haneli ID"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>Başlık (TR) *</label>
              <input className={inputCls} value={form.titleTr} onChange={e => set('titleTr', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Başlık (EN)</label>
              <input className={inputCls} value={form.titleEn} onChange={e => set('titleEn', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>Açıklama (TR)</label>
              <textarea className={`${inputCls} min-h-[64px]`} value={form.descriptionTr} onChange={e => set('descriptionTr', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Açıklama (EN)</label>
              <textarea className={`${inputCls} min-h-[64px]`} value={form.descriptionEn} onChange={e => set('descriptionEn', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>Kategori (TR)</label>
              <input className={inputCls} value={form.categoryTr} onChange={e => set('categoryTr', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Kategori (EN)</label>
              <input className={inputCls} value={form.categoryEn} onChange={e => set('categoryEn', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>Süre (dk)</label>
              <input type="number" min={1} className={inputCls} value={form.durationMin} onChange={e => set('durationMin', Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Sıra</label>
              <input type="number" className={inputCls} value={form.sortOrder} onChange={e => set('sortOrder', Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>İlgili konu ID</label>
              <input className={inputCls} value={form.relatedTrainingId ?? ''} onChange={e => set('relatedTrainingId', e.target.value)} placeholder="z1, i1…" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text-2)] hover:bg-[var(--bg-subtle)] transition"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3730A3] hover:bg-[#28227d] px-4 py-2 text-sm font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? 'Kaydet' : 'Ekle'}
          </button>
        </div>
      </div>
    </div>
  )
}
