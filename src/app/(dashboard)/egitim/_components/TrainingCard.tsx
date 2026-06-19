'use client'

import { Check, CheckCircle2, ChevronDown, Circle, Clock, Copy, Pencil, Star, Trash2 } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { whatsappShareUrl } from '@/lib/utils/waLink'
import { SEVIYE_RENK, getTrainingCategoryStyles } from '../constants'
import { MODERATION_HIGHLIGHT_CLASS } from '@/lib/ui/moderationHighlight'
import type { TrainingTopic } from '../types'

type Props = {
  konu: TrainingTopic
  acik: boolean
  highlighted?: boolean
  isFav: boolean
  isRead: boolean
  copied: boolean
  onToggle: () => void
  onToggleFav: (e: React.MouseEvent) => void
  onToggleRead: (e: React.MouseEvent) => void
  onCopy: (e: React.MouseEvent) => void
  onDelete?: () => void
  onEdit?: () => void
}

export function TrainingCard({
  konu,
  acik,
  highlighted = false,
  isFav,
  isRead,
  copied,
  onToggle,
  onToggleFav,
  onToggleRead,
  onCopy,
  onDelete,
  onEdit,
}: Props) {
  const { t, lang } = useTranslation()
  const baslik = lang === 'en' && konu.baslikEn ? konu.baslikEn : konu.baslik
  const ozet = lang === 'en' && konu.ozetEn ? konu.ozetEn : konu.ozet
  const kategoriBaslik =
    lang === 'en' && konu.kategoriBaslikEn ? konu.kategoriBaslikEn : konu.kategoriBaslik
  const maddeler =
    lang === 'en' && konu.maddelerEn?.length ? konu.maddelerEn : konu.maddeler
  const { catTextColor, catBorderColorHover, catBorderColorActive, bulletStyle } =
    getTrainingCategoryStyles(konu.kategoriId)

  return (
    <li id={`konu-${konu.id}`}>
      <div
        className={`rounded-2xl border transition-all duration-200 ${
          highlighted
            ? MODERATION_HIGHLIGHT_CLASS
            : acik
            ? `${catBorderColorActive} bg-[var(--bg-card)] shadow-md`
            : `border-[var(--border)] bg-[var(--bg-card)] ${catBorderColorHover} hover:shadow-sm`
        }`}
      >
        <div className="flex w-full items-center gap-2 p-4 sm:gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <span className={`shrink-0 text-2xl leading-none transition-opacity ${isRead ? 'opacity-40' : ''}`}>
              {konu.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${catTextColor}`}>
                  {kategoriBaslik}
                </p>
                <span className={`rounded-full px-2 py-0.2 text-[8px] font-black uppercase tracking-wider shrink-0 ${SEVIYE_RENK[konu.seviye]}`}>
                  {konu.seviye}
                </span>
              </div>
              <p className={`text-base font-semibold leading-snug ${isRead ? 'text-[var(--text-3)] line-through' : 'text-[var(--text-1)]'}`}>
                {baslik}
              </p>
              <div className="mt-1 hidden items-center gap-2 md:flex">
                <div className="flex items-center gap-1 text-[11px] text-[var(--text-3)]">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>{konu.sure}</span>
                </div>
                <span className="text-[var(--text-3)] text-sm">·</span>
                <span className="text-[11px] text-[var(--text-3)] truncate block max-w-[200px] sm:max-w-none">{ozet}</span>
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-[var(--text-3)] transition-transform duration-200 ${acik ? 'rotate-180' : ''}`}
              strokeWidth={2}
            />
          </button>

          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={onToggleRead}
              title={isRead ? t('training.markAsUnread') : t('training.markAsRead')}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                isRead
                  ? 'text-emerald-600 dark:text-emerald-400 hover:scale-105'
                  : 'text-[var(--text-3)] hover:text-emerald-600 dark:hover:text-emerald-400 hover:scale-105'
              }`}
            >
              {isRead ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={onToggleFav}
              title={isFav ? t('training.removeFromFavorites') : t('training.addToFavorites')}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                isFav
                  ? 'bg-amber-500/10 text-amber-500 dark:bg-[#2962FF]/10 dark:text-[#448AFF] hover:scale-105'
                  : 'text-[var(--text-3)] hover:text-amber-500 dark:hover:text-[#448AFF] hover:scale-105'
              }`}
            >
              <Star className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {acik && (
          <div className="border-t border-[var(--border)] px-4 pb-4 pt-3 bg-[var(--bg-subtle)]/30 rounded-b-2xl animate-in fade-in duration-200">
            <ul className="space-y-2.5">
              {maddeler.map((madde, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${bulletStyle}`}>
                    {idx + 1}
                  </span>
                  <p className="text-base leading-relaxed text-[var(--text-2)] whitespace-pre-wrap">{madde}</p>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-[var(--border)] pt-3">
              {onEdit && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[#EEF2FF] hover:text-[#3730A3] transition-all cursor-pointer active:scale-95"
                  title={t('trainingPage.editContent') || 'Düzenle'}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 transition-all cursor-pointer active:scale-95"
                  title={t('trainingPage.deleteContent') || 'Sil'}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={onCopy}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 ${
                  copied
                    ? 'bg-[#E1F5EE] text-[#0F6E56] dark:bg-[#0d3d2e] dark:text-[#4ade80]'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[#EEF2FF] hover:text-[#3730A3]'
                }`}
                title={copied ? t('trainingPage.copied') : t('trainingPage.copyContent')}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>

              <a
                href={whatsappShareUrl(t('trainingPage.waShare', { title: baslik, body: maddeler.join('\n') }))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                title={t('trainingPage.sendViaWhatsApp')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E7FBF0] dark:bg-[#0d2e1a]/50 text-[#1a9e4f] dark:text-[#4ade80] transition-all hover:bg-[#d4f7e4] dark:hover:bg-[#0d2e1a] cursor-pointer active:scale-95"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.118 1.523 5.845L0 24l6.335-1.508A11.927 11.927 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.807 9.807 0 01-5.031-1.386l-.361-.214-3.761.896.953-3.651-.235-.374A9.778 9.778 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>
    </li>
  )
}
