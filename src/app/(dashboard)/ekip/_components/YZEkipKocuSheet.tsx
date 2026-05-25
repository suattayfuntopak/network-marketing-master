'use client'

import { useActionState } from 'react'
import { X, Bot, Copy, Loader2 } from 'lucide-react'
import { generateDownlineCoachingMessage } from '@/app/(dashboard)/pipeline/[id]/actions'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { waHref } from '@/lib/waLink'
import type { MemberRow } from './EkipPanel'
import { toast } from 'sonner'
import { Z } from '@/lib/zIndex'

interface Props {
  member: MemberRow
  daysInactive: number
  lang: string
  onClose: () => void
}

export function YZEkipKocuSheet({ member, daysInactive, lang, onClose }: Props) {
  const [state, action, isPending] = useActionState(generateDownlineCoachingMessage, {})

  function handleCopy() {
    if (state.message) {
      navigator.clipboard.writeText(state.message)
      toast.success(lang === 'en' ? 'Coaching message copied!' : 'Koçluk mesajı kopyalandı!')
    }
  }

  function handleWhatsApp() {
    const defaultPhone = '' // We don't have direct phone field inside workspace members, but if they have it we can pass, else leader will copy-paste or open blank. Wait, let's see if we can open a blank WhatsApp or let them copy. Yes, leader can copy-paste or we can use waHref(null, state.message).
    const href = waHref(null, state.message)
    if (href) window.open(href, '_blank')
  }

  return (
    <>
      {/* Backdrop */}
      <div className={`fixed inset-0 ${Z.sheetBackdrop} bg-black/40 backdrop-blur-sm`} onClick={onClose} />
      
      {/* Sheet panel */}
      <div className={`fixed left-1/2 top-4 md:top-1/2 ${Z.sheet} w-[calc(100%-2rem)] md:w-[420px] -translate-x-1/2 translate-y-0 md:-translate-y-1/2 rounded-2xl bg-[var(--bg-card)] p-6 border border-[var(--border)] shadow-2xl transition-all`}
           style={{ maxHeight: 'calc(100dvh - 5.5rem)', overflowY: 'auto' }}>
        
        {/* Başlık */}
        <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500">
              <Bot className="h-4.5 w-4.5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-1)]">
                {lang === 'en' ? 'YZ Team Coach' : 'YZ Ekip Koçu'}
              </p>
              <p className="text-xs text-[var(--text-3)]">
                {member.full_name ?? 'İsimsiz Üye'} · {daysInactive} {lang === 'en' ? 'days inactive' : 'gündür inaktif'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Üye istatistikleri özet gösterimi */}
        <div className="mb-5 rounded-2xl bg-[var(--bg-subtle)] p-4 border border-[var(--border)] space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">
            {lang === 'en' ? 'Member Stats' : 'Üye Dağılım İstatistikleri'}
          </p>
          <div className="grid grid-cols-4 gap-2 pt-1 text-center">
            <div className="rounded-xl bg-blue-50/50 dark:bg-blue-950/10 p-2 border border-blue-100/30">
              <span className="block text-xs font-bold text-blue-600 dark:text-blue-400">{member.yeni_count}</span>
              <span className="text-[8px] text-[var(--text-3)] font-medium">{lang === 'en' ? 'New' : 'Yeni'}</span>
            </div>
            <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 p-2 border border-emerald-100/30">
              <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">{member.sunum_count}</span>
              <span className="text-[8px] text-[var(--text-3)] font-medium">{lang === 'en' ? 'Pres.' : 'Sunum'}</span>
            </div>
            <div className="rounded-xl bg-amber-50/50 dark:bg-amber-950/10 p-2 border border-amber-100/30">
              <span className="block text-xs font-bold text-amber-600 dark:text-amber-400">{member.takip_count}</span>
              <span className="text-[8px] text-[var(--text-3)] font-medium">{lang === 'en' ? 'Follow' : 'Takip'}</span>
            </div>
            <div className="rounded-xl bg-purple-50/50 dark:bg-purple-950/10 p-2 border border-purple-100/30">
              <span className="block text-xs font-bold text-purple-600 dark:text-purple-400">{member.katildi_count}</span>
              <span className="text-[8px] text-[var(--text-3)] font-medium">{lang === 'en' ? 'Joined' : 'Katıldı'}</span>
            </div>
          </div>
        </div>

        <form action={action} className="space-y-4">
          {/* Gizli veriler */}
          <input type="hidden" name="memberName" value={member.full_name ?? 'İsimsiz Üye'} />
          <input type="hidden" name="candidateCount" value={member.candidate_count} />
          <input type="hidden" name="yeniCount" value={member.yeni_count} />
          <input type="hidden" name="sunumCount" value={member.sunum_count} />
          <input type="hidden" name="takipCount" value={member.takip_count} />
          <input type="hidden" name="katildiCount" value={member.katildi_count} />
          <input type="hidden" name="daysInactive" value={daysInactive} />

          {state.error && (
            <p className="rounded-xl bg-[#FBEAF0] px-4 py-2.5 text-sm text-[#72243E]">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 active:scale-95 disabled:opacity-60 shadow-md shadow-amber-500/10"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {lang === 'en' ? 'Generating...' : 'Analiz Ediliyor...'}</>
            ) : (
              <><Bot className="h-4.5 w-4.5" /> {lang === 'en' ? 'Generate Coaching Message' : 'Koçluk Mesajı Üret'}</>
            )}
          </button>
        </form>

        {/* Sonuç Mesajı */}
        {state.message && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/5 dark:border-amber-900/30 dark:bg-amber-950/5 p-4 animate-in fade-in duration-300">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              {lang === 'en' ? 'Suggested Mentoring Message' : 'Önerilen Destek Mesajı'}
            </p>
            <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-1)] border-b border-[var(--border)] pb-3">
              {state.message}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-2.5 text-xs font-semibold text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)] active:scale-95"
              >
                <Copy className="h-3.5 w-3.5" />
                {lang === 'en' ? 'Copy' : 'Kopyala'}
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95 shadow-sm"
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
                WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
