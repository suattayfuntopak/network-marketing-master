'use client'

import { ShieldCheck, Film, BookOpen, MessageSquare, Trash2 } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ModerationRequestItem } from '@/app/(dashboard)/actions/moderation'

type Props = {
  pendingRequests: ModerationRequestItem[]
  moderationLoading: boolean
  onOpenReview: (req: ModerationRequestItem) => void
  onQuickApprove: (req: ModerationRequestItem) => void
  onRejectRequest: (req: ModerationRequestItem) => void
}

export function PlatformModerationDesk({
  pendingRequests,
  moderationLoading,
  onOpenReview,
  onQuickApprove,
  onRejectRequest,
}: Props) {
  const { t } = useTranslation()

  return (
    <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <h2 className="min-w-0 text-sm font-bold text-[var(--text-1)] sm:text-base whitespace-nowrap">
          {t('platformPage.moderationDeskTitle')}
        </h2>
        <span className="text-[10px] text-[var(--text-3)] font-semibold ml-auto hidden sm:block">
          {t('platformPage.moderationDeskHint')}
        </span>
      </div>

      {moderationLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] py-8 text-center text-sm text-[var(--text-3)] italic">
          {t('platformPage.moderationDeskEmpty')}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pendingRequests.map(req => {
            const dateStr = new Date(req.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
            const isTraining = req.contentType === 'training'
            const isVideo = req.contentType === 'video'
            const rd = req.data as unknown as Record<string, Record<string, string> | string | string[] | number | undefined>
            const title = isVideo
              ? (rd.titleTr ?? 'İsimsiz Video')
              : isTraining
                ? (rd.baslik ?? 'İsimsiz İçerik')
                : ((rd.soru as Record<string, string> | undefined)?.tr ?? rd.soru ?? 'İsimsiz İtiraz')
            const category = isVideo
              ? (rd.categoryTr ?? 'Genel')
              : isTraining
                ? (rd.kategoriBaslik ?? 'Zihniyet')
                : ((rd.kategori as Record<string, string> | undefined)?.tr ?? rd.kategori ?? 'Genel')
            const preview = isVideo
              ? (rd.descriptionTr ?? 'Açıklama bulunmuyor.')
              : isTraining
                ? (rd.ozet ?? 'Özet bulunmuyor.')
                : (rd.kisaCevap ?? 'Kısa cevap bulunmuyor.')

            return (
              <div key={req.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-400 to-amber-500" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                      isVideo
                        ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        : isTraining
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}>
                      {isVideo ? <Film className="h-2.5 w-2.5" /> : isTraining ? <BookOpen className="h-2.5 w-2.5" /> : <MessageSquare className="h-2.5 w-2.5" />}
                      {isVideo ? t('moderationReview.typeVideo') : isTraining ? t('moderationReview.typeTraining') : t('moderationReview.typeObjection')}
                    </span>
                    <span className="text-[9px] text-[var(--text-3)] font-bold">{dateStr}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-1)] line-clamp-1 flex items-center gap-1">
                      <span className="text-base shrink-0">{String(rd.emoji ?? '')}</span>
                      {String(title ?? '')}
                    </h3>
                    <p className="text-[10px] text-[var(--text-3)] font-semibold mt-0.5 truncate">Kategori: {String(category ?? '')}</p>
                  </div>

                  <p className="text-[11px] text-[var(--text-2)] line-clamp-2 leading-relaxed bg-[var(--bg-subtle)] p-2 rounded-lg border border-[var(--border)] font-medium">
                    {String(preview ?? '')}
                  </p>

                  <div className="text-[10px] text-[var(--text-3)] font-semibold space-y-0.5 border-t border-[var(--border)] pt-2">
                    <div className="truncate"><strong>Gönderen:</strong> {req.userName || '—'}</div>
                    <div className="truncate"><strong>E-posta:</strong> {req.userEmail || '—'}</div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
                  <button
                    onClick={() => onOpenReview(req)}
                    className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] hover:bg-[var(--border)] text-[var(--text-2)] py-2 text-[10px] font-bold transition active:scale-95 cursor-pointer"
                  >
                    İncele & Düzenle
                  </button>
                  <button
                    onClick={() => onQuickApprove(req)}
                    className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-[10px] font-bold transition active:scale-95 cursor-pointer shadow-sm"
                  >
                    Hızlı Onayla
                  </button>
                  <button
                    onClick={() => onRejectRequest(req)}
                    className="rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 p-2 text-[10px] font-bold transition active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                    title="Reddet ve Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
