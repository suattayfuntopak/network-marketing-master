'use client'

import { Check, CheckCircle2, ChevronDown, Circle, Copy, Pencil, Star, Trash2 } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { WhatsAppShareButton } from '@/components/ui/WhatsAppShareButton'
import { whatsappShareUrl } from '@/lib/utils/waLink'
import type { Itiraz } from '../types'

function buildCopyValue(
  cevapDisplay: string,
  hasStructuredCevap: boolean,
  kisaCevap: string | undefined,
  detayliCevap: string | undefined,
  ornekDiyalog: string | undefined,
  labels: { short: string; detailed: string; dialog: string },
): string {
  const parts: string[] = []
  if (hasStructuredCevap && cevapDisplay) parts.push(cevapDisplay)
  else if (kisaCevap) parts.push(`${labels.short}:\n${kisaCevap}`)
  if (detayliCevap) parts.push(`${labels.detailed}:\n${detayliCevap}`)
  if (ornekDiyalog) parts.push(`${labels.dialog}:\n${ornekDiyalog}`)
  return parts.join('\n\n').trim()
}

type Props = {
  itiraz: Itiraz
  acik: boolean
  isFav: boolean
  isRead: boolean
  copied: boolean
  isCustom: boolean
  onToggle: () => void
  onToggleFav: (e: React.MouseEvent) => void
  onToggleRead: (e: React.MouseEvent) => void
  onCopy: (value: string, e: React.MouseEvent) => void
  onDelete: () => void
  onEdit?: () => void
}

export function ItirazCard({
  itiraz,
  acik,
  isFav,
  isRead,
  copied,
  isCustom,
  onToggle,
  onToggleFav,
  onToggleRead,
  onCopy,
  onDelete,
  onEdit,
}: Props) {
  const { lang, t } = useTranslation()
  const soru = lang === 'en' ? itiraz.soru.en : itiraz.soru.tr
  const cevap = lang === 'en' ? itiraz.cevap?.en ?? '' : itiraz.cevap?.tr ?? ''
  const kategori = lang === 'en' ? itiraz.kategori.en : itiraz.kategori.tr
  const kisaCevap = lang === 'en' && itiraz.kisaCevapEn ? itiraz.kisaCevapEn : itiraz.kisaCevap
  const detayliCevap =
    lang === 'en' && itiraz.detayliCevapEn ? itiraz.detayliCevapEn : itiraz.detayliCevap
  const yaklasim = lang === 'en' && itiraz.yaklasimEn ? itiraz.yaklasimEn : itiraz.yaklasim
  const ornekDiyalog =
    lang === 'en' && itiraz.ornekDiyalogEn ? itiraz.ornekDiyalogEn : itiraz.ornekDiyalog
  const copyValue = buildCopyValue(
    cevap,
    !!itiraz.cevap,
    kisaCevap,
    detayliCevap,
    ornekDiyalog,
    {
      short: t('objectionsPage.copyShortAnswer'),
      detailed: t('objectionsPage.copyDetailedAnswer'),
      dialog: t('objectionsPage.copyExampleDialog'),
    },
  )

  return (
    <li id={`konu-${itiraz.id}`}>
      <div
        className={`rounded-2xl border transition-all duration-200 ${
          acik
            ? 'border-[#9B1D47]/30 dark:border-[#fda4af]/30 bg-[var(--bg-card)] shadow-md'
            : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[#9B1D47]/30 dark:hover:border-[#fda4af]/30 hover:shadow-sm'
        }`}
      >
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-3 p-4 text-left"
        >
          <span className={`shrink-0 text-2xl leading-none transition-opacity ${isRead ? 'opacity-40' : ''}`}>{itiraz.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9B1D47] dark:text-[#fda4af] mb-0.5">
              {kategori}
            </p>
            <p className={`text-base font-semibold leading-snug ${isRead ? 'text-[var(--text-3)] line-through' : 'text-[var(--text-1)]'}`}>
              &quot;{soru}&quot;
            </p>
          </div>

          <button
            onClick={onToggleRead}
            title={isRead ? t('objectionsPage.markAsUnread') : t('objectionsPage.markAsRead')}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
              isRead
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-[var(--text-3)] hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            {isRead ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
          </button>

          <button
            onClick={onToggleFav}
            title={isFav ? t('objectionsPage.removeFromFavorites') : t('objectionsPage.addToFavorites')}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
              isFav
                ? 'bg-[#9B1D47]/10 text-[#9B1D47] dark:bg-[#fda4af]/10 dark:text-[#fda4af]'
                : 'text-[var(--text-3)] hover:text-[#9B1D47] dark:hover:text-[#fda4af]'
            }`}
          >
            <Star className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
          </button>

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[var(--text-3)] transition-transform duration-200 ${acik ? 'rotate-180' : ''}`}
            strokeWidth={2}
          />
        </button>

        {acik && (
          <div className="border-t border-[#9B1D47]/10 dark:border-[#fda4af]/10 px-4 pb-4 pt-3 bg-[var(--bg-subtle)]/10 rounded-b-2xl animate-in fade-in duration-200">
            <div className="flex gap-2">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF1F3] dark:bg-[#3d0a1a]">
                <span className="text-[10px]">💡</span>
              </div>
              <div className="flex-1 text-base leading-relaxed text-[var(--text-2)] space-y-3">
                {/* Özlü cevap (cevap) varsa ana yanıt olarak gösterilir; yoksa
                    kisaCevap kullanılır. detayliCevap / yaklasim / ornekDiyalog
                    varsa HER İKİ durumda da altta katman katman eklenir → mevcut
                    itirazlar cevabını korur, zenginleştirilenler derinlik kazanır. */}
                {itiraz.cevap && <p>{cevap}</p>}
                {!itiraz.cevap && kisaCevap && (
                  <div>
                    <h5 className="text-[10px] font-bold text-[#9B1D47] dark:text-[#fda4af] uppercase tracking-wider mb-0.5">{t('objectionsPage.expandShortAnswer')}</h5>
                    <p className="italic font-medium">&quot;{kisaCevap}&quot;</p>
                  </div>
                )}
                {detayliCevap && (
                  <div>
                    <h5 className="text-[10px] font-bold text-[#9B1D47] dark:text-[#fda4af] uppercase tracking-wider mb-0.5">{t('objectionsPage.expandDetailedAnswer')}</h5>
                    <p className="whitespace-pre-wrap">{detayliCevap}</p>
                  </div>
                )}
                {yaklasim && (
                  <div className="bg-[var(--bg-subtle)] p-3 rounded-xl border border-[var(--border)] mt-2">
                    <h5 className="text-[10px] font-bold text-[var(--text-2)] uppercase tracking-wider mb-1 flex items-center gap-1">🛡️ {t('objectionsPage.expandApproach')}</h5>
                    <p className="text-sm text-[var(--text-3)] leading-relaxed">{yaklasim}</p>
                  </div>
                )}
                {ornekDiyalog && (
                  <div className="bg-[#FFF1F3]/40 dark:bg-[#3d0a1a]/20 p-3 rounded-xl border border-[#FFE4EA] dark:border-[#3d0a1a]/40 mt-2">
                    <h5 className="text-[10px] font-bold text-[#9B1D47] dark:text-[#fda4af] uppercase tracking-wider mb-1 flex items-center gap-1">💬 {t('objectionsPage.expandExampleDialog')}</h5>
                    <p className="text-sm italic leading-relaxed whitespace-pre-wrap">&quot;{ornekDiyalog}&quot;</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#9B1D47]/10 dark:border-[#fda4af]/10 pt-3">
              {/* Left Group: Copy & WhatsApp */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={e => onCopy(copyValue, e)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all ${
                    copied
                      ? 'bg-[#E1F5EE] text-[#0F6E56] dark:bg-[#0d3d2e] dark:text-[#4ade80]'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[#FFF1F3] hover:text-[#9B1D47] dark:hover:bg-[#3d0a1a] dark:hover:text-[#fda4af]'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t('objectionsPage.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t('objectionsPage.copyAnswer')}</span>
                    </>
                  )}
                </button>

                <a
                  href={whatsappShareUrl(t('objectionsPage.waShare', { question: soru, answer: copyValue }))}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  title={t('objectionsPage.sendViaWhatsApp')}
                  className="flex items-center gap-1.5 rounded-xl bg-[#E7FBF0] dark:bg-[#0d2e1a]/50 px-3 py-1.5 text-sm font-semibold text-[#1a9e4f] dark:text-[#4ade80] transition-all hover:bg-[#d4f7e4] dark:hover:bg-[#0d2e1a]"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.118 1.523 5.845L0 24l6.335-1.508A11.927 11.927 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.807 9.807 0 01-5.031-1.386l-.361-.214-3.761.896.953-3.651-.235-.374A9.778 9.778 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
                  </svg>
                  <span className="hidden sm:inline">{t('objectionsPage.sendViaWhatsApp')}</span>
                </a>
              </div>

              {/* Right Group: Edit & Delete (ml-auto forces it to the right) */}
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                {isCustom && onEdit && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      onEdit()
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[#FFF1F3] hover:text-[#9B1D47] px-3 py-1.5 text-sm font-semibold transition-all"
                    title={t('objectionsPage.editObjectionTitle') || 'Düzenle'}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t('objectionsPage.editObjectionTitle') || 'Düzenle'}</span>
                  </button>
                )}

                {isCustom && onDelete && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      onDelete()
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 px-3 py-1.5 text-sm font-semibold transition-all"
                    title={t('objectionsPage.deleteObjection') || 'Sil'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t('objectionsPage.deleteObjection') || 'Sil'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </li>
  )
}
