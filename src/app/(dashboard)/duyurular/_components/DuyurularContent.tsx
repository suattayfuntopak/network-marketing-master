'use client'

import { useState } from 'react'
import { Megaphone, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/providers/LanguageProvider'
import { HubPageShell } from '@/components/hub/HubPageShell'
import { Skeleton } from '@/components/ui/Skeleton'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useTeamAnnouncements } from '@/hooks/useTeamAnnouncements'
import { queryKeys } from '@/lib/query/keys'
import { whatsappShareUrl } from '@/lib/utils/waLink'
import { addTeamAnnouncementAction, deleteTeamAnnouncementAction } from '../actions'
import type { AnnotatedAnnouncement } from '@/lib/domain/teamAnnouncements'

const inputClass =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-1)] outline-none focus:border-brand'

export function DuyurularContent() {
  const { t, lang } = useTranslation()
  const qc = useQueryClient()
  const { data: items = [], isLoading } = useTeamAnnouncements()

  const [composing, setComposing] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.teamAnnouncements() })

  async function publish() {
    if (!title.trim() || !body.trim() || busy) return
    setBusy(true)
    try {
      await addTeamAnnouncementAction({ title, body })
      toast.success(t('duyurular.publishedToast'))
      setTitle(''); setBody(''); setComposing(false)
      await invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function remove(a: AnnotatedAnnouncement) {
    if (!confirm(t('duyurular.deleteConfirm'))) return
    try {
      await deleteTeamAnnouncementAction(a.id)
      toast.success(t('duyurular.deletedToast'))
      await invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  function authorLabel(a: AnnotatedAnnouncement): string {
    if (a.isMine) return t('duyurular.you')
    return a.author_name || t('duyurular.leader')
  }

  function shareOnWhatsapp(a: AnnotatedAnnouncement) {
    window.open(whatsappShareUrl(`*${a.title}*\n\n${a.body}`), '_blank')
  }

  return (
    <HubPageShell
      title={t('duyurular.title')}
      icon={Megaphone}
      iconClassName="bg-gradient-to-br from-rose-500 to-pink-500"
      backHref="/pano"
      showRefresh={false}
    >
      {/* Duyuru yaz */}
      {composing ? (
        <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
          <input className={inputClass} placeholder={t('duyurular.titlePlaceholder')} value={title} onChange={e => setTitle(e.target.value)} maxLength={120} autoFocus />
          <textarea className={`${inputClass} resize-none`} rows={3} placeholder={t('duyurular.bodyPlaceholder')} value={body} onChange={e => setBody(e.target.value)} maxLength={1000} />
          <div className="flex gap-2">
            <button type="button" disabled={busy || !title.trim() || !body.trim()} onClick={publish} className="flex-1 rounded-lg bg-brand px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
              {t('duyurular.publish')}
            </button>
            <button type="button" onClick={() => setComposing(false)} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-2)]">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setComposing(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-brand/40 bg-brand-subtle/20 px-3 py-3 text-sm font-bold text-brand transition hover:bg-brand-subtle/40">
          <Plus className="h-4 w-4" />
          {t('duyurular.composeCta')}
        </button>
      )}

      {/* Liste */}
      <div className="mt-4 space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center text-sm text-[var(--text-3)]">
            {t('duyurular.empty')}
          </p>
        ) : (
          items.map(a => (
            <div key={a.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-sm">
              <div className="flex items-start gap-2.5">
                <PersonAvatar name={authorLabel(a)} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-[var(--text-1)]">{a.title}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => shareOnWhatsapp(a)} className="rounded-lg p-1 text-[var(--text-3)] transition hover:text-[#25D366]" aria-label={t('duyurular.share')}>
                        <WhatsAppIcon className="h-3.5 w-3.5" />
                      </button>
                      {a.isMine && (
                        <button type="button" onClick={() => remove(a)} className="rounded-lg p-1 text-[var(--text-3)] transition hover:text-rose-500" aria-label={t('common.delete')}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-3)]">
                    <span className={a.isMine ? 'font-bold text-brand' : 'font-semibold'}>{authorLabel(a)}</span>
                    <span>·</span>
                    <span>{new Date(a.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR')}</span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-2)]">{a.body}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </HubPageShell>
  )
}
