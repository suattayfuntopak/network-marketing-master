'use client'

import { useRef, useCallback, useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Link2,
  Plus,
  Presentation,
  Trash2,
  Pencil,
  Check,
  Star,
  X,
} from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { usePresentationMaterials } from '@/hooks/usePresentationMaterials'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  MAX_PRESENTATION_MATERIALS,
  defaultWhatsappTemplate,
  type PresentationMaterial,
} from '@/lib/domain/presentationMaterials'
import {
  deletePresentationMaterialAction,
  savePresentationMaterialAction,
  setDefaultPresentationMaterialAction,
} from '../actions'

type FormState = {
  title: string
  url: string
  whatsappTemplate: string
  isDefault: boolean
}

const emptyForm = (lang: 'tr' | 'en'): FormState => ({
  title: '',
  url: '',
  whatsappTemplate: defaultWhatsappTemplate(lang),
  isDefault: false,
})

export function PresentationMaterialsContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { t, lang } = useTranslation()
  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { data: materials = [], isLoading } = usePresentationMaterials(ws?.workspaceId, {
    isSuperAdmin: ws?.isSuperAdmin,
    lang,
  })

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(() => emptyForm(lang))
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PresentationMaterial | null>(null)
  const [deleting, setDeleting] = useState(false)
  const templateRef = useRef<HTMLTextAreaElement>(null)
  const pendingCursorRef = useRef<number | null>(null)

  const canAddMore = materials.length < MAX_PRESENTATION_MATERIALS

  const editingMaterial = useMemo(
    () => materials.find(m => m.id === editingId) ?? null,
    [materials, editingId]
  )

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['presentation-materials', ws?.workspaceId] })
  }, [queryClient, ws?.workspaceId])

  function openCreateForm() {
    setEditingId(null)
    setForm({
      ...emptyForm(lang),
      isDefault: materials.length === 0,
    })
    setFormOpen(true)
  }

  function openEditForm(material: PresentationMaterial) {
    setEditingId(material.id)
    setForm({
      title: material.title,
      url: material.url,
      whatsappTemplate: material.whatsapp_template,
      isDefault: material.is_default,
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm(lang))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!ws?.workspaceId || saving) return
    setSaving(true)
    try {
      const result = await savePresentationMaterialAction({
        workspaceId: ws.workspaceId,
        id: editingId ?? undefined,
        title: form.title,
        url: form.url,
        whatsappTemplate: form.whatsappTemplate,
        isDefault: form.isDefault,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(t('presentationMaterialsPage.saved'))
      invalidate()
      closeForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  async function handleSetDefault(materialId: string) {
    if (!ws?.workspaceId) return
    const result = await setDefaultPresentationMaterialAction(ws.workspaceId, materialId)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(t('presentationMaterialsPage.defaultSet'))
    invalidate()
  }

  async function handleDeleteConfirm() {
    if (!ws?.workspaceId || !deleteTarget || deleting) return
    setDeleting(true)
    try {
      const result = await deletePresentationMaterialAction(ws.workspaceId, deleteTarget.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(t('presentationMaterialsPage.deleted'))
      invalidate()
      setDeleteTarget(null)
      if (editingId === deleteTarget.id) closeForm()
    } finally {
      setDeleting(false)
    }
  }

  const insertToken = useCallback((token: string) => {
    const el = templateRef.current
    setForm(f => {
      const text = f.whatsappTemplate
      const start = el?.selectionStart ?? text.length
      const end = el?.selectionEnd ?? start
      pendingCursorRef.current = start + token.length
      return { ...f, whatsappTemplate: text.slice(0, start) + token + text.slice(end) }
    })
  }, [])

  useEffect(() => {
    const pos = pendingCursorRef.current
    if (pos == null || !templateRef.current) return
    pendingCursorRef.current = null
    const el = templateRef.current
    el.focus()
    el.setSelectionRange(pos, pos)
  }, [form.whatsappTemplate])

  const previewMessage = useMemo(() => {
    const sampleName = 'Ayşe'
    const sampleSender = ws?.fullName ?? t('pipelinePage.senderPlaceholder')
    const sampleUrl = form.url.trim() || 'https://ornek-sunum-linki.com'
    return form.whatsappTemplate
      .replace(/\{name\}/g, sampleName)
      .replace(/\{url\}/g, sampleUrl)
      .replace(/\{sender\}/g, sampleSender)
  }, [form.whatsappTemplate, form.url, ws?.fullName, t])

  if (wsLoading || isLoading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
        <div className="space-y-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => router.push('/pipeline')}
          className="inline-flex items-center gap-1.5 text-base font-semibold text-brand-readable hover:underline transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('presentationMaterialsPage.backToPipeline')}
        </button>

        <header className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-subtle dark:bg-brand/20">
            <Presentation className="h-5 w-5 text-brand" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[var(--text-1)]">
              {t('presentationMaterialsPage.title')}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-3)]">
              {t('presentationMaterialsPage.subtitle', { max: MAX_PRESENTATION_MATERIALS })}
            </p>
          </div>
        </header>

        <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/8 to-transparent p-4 space-y-3">
          <p className="text-base font-bold text-[var(--text-1)]">
            {t('presentationMaterialsPage.templateHintTitle')}
          </p>
          <p className="text-sm leading-relaxed text-[var(--text-2)]">
            {t('presentationMaterialsPage.templateHintSimple')}
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { token: '{name}', label: t('presentationMaterialsPage.chipName'), example: 'Ayşe' },
              { token: '{url}', label: t('presentationMaterialsPage.chipLink'), example: t('presentationMaterialsPage.chipLinkExample') },
              { token: '{sender}', label: t('presentationMaterialsPage.chipYou'), example: ws?.fullName?.split(' ')[0] ?? 'Suat' },
            ].map(chip => (
              <div
                key={chip.token}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-center"
              >
                <p className="text-xs font-bold text-brand-readable">{chip.label}</p>
                <p className="mt-0.5 text-xs text-[var(--text-3)]">
                  {t('presentationMaterialsPage.chipExample', { example: chip.example })}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--text-3)] leading-relaxed">
            {t('presentationMaterialsPage.templateHintFooter')}
          </p>
        </div>

        {materials.length === 0 && !formOpen && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] py-12 px-6 text-center">
            <p className="text-base font-semibold text-[var(--text-1)]">
              {t('presentationMaterialsPage.emptyTitle')}
            </p>
            <p className="mt-2 text-sm text-[var(--text-3)]">{t('presentationMaterialsPage.emptyDesc')}</p>
          </div>
        )}

        {materials.length > 0 && (
          <ul className="space-y-3">
            {materials.map(material => (
              <li
                key={material.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-[var(--text-1)] truncate">{material.title}</h2>
                      {material.is_default && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 text-xs font-black uppercase text-amber-800 dark:text-amber-300">
                          <Star className="h-3 w-3 fill-current" />
                          {t('presentationMaterialsPage.defaultBadge')}
                        </span>
                      )}
                    </div>
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-sm text-brand hover:underline truncate max-w-full"
                    >
                      <Link2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{material.url}</span>
                    </a>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!material.is_default && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(material.id)}
                        className="rounded-lg p-2 text-[var(--text-3)] hover:bg-[var(--bg-subtle)] hover:text-amber-600 transition"
                        title={t('presentationMaterialsPage.setDefault')}
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditForm(material)}
                      className="rounded-lg p-2 text-[var(--text-3)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)] transition"
                      title={t('common.edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(material)}
                      className="rounded-lg p-2 text-[var(--text-3)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition"
                      title={t('common.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {formOpen ? (
          <form
            onSubmit={handleSave}
            className="rounded-2xl border border-brand/30 bg-[var(--bg-card)] p-5 space-y-4 shadow-md"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text-1)]">
                {editingMaterial
                  ? t('presentationMaterialsPage.editTitle')
                  : t('presentationMaterialsPage.addTitle')}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-full p-1.5 text-[var(--text-3)] hover:bg-[var(--bg-subtle)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-[var(--text-2)]">
                {t('presentationMaterialsPage.fieldTitle')}
              </span>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                maxLength={120}
                required
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--text-1)] outline-none focus:border-brand focus:ring-2 focus:ring-[#534AB7]/15"
                placeholder={t('presentationMaterialsPage.fieldTitlePlaceholder')}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-[var(--text-2)]">
                {t('presentationMaterialsPage.fieldUrl')}
              </span>
              <input
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                type="url"
                required
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--text-1)] outline-none focus:border-brand focus:ring-2 focus:ring-[#534AB7]/15"
                placeholder="https://"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-[var(--text-2)]">
                {t('presentationMaterialsPage.fieldTemplate')}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => insertToken('{name}')}
                  className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold text-brand hover:bg-brand/15 transition"
                >
                  + {t('presentationMaterialsPage.chipName')}
                </button>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => insertToken('{url}')}
                  className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15 transition"
                >
                  + {t('presentationMaterialsPage.chipLink')}
                </button>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => insertToken('{sender}')}
                  className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-500/15 transition"
                >
                  + {t('presentationMaterialsPage.chipYou')}
                </button>
              </div>
              <textarea
                ref={templateRef}
                value={form.whatsappTemplate}
                onChange={e => setForm(f => ({ ...f, whatsappTemplate: e.target.value }))}
                rows={5}
                maxLength={2000}
                required
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--text-1)] outline-none focus:border-brand focus:ring-2 focus:ring-[#534AB7]/15 resize-y min-h-[120px]"
              />
              <div className="rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] px-3 py-2.5 select-none">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-3)] mb-1">
                  {t('presentationMaterialsPage.livePreview')}
                </p>
                <p className="text-sm leading-relaxed text-[var(--text-2)] whitespace-pre-wrap">{previewMessage}</p>
              </div>
            </label>

            <label className="flex items-center gap-2 text-sm text-[var(--text-2)] cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                className="rounded border-[var(--border)]"
              />
              {t('presentationMaterialsPage.makeDefault')}
            </label>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-accent px-4 py-2.5 text-base font-bold text-white shadow-md hover:opacity-95 disabled:opacity-60 transition"
              >
                <Check className="h-4 w-4" />
                {saving ? t('common.loading') : t('common.save')}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-base font-semibold text-[var(--text-2)] hover:bg-[var(--bg-subtle)] transition"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        ) : (
          canAddMore && (
            <button
              type="button"
              onClick={openCreateForm}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-brand/40 bg-brand/5 px-4 py-4 text-base font-bold text-brand-readable hover:bg-brand/10 transition"
            >
              <Plus className="h-4 w-4" />
              {t('presentationMaterialsPage.addButton')}
            </button>
          )
        )}

        {!canAddMore && !formOpen && (
          <p className="text-center text-sm text-[var(--text-3)]">
            {t('presentationMaterialsPage.limitReached', { max: MAX_PRESENTATION_MATERIALS })}
          </p>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDeleteModal
          message={t('presentationMaterialsPage.deleteMessage', { title: deleteTarget.title })}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </main>
  )
}
