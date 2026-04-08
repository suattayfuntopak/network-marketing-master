import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X, Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useCreateTemplate, useUpdateTemplate } from '@/hooks/useTemplates'
import { useAIMessage } from '@/hooks/useAIMessage'
import type { MessageTemplate, MessageCategory, MessageChannel, MessageTone } from '@/lib/messages/types'

const CATEGORIES: MessageCategory[] = [
  'first_contact', 'warm_up', 'value_share', 'invitation',
  'follow_up', 'objection_handling', 'closing', 'after_no',
  'reactivation', 'birthday', 'thank_you', 'onboarding',
]
const CHANNELS: MessageChannel[] = ['whatsapp', 'telegram', 'sms', 'email', 'instagram_dm', 'any']
const TONES: MessageTone[] = ['friendly', 'professional', 'curious', 'empathetic', 'confident', 'humorous']

interface Props {
  open: boolean
  onClose: () => void
  template: MessageTemplate | null
  userId: string
  startWithAI?: boolean
}

export function TemplateFormModal({ open, onClose, template, userId, startWithAI = false }: Props) {
  const { t } = useTranslation()
  const createTemplate = useCreateTemplate(userId)
  const updateTemplate = useUpdateTemplate(userId)
  const { generate, isGenerating } = useAIMessage()

  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<MessageCategory>('follow_up')
  const [channel, setChannel] = useState<MessageChannel>('whatsapp')
  const [tone, setTone] = useState<MessageTone>('friendly')
  const [loading, setLoading] = useState(false)

  // AI section
  const [showAI, setShowAI] = useState(false)
  const [aiContext, setAiContext] = useState('')
  const [aiVariants, setAiVariants] = useState<{ message: string; approach: string }[]>([])

  const buildSuggestedName = () => {
    const categoryLabel = t(`messages.categories.${category}`)
    const channelLabel = t(`messages.channels.${channel}`)
    return `${categoryLabel} · ${channelLabel}`
  }

  useEffect(() => {
    if (template) {
      setName(template.name)
      setContent(template.content)
      setCategory(template.category)
      setChannel(template.channel)
      setTone(template.tone)
    } else {
      setName('')
      setContent('')
      setCategory('follow_up')
      setChannel('whatsapp')
      setTone('friendly')
    }
    setShowAI(startWithAI && !template)
    setAiVariants([])
    setAiContext('')
  }, [template, open, startWithAI])

  const handleSave = async () => {
    if (!name.trim() || !content.trim() || loading) return
    setLoading(true)
    try {
      if (template) {
        await updateTemplate.mutateAsync({ id: template.id, data: { name, content, category, channel, tone } })
      } else {
        await createTemplate.mutateAsync({ user_id: userId, name, content, category, channel, tone })
      }
      onClose()
    } catch (err) {
      console.error('[TemplateFormModal] save error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    const result = await generate({
      category,
      channel,
      tone,
      userInput: aiContext.trim() || undefined,
    })
    if (!result || result.length === 0) return

    setAiVariants(result)
    setShowAI(true)

    if (!content.trim()) {
      setContent(result[0].message)
    }

    if (!name.trim()) {
      setName(buildSuggestedName())
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? t('common.edit') : t('messages.template.new')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('messages.template.namePlaceholder')}
          />

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('messages.ai.selectCategory')}</p>
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
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t(`messages.categories.${c}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('messages.ai.selectChannel')}</p>
              <div className="flex flex-wrap gap-1">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={cn(
                      'text-xs px-2 py-1 rounded-full border transition-colors',
                      channel === ch
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t(`messages.channels.${ch}`)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('messages.ai.selectTone')}</p>
              <div className="flex flex-wrap gap-1">
                {TONES.map((tn) => (
                  <button
                    key={tn}
                    type="button"
                    onClick={() => setTone(tn)}
                    className={cn(
                      'text-xs px-2 py-1 rounded-full border transition-colors',
                      tone === tn
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t(`messages.tones.${tn}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Generate section */}
          <div className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAI(!showAI)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {t('messages.template.aiGenerate')}
              {showAI ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
            </button>

            {showAI && (
              <div className="border-t px-3 py-3 space-y-3 bg-muted/20">
                <Textarea
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  placeholder={t('messages.ai.contextPlaceholder')}
                  rows={2}
                  className="resize-none text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="gap-1.5 w-full"
                >
                  {isGenerating ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> {t('messages.ai.generating')}</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" /> {t('messages.ai.generate')}</>
                  )}
                </Button>

                {aiVariants.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{t('messages.template.aiPickVariant')}</p>
                    {aiVariants.map((v, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setContent(v.message)
                          if (!name.trim()) {
                            setName(buildSuggestedName())
                          }
                        }}
                        className={cn(
                          'w-full text-left border rounded-md p-2.5 text-xs leading-relaxed transition-colors hover:border-primary',
                          content === v.message ? 'border-primary bg-primary/5' : 'border-border'
                        )}
                      >
                        <span className="font-medium text-primary block mb-1">
                          {t('messages.ai.variant', { n: idx + 1 })} · {v.approach}
                        </span>
                        <span className="text-muted-foreground line-clamp-3">{v.message}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('messages.template.contentPlaceholder')}
            rows={6}
            className="resize-none text-sm"
          />

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!name.trim() || !content.trim() || loading} className="gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {t('common.save')}
            </Button>
            <Button variant="ghost" onClick={onClose} className="gap-1.5">
              <X className="w-3.5 h-3.5" />
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
