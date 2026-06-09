'use client'

import { useState, useEffect } from 'react'
import { Bot, Copy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useTranslation } from '@/providers/LanguageProvider'
import { useQueryClient } from '@tanstack/react-query'
import { useAIUsage } from '@/hooks/useAIUsage'
import { useWorkspace } from '@/hooks/useWorkspace'
import { invalidateTeamAndAIUsage } from '@/lib/query/invalidateTeamAndAI'
import { getLimitsForLicense } from '@/lib/domain/aiUsage'
import { generateOnboardingGuidanceAction } from '../actions'
import { waHref } from '@/lib/utils/waLink'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'

const ONBOARDING_STEPS_TR: Record<string, string> = {
  'step_why': 'Başlangıç Görüşmesi & "Neden?" Belirleme',
  'step_list': '20-50 Kişilik Liste Oluşturma',
  'step_first_5': 'İlk 5 Adayı Belirleme',
  'step_3way': 'Sponsorla İlk 3\'lü Görüşme (3-Way Call)',
  'step_social': 'Sosyal Medyada İlk Ürün Paylaşımı',
  'step_independent': 'Sponsorsuz İlk Bağımsız Sunum',
  'step_objections': 'İtirazlara Cevaplar Modülü Eğitimi',
  'step_90day': '90 Günlük Saha Aksiyon Planı Yazımı',
  'step_complete': '30. Gün Kapanış & Değerlendirme',
}

const ONBOARDING_STEPS_EN: Record<string, string> = {
  'step_why': 'Kickoff Meeting & Define "Why"',
  'step_list': 'Create a list of 20-50 Names',
  'step_first_5': 'Identify first 5 and send messages',
  'step_3way': 'First 3-Way Call with Sponsor',
  'step_social': 'First Product Post on Social Media',
  'step_independent': 'First Independent Presentation',
  'step_objections': 'Study Objection Handling Module',
  'step_90day': 'Write 90-Day Field Action Plan',
  'step_complete': 'Day 30 Review & Reflection',
}

export interface YZOnboardingKocuModalProps {
  memberName: string
  stepId: string
  phone?: string | null
  onClose: () => void
}

export function YZOnboardingKocuModal({ memberName, stepId, phone, onClose }: YZOnboardingKocuModalProps) {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { lang, t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: usage, refetch: refetchUsage } = useAIUsage()
  const { data: modalWs } = useWorkspace()
  const { dailyLimit } = getLimitsForLicense(
    modalWs?.licenseType,
    modalWs?.isSuperAdmin,
    modalWs?.licenseExpiresAt,
    modalWs?.workspaceCreatedAt
  )

  useBodyScrollLock()

  useEffect(() => {
    let active = true
    async function generate() {
      try {
        const res = await generateOnboardingGuidanceAction(memberName, stepId, lang)
        if (!active) return
        if (res.error) {
          setError(res.error)
        } else if (res.message) {
          setMessage(res.message)
          invalidateTeamAndAIUsage(queryClient, modalWs?.workspaceId)
          void refetchUsage()
        }
      } catch (err: unknown) {
        if (active) {
          setError(t('team.guidanceError', { message: err instanceof Error ? err.message : String(err) }))
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    generate()
    return () => {
      active = false
    }
  }, [memberName, stepId, lang, refetchUsage, t, queryClient, modalWs?.workspaceId])

  const handleCopy = () => {
    if (!message) return
    navigator.clipboard.writeText(message)
    toast.success(t('team.coachingCopied'))
  }

  const handleSendWhatsApp = () => {
    if (!message) return
    const href = waHref(phone, message)
    if (href) {
      window.open(href, '_blank')
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank')
    }
  }

  const stepLabel = lang === 'en'
    ? (ONBOARDING_STEPS_EN[stepId] || stepId)
    : (ONBOARDING_STEPS_TR[stepId] || stepId)

  return (
    <div 
      className={`fixed inset-0 ${Z.coachModal} flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200`}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-6 shadow-2xl overflow-hidden flex flex-col gap-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <Bot className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <h3 className="text-lg font-black text-[var(--text-1)]">
              {t('team.aiCoachTitle')}
            </h3>
            <p className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider">
              {t('team.aiCoachSubtitle')}
            </p>
          </div>
        </div>

        {/* Member & Step Details */}
        <div className="rounded-2xl bg-[var(--bg-subtle)] p-4 border border-[var(--border)] space-y-2">
          <div>
            <p className="text-[10px] text-[var(--text-3)] font-extrabold uppercase tracking-widest">
              {t('team.downlineMember')}
            </p>
            <p className="text-sm font-extrabold text-[var(--text-1)] mt-0.5">{memberName}</p>
          </div>
          <div className="h-px bg-[var(--border)]" />
          <div>
            <p className="text-[10px] text-[var(--text-3)] font-extrabold uppercase tracking-widest">
              {t('team.targetStep')}
            </p>
            <p className="text-sm font-bold text-brand mt-0.5">
              {stepLabel}
            </p>
          </div>
        </div>

        {/* AI Output Box */}
        <div className="min-h-[140px] flex flex-col justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
              <p className="text-xs font-bold text-[var(--text-3)] animate-pulse">
                {t('team.aiDrafting')}
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200/50 bg-red-50/5 p-4 text-center">
              <p className="text-sm font-bold text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4 max-h-[220px] overflow-y-auto">
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-[var(--text-2)] select-text">
                  {message}
                </p>
              </div>

              {/* Action Buttons (Strictly Icon Only) */}
              <div className="flex gap-4 justify-center items-center">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--bg-card)] hover:text-brand transition shadow-sm active:scale-95 cursor-pointer"
                  title={t('team.copyCoaching')}
                >
                  <Copy className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-whatsapp text-white hover:bg-[#20ba59] transition shadow-md hover:shadow-emerald-500/20 active:scale-95 cursor-pointer"
                  title={t('team.sendWhatsApp')}
                >
                  <WhatsAppIcon className="h-5 w-5 fill-white" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center justify-center border-t border-[var(--border)] pt-4 text-center">
          {!usage?.isSuperAdmin && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-3)] mb-4">
              <span>{t('team.dailyCoachingQuota')}</span>
              <span className="font-extrabold text-[#0F6E56] dark:text-[#5eead4]">
                {t('team.usedQuota', {
                  used: usage?.aiUsed ?? 0,
                  limit: dailyLimit,
                })}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-black uppercase tracking-wider text-[var(--text-2)] hover:text-[var(--text-1)] transition active:scale-[0.98] cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
