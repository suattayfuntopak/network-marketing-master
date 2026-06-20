'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Copy, Send, Lock, ShoppingBag, Megaphone, Heart, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useAILimits } from '@/hooks/useAILimits'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { surfaceAiQuotaError } from '@/lib/ui/aiQuotaError'
import { AiQuotaBadge } from '@/components/ui/AiQuotaBadge'
import { invalidateTeamAndAIUsage } from '@/lib/query/invalidateTeamAndAI'
import { generateSocialContentAction } from '../actions'
import { logProductEventAction } from '@/app/(dashboard)/_shared-actions/productEvents'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'
import { whatsappShareUrl } from '@/lib/utils/waLink'
import { AI_USER_INPUT_MAX_CHARS } from '@/lib/domain/aiInputLimit'
import type { SocialGoal, SocialPlatform } from '@/lib/domain/socialContent'
import { CalendarPlus, CalendarClock, Check, Trash2 } from 'lucide-react'
import { queryKeys } from '@/lib/query/keys'
import { useContentPlans } from '@/hooks/useContentPlans'
import {
  addContentPlanAction,
  toggleContentPlanPostedAction,
  deleteContentPlanAction,
} from '../contentPlanActions'
import { keysForDaysAfter, todayCalendarKey } from '@/lib/utils/calendarDates'
import {
  EKIP_ACCENT_FOCUS,
  EKIP_ACCENT_PILL_ACTIVE,
  STUDIO_ACCENT_BTN_HOVER,
  STUDIO_MODULE_ACCENT_CLASS,
} from '@/lib/ui/brandGradients'

const GOALS: { key: SocialGoal; icon: typeof ShoppingBag; labelKey: string }[] = [
  { key: 'urun', icon: ShoppingBag, labelKey: 'studyo.goalUrun' },
  { key: 'firsat', icon: Megaphone, labelKey: 'studyo.goalFirsat' },
  { key: 'hikaye', icon: Heart, labelKey: 'studyo.goalHikaye' },
  { key: 'etkilesim', icon: MessageCircle, labelKey: 'studyo.goalEtkilesim' },
]
const PLATFORMS: { key: SocialPlatform; labelKey: string }[] = [
  { key: 'instagram', labelKey: 'studyo.platformInstagram' },
  { key: 'whatsapp_durum', labelKey: 'studyo.platformWhatsapp' },
  { key: 'facebook', labelKey: 'studyo.platformFacebook' },
]
const TONES: { key: string; labelKey: string }[] = [
  { key: 'samimi', labelKey: 'studyo.toneSamimi' },
  { key: 'profesyonel', labelKey: 'studyo.toneProfesyonel' },
  { key: 'esprili', labelKey: 'studyo.toneEsprili' },
  { key: 'ilham', labelKey: 'studyo.toneIlham' },
]

const pillBase =
  'rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-[0.98]'

export function StudyoForm() {
  const { t, lang } = useTranslation()
  const { data: ws } = useWorkspace()
  const qc = useQueryClient()
  const { hasAiCoachAccess, openUpgrade, UpgradePrompt } = useUpgradePrompt()
  const { limitReached } = useAILimits()

  const [goal, setGoal] = useState<SocialGoal>('urun')
  const [platform, setPlatform] = useState<SocialPlatform>('instagram')
  const [tone, setTone] = useState('samimi')
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [planDate, setPlanDate] = useState(() => keysForDaysAfter(todayCalendarKey(), 1)[0])
  const [savingPlan, setSavingPlan] = useState(false)

  const { data: plans = [] } = useContentPlans()
  const invalidatePlans = () => qc.invalidateQueries({ queryKey: queryKeys.contentPlans() })

  async function saveToCalendar() {
    if (!result || savingPlan) return
    setSavingPlan(true)
    try {
      await addContentPlanAction({ platform, scheduledFor: planDate, body: result })
      toast.success(t('studyo.planSaved'))
      await invalidatePlans()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingPlan(false)
    }
  }

  async function togglePosted(id: string, isPosted: boolean) {
    try {
      await toggleContentPlanPostedAction(id, isPosted)
      await invalidatePlans()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  async function removePlan(id: string) {
    try {
      await deleteContentPlanAction(id)
      await invalidatePlans()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  async function generate() {
    if (!hasAiCoachAccess) { openUpgrade('ai_coach'); return }
    if (limitReached) { openUpgrade('ai_coach'); return }
    if (isPending) return
    setIsPending(true)
    try {
      const res = await generateSocialContentAction({ goal, platform, tone, topic, lang })
      if (res.error) {
        surfaceAiQuotaError(res, {
          openUpgrade,
          toastError: (m) => toast.error(m),
          feature: 'ai_coach',
          fallbackMessage: t('coachUi.somethingWrong'),
        })
      } else if (res.content) {
        setResult(res.content)
        invalidateTeamAndAIUsage(qc, ws?.workspaceId)
        void logProductEventAction(PRODUCT_EVENTS.socialContentGenerated, { goal, platform })
      }
    } catch {
      toast.error(t('coachUi.somethingWrong'))
    } finally {
      setIsPending(false)
    }
  }

  function copyResult() {
    if (!result) return
    void navigator.clipboard?.writeText(result)
    void logProductEventAction(PRODUCT_EVENTS.socialContentShared, { via: 'copy', platform })
    toast.success(t('studyo.copied'))
  }

  function shareResult() {
    if (!result) return
    void logProductEventAction(PRODUCT_EVENTS.socialContentShared, { via: 'whatsapp', platform })
    window.open(whatsappShareUrl(result), '_blank')
  }

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-center bg-[var(--bg-card)] shadow-sm">
        <span className="text-4xl leading-none block mb-2">✍️</span>
        <h2 className="text-base font-bold text-[var(--text-1)]">{t('studyo.title')}</h2>
        <p className="mt-1.5 text-sm text-[var(--text-3)]">{t('studyo.intro')}</p>
        <AiQuotaBadge feature="ai_coach" openUpgrade={openUpgrade} className="mt-2" />
      </div>

      {/* Amaç */}
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-3)]">{t('studyo.goalLabel')}</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GOALS.map(({ key, icon: Icon, labelKey }) => (
            <button key={key} type="button" onClick={() => setGoal(key)}
              className={`${pillBase} flex items-center justify-center gap-1.5 ${goal === key ? EKIP_ACCENT_PILL_ACTIVE : 'border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--bg-subtle)]'}`}>
              <Icon className="h-3.5 w-3.5" /> {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Platform + Ton */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-3)]">{t('studyo.platformLabel')}</span>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(({ key, labelKey }) => (
              <button key={key} type="button" onClick={() => setPlatform(key)}
                className={`${pillBase} ${platform === key ? 'border-[#3730A3] bg-[#3730A3]/10 text-[#3730A3] dark:text-indigo-300' : 'border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--bg-subtle)]'}`}>
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-3)]">{t('studyo.toneLabel')}</span>
          <div className="flex flex-wrap gap-2">
            {TONES.map(({ key, labelKey }) => (
              <button key={key} type="button" onClick={() => setTone(key)}
                className={`${pillBase} ${tone === key ? 'border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--bg-subtle)]'}`}>
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Konu */}
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-3)]">{t('studyo.topicLabel')}</span>
        <textarea
          value={topic}
          onChange={e => setTopic(e.target.value.slice(0, AI_USER_INPUT_MAX_CHARS))}
          maxLength={AI_USER_INPUT_MAX_CHARS}
          rows={2}
          placeholder={t('studyo.topicPlaceholder')}
          className={`w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-base text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition ${EKIP_ACCENT_FOCUS}`}
        />
      </div>

      {/* Üret */}
      <button type="button" onClick={generate} disabled={isPending}
        className={`relative flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-md transition active:scale-[0.99] disabled:opacity-60 ${STUDIO_MODULE_ACCENT_CLASS} ${STUDIO_ACCENT_BTN_HOVER}`}
        title={!hasAiCoachAccess ? t('pagesUi.unlockAiBasic') : undefined}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {isPending ? t('studyo.generating') : t('studyo.generate')}
        {!hasAiCoachAccess && <Lock className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/80" />}
      </button>

      {/* Sonuç */}
      {result && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-3)]">{t('studyo.resultTitle')}</span>
            <div className="flex gap-2">
              <button type="button" onClick={copyResult} className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg-subtle)] px-2.5 py-1.5 text-xs font-bold text-[var(--text-2)] transition hover:text-[var(--text-1)]">
                <Copy className="h-3.5 w-3.5" /> {t('studyo.copy')}
              </button>
              <button type="button" onClick={shareResult} className="inline-flex items-center gap-1 rounded-lg bg-brand/10 px-2.5 py-1.5 text-xs font-bold text-brand dark:text-indigo-300">
                <Send className="h-3.5 w-3.5" /> {t('studyo.share')}
              </button>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-1)]">{result}</p>

          {/* Takvime kaydet */}
          <div className="mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-3">
            <input
              type="date"
              value={planDate}
              min={todayCalendarKey()}
              onChange={e => setPlanDate(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs text-[var(--text-1)] outline-none focus:border-brand"
            />
            <button type="button" onClick={saveToCalendar} disabled={savingPlan}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50 ${STUDIO_MODULE_ACCENT_CLASS} ${STUDIO_ACCENT_BTN_HOVER}`}>
              <CalendarPlus className="h-3.5 w-3.5" /> {t('studyo.saveToCalendar')}
            </button>
          </div>
        </div>
      )}

      {/* Planlarım — içerik takvimi */}
      {plans.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--text-3)]">
            <CalendarClock className="h-3.5 w-3.5" /> {t('studyo.plansTitle')}
          </div>
          {plans.map(p => (
            <div key={p.id} className={`rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-sm ${p.is_posted ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between gap-2 pb-1">
                <span className="text-xs font-bold text-[var(--text-2)]">
                  {p.scheduled_for} · {p.platform}
                </span>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => togglePosted(p.id, !p.is_posted)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition ${p.is_posted ? 'bg-brand/15 text-brand dark:text-indigo-300' : 'bg-[var(--bg-subtle)] text-[var(--text-3)] hover:text-[var(--text-1)]'}`}>
                    <Check className="h-3 w-3" /> {p.is_posted ? t('studyo.posted') : t('studyo.markPosted')}
                  </button>
                  <button type="button" onClick={() => removePlan(p.id)} className="rounded-lg p-1 text-[var(--text-3)] transition hover:text-rose-500" aria-label={t('common.delete')}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-[var(--text-2)]">{p.body}</p>
            </div>
          ))}
        </div>
      )}

      {UpgradePrompt}
    </div>
  )
}
