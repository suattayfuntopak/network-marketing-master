'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Copy, Send, Lock, ShoppingBag, Megaphone, Heart, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useAILimits } from '@/hooks/useAILimits'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { invalidateTeamAndAIUsage } from '@/lib/query/invalidateTeamAndAI'
import { generateSocialContentAction } from '../actions'
import { logProductEventAction } from '@/app/(dashboard)/_shared-actions/productEvents'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'
import { whatsappShareUrl } from '@/lib/utils/waLink'
import { AI_USER_INPUT_MAX_CHARS } from '@/lib/domain/aiInputLimit'
import type { SocialGoal, SocialPlatform } from '@/lib/domain/socialContent'

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
  const { isSuperAdmin, aiUsed, dailyLimit } = useAILimits()

  const [goal, setGoal] = useState<SocialGoal>('urun')
  const [platform, setPlatform] = useState<SocialPlatform>('instagram')
  const [tone, setTone] = useState('samimi')
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState('')
  const [isPending, setIsPending] = useState(false)

  async function generate() {
    if (!hasAiCoachAccess) { openUpgrade('ai_coach'); return }
    if (isPending) return
    setIsPending(true)
    try {
      const res = await generateSocialContentAction({ goal, platform, tone, topic, lang })
      if (res.error) {
        toast.error(res.error)
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
        {!isSuperAdmin && (
          <p className="mt-2 text-sm font-bold text-[var(--text-3)]">
            {t('coachUi.dailyAiQuota', { used: aiUsed, limit: dailyLimit })}
          </p>
        )}
      </div>

      {/* Amaç */}
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-3)]">{t('studyo.goalLabel')}</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GOALS.map(({ key, icon: Icon, labelKey }) => (
            <button key={key} type="button" onClick={() => setGoal(key)}
              className={`${pillBase} flex items-center justify-center gap-1.5 ${goal === key ? 'border-[#0F6E56] bg-[#0F6E56]/10 text-[#0F6E56] dark:text-emerald-300' : 'border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--bg-subtle)]'}`}>
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
          className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-base text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition focus:border-[#0F6E56]"
        />
      </div>

      {/* Üret */}
      <button type="button" onClick={generate} disabled={isPending}
        className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0F6E56] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#0c5a47] active:scale-[0.99] disabled:opacity-60"
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
              <button type="button" onClick={shareResult} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                <Send className="h-3.5 w-3.5" /> {t('studyo.share')}
              </button>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-1)]">{result}</p>
        </div>
      )}

      {UpgradePrompt}
    </div>
  )
}
