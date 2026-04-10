import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Copy, ExternalLink, RefreshCw, Check, BookmarkPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useAIMessage } from '@/hooks/useAIMessage'
import { useSaveAIMessage, useRateAIMessage, useCreateTemplate } from '@/hooks/useTemplates'
import { useAuth } from '@/hooks/useAuth'
import type { MessageCategory, MessageChannel, MessageTone, AIMessageVariant } from '@/lib/messages/types'
import type { ContactWithTags } from '@/lib/contacts/types'

const CATEGORIES: MessageCategory[] = [
  'first_contact', 'warm_up', 'value_share', 'invitation',
  'follow_up', 'objection_handling', 'closing', 'after_no',
  'reactivation', 'birthday', 'thank_you', 'onboarding',
]

const CHANNELS: MessageChannel[] = ['whatsapp', 'telegram', 'sms', 'email', 'instagram_dm']

const TONES: MessageTone[] = ['friendly', 'professional', 'curious', 'empathetic', 'confident', 'humorous']

interface Props {
  open: boolean
  onClose: () => void
  contact?: ContactWithTags | null
  initialCategory?: MessageCategory
  initialChannel?: MessageChannel
  initialTone?: MessageTone
  presetLabel?: string | null
  presetReason?: string | null
}

export function AIMessageGeneratorModal({
  open,
  onClose,
  contact,
  initialCategory,
  initialChannel,
  initialTone,
  presetLabel,
  presetReason,
}: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { generate, isGenerating } = useAIMessage()
  const saveAIMessage = useSaveAIMessage(user?.id ?? '')
  const rateAIMessage = useRateAIMessage()

  const [category, setCategory] = useState<MessageCategory>(initialCategory ?? 'follow_up')
  const [channel, setChannel] = useState<MessageChannel>(initialChannel ?? 'whatsapp')
  const [tone, setTone] = useState<MessageTone>(initialTone ?? 'friendly')
  const [userInput, setUserInput] = useState('')
  const [variants, setVariants] = useState<AIMessageVariant[]>([])
  const [savedMessageId, setSavedMessageId] = useState<string | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [rated, setRated] = useState<'great' | 'good' | 'meh' | 'bad' | null>(null)
  // Save as template state
  const createTemplate = useCreateTemplate(user?.id ?? '')
  const [savingTemplateIdx, setSavingTemplateIdx] = useState<number | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [savedTemplateIdx, setSavedTemplateIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    setCategory(initialCategory ?? 'follow_up')
    setChannel(initialChannel ?? 'whatsapp')
    setTone(initialTone ?? 'friendly')
  }, [initialCategory, initialChannel, initialTone, open])

  const handleGenerate = async () => {
    const result = await generate({
      contactId: contact?.id,
      contactSnapshot: contact
        ? {
            full_name: contact.full_name,
            occupation: contact.occupation,
            city: contact.city,
            relationship: contact.relationship,
            goals: contact.goals,
            pain_points: contact.pain_points,
            interests: contact.interests,
            warmth_score: contact.warmth_score ?? undefined,
            stage: contact.stage,
          }
        : undefined,
      category,
      channel,
      tone,
      userInput: userInput.trim() || undefined,
    })

    if (result) {
      setVariants(result)
      setRated(null)
      setSavedMessageId(null)

      // Save to DB
      if (user?.id) {
        const id = await saveAIMessage.mutateAsync({
          user_id: user.id,
          contact_id: contact?.id ?? null,
          prompt: userInput,
          context: contact ? { full_name: contact.full_name, stage: contact.stage } : {},
          category,
          channel,
          tone,
          generated_content: result.map((v) => v.message).join('\n---\n'),
          variants: result,
        })
        setSavedMessageId(id)
      }
    }
  }

  const handleCopy = async (message: string, idx: number) => {
    await navigator.clipboard.writeText(message)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const handleWhatsApp = (message: string) => {
    const phone = contact?.phone?.replace(/\D/g, '')
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  const handleRate = (feedback: 'great' | 'good' | 'meh' | 'bad') => {
    if (savedMessageId) {
      rateAIMessage.mutate({ id: savedMessageId, feedback })
    }
    setRated(feedback)
  }

  const handleSaveAsTemplate = async (variant: AIMessageVariant, idx: number) => {
    if (!templateName.trim() || !user?.id) return
    try {
      await createTemplate.mutateAsync({
        user_id: user.id,
        name: templateName.trim(),
        content: variant.message,
        category,
        channel,
        tone,
        is_ai_generated: true,
      })
      setSavedTemplateIdx(idx)
      setSavingTemplateIdx(null)
      setTemplateName('')
      setTimeout(() => setSavedTemplateIdx(null), 2000)
    } catch (err) {
      console.error('[AIMessageGeneratorModal] save template error:', err)
    }
  }

  const handleClose = () => {
    setVariants([])
    setUserInput('')
    setSavedMessageId(null)
    setRated(null)
    setSavingTemplateIdx(null)
    setTemplateName('')
    setSavedTemplateIdx(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {t('messages.ai.title')}
          </DialogTitle>
          {contact && (
            <p className="text-sm text-muted-foreground">
              {contact.full_name}
              {contact.occupation && ` · ${contact.occupation}`}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {(presetLabel || presetReason) && (
            <div className="rounded-2xl border border-primary/15 bg-primary/6 p-4">
              <div className="flex flex-wrap items-center gap-2">
                {presetLabel ? (
                  <span className="rounded-full border border-primary/15 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-primary">
                    {presetLabel}
                  </span>
                ) : null}
                <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {t(`messages.categories.${category}`)}
                </span>
                <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {t(`messages.tones.${tone}`)}
                </span>
              </div>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t('messages.ai.recommendedLabel')}
              </p>
              {presetReason ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{presetReason}</p>
              ) : null}
            </div>
          )}

          {/* Kategori */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{t('messages.ai.selectCategory')}</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border transition-colors',
                    category === c
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t(`messages.categories.${c}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Kanal + Ton */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t('messages.ai.selectChannel')}</p>
              <div className="flex flex-wrap gap-1.5">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full border transition-colors',
                      channel === ch
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t(`messages.channels.${ch}`)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t('messages.ai.selectTone')}</p>
              <div className="flex flex-wrap gap-1.5">
                {TONES.map((tn) => (
                  <button
                    key={tn}
                    type="button"
                    onClick={() => setTone(tn)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full border transition-colors',
                      tone === tn
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t(`messages.tones.${tn}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ek bağlam */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{t('messages.ai.context')}</p>
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={t('messages.ai.contextPlaceholder')}
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          {/* Üret butonu */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t('messages.ai.generating')}
              </>
            ) : variants.length > 0 ? (
              <>
                <RefreshCw className="w-4 h-4" />
                {t('messages.ai.regenerate')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {t('messages.ai.generate')}
              </>
            )}
          </Button>

          {/* Sonuçlar */}
          {variants.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                {t('messages.ai.generatedCount', { count: variants.length })}
              </p>
              {variants.map((v, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary">
                      {t('messages.ai.variant', { n: idx + 1 })} · {v.approach}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{v.message}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleCopy(v.message, idx)}
                    >
                      {copiedIdx === idx ? (
                        <><Check className="w-3 h-3" /> {t('messages.ai.copied')}</>
                      ) : (
                        <><Copy className="w-3 h-3" /> {t('messages.ai.copyToClipboard')}</>
                      )}
                    </Button>
                    {(channel === 'whatsapp' || channel === 'any') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 text-green-600 border-green-600/30 hover:bg-green-50 dark:hover:bg-green-950"
                        onClick={() => handleWhatsApp(v.message)}
                      >
                        <ExternalLink className="w-3 h-3" />
                        {t('messages.ai.openInWhatsapp')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-950"
                      onClick={() => {
                        setSavingTemplateIdx(savingTemplateIdx === idx ? null : idx)
                        setTemplateName('')
                      }}
                    >
                      {savedTemplateIdx === idx ? (
                        <><Check className="w-3 h-3" /> {t('messages.template.saved')}</>
                      ) : (
                        <><BookmarkPlus className="w-3 h-3" /> {t('messages.template.saveAs')}</>
                      )}
                    </Button>
                  </div>
                  {savingTemplateIdx === idx && (
                    <div className="flex gap-2 pt-1">
                      <Input
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder={t('messages.template.namePlaceholder')}
                        className="h-7 text-xs"
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveAsTemplate(v, idx)}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        className="h-7 text-xs px-2"
                        disabled={!templateName.trim() || createTemplate.isPending}
                        onClick={() => handleSaveAsTemplate(v, idx)}
                      >
                        {t('common.save')}
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {/* Feedback */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground">{t('messages.ai.feedbackPrompt')}</span>
                {(['great', 'good', 'meh', 'bad'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => handleRate(f)}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded border transition-colors',
                      rated === f
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t(`messages.ai.feedback${f.charAt(0).toUpperCase() + f.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
