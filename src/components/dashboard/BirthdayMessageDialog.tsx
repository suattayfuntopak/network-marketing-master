import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, RefreshCw, Send, Sparkles } from 'lucide-react'
import { SiInstagram, SiTelegram, SiWhatsapp } from 'react-icons/si'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { useAIMessage } from '@/hooks/useAIMessage'
import { cn } from '@/lib/utils'
import type { BirthdayContact } from '@/lib/contacts/queries'
import type { MessageChannel } from '@/lib/messages/types'

interface BirthdayMessageDialogProps {
  open: boolean
  onClose: () => void
  contact: BirthdayContact | null
}

interface DeliveryChannel {
  key: MessageChannel | 'instagram'
  icon: React.ElementType
  title: string
  color: string
  available: boolean
}

function buildWhatsAppLink(contact: BirthdayContact, message: string) {
  const source = contact.whatsapp?.trim() || contact.phone?.trim() || ''
  const digits = source.replace(/\D/g, '')
  if (digits) return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
  return null
}

function buildTelegramLink(contact: BirthdayContact) {
  const username = contact.telegram?.trim().replace(/^@/, '')
  if (!username) return null
  return `https://t.me/${username}`
}

function buildInstagramLink(contact: BirthdayContact) {
  const username = contact.instagram?.trim().replace(/^@/, '')
  if (!username) return null
  return `https://instagram.com/${username}`
}

export function BirthdayMessageDialog({ open, onClose, contact }: BirthdayMessageDialogProps) {
  const { i18n } = useTranslation()
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr'
  const dialogKey = contact ? `${contact.id}:${currentLang}` : 'empty'

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      {open && contact ? (
        <BirthdayMessageDialogContent
          key={dialogKey}
          contact={contact}
        />
      ) : null}
    </Dialog>
  )
}

function BirthdayMessageDialogContent({
  contact,
}: {
  contact: BirthdayContact
}) {
  const { t, i18n } = useTranslation()
  const { generate, isGenerating } = useAIMessage()
  const [message, setMessage] = useState('')
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr'

  const buildRequest = useMemo(() => () => ({
    contactId: contact.id,
    contactSnapshot: {
      full_name: contact.full_name,
      occupation: contact.occupation,
      city: contact.city,
      relationship: contact.relationship,
      goals: contact.goals,
      pain_points: contact.pain_points,
      interests: contact.interests,
      warmth_score: contact.warmth_score,
      stage: contact.stage,
    },
    category: 'birthday' as const,
    channel: 'any' as const,
      tone: 'friendly' as const,
      userInput: t('dashboard.birthdayAiPrompt'),
  }), [contact, t])

  useEffect(() => {
    let isCancelled = false

    const generateBirthdayMessage = async () => {
      const variants = await generate(buildRequest())

      if (!isCancelled && variants?.[0]?.message) {
        setMessage(variants[0].message)
      }
    }

    void generateBirthdayMessage()

    return () => {
      isCancelled = true
    }
  }, [contact.id, currentLang, buildRequest, generate])

  const deliveryChannels = useMemo<DeliveryChannel[]>(() => {
    return [
      {
        key: 'whatsapp' as const,
        icon: SiWhatsapp,
        title: 'WhatsApp',
        color: 'text-[#25D366] hover:bg-[#25D366] hover:text-white',
        available: !!buildWhatsAppLink(contact, message),
      },
      {
        key: 'telegram' as const,
        icon: SiTelegram,
        title: 'Telegram',
        color: 'text-sky-500 hover:bg-sky-500 hover:text-white',
        available: !!buildTelegramLink(contact),
      },
      {
        key: 'email' as const,
        icon: Mail,
        title: 'Email',
        color: 'text-violet-500 hover:bg-violet-500 hover:text-white',
        available: !!contact.email,
      },
      {
        key: 'instagram' as const,
        icon: SiInstagram,
        title: 'Instagram',
        color: 'text-pink-500 hover:bg-pink-500 hover:text-white',
        available: !!buildInstagramLink(contact),
      },
    ].filter((channel) => channel.available)
  }, [contact, message])

  const handleRegenerate = async () => {
    const variants = await generate(buildRequest())

    if (variants?.[0]?.message) {
      setMessage(variants[0].message)
    }
  }

  const handleSend = async (channel: DeliveryChannel) => {
    if (!message.trim()) return

    if (channel.key === 'whatsapp') {
      const href = buildWhatsAppLink(contact, message)
      if (href) window.open(href, '_blank', 'noopener,noreferrer')
      return
    }

    if (channel.key === 'email' && contact.email) {
      const href = `mailto:${contact.email}?subject=${encodeURIComponent(t('dashboard.birthdayEmailSubject', { name: contact.full_name }))}&body=${encodeURIComponent(message)}`
      window.open(href, '_blank', 'noopener,noreferrer')
      return
    }

    if (channel.key === 'telegram') {
      const href = buildTelegramLink(contact)
      if (href) {
        await navigator.clipboard.writeText(message)
        toast.success(t('dashboard.messageCopiedForChannel', { channel: 'Telegram' }))
        window.open(href, '_blank', 'noopener,noreferrer')
      }
      return
    }

    if (channel.key === 'instagram') {
      const href = buildInstagramLink(contact)
      if (href) {
        await navigator.clipboard.writeText(message)
        toast.success(t('dashboard.messageCopiedForChannel', { channel: 'Instagram' }))
        window.open(href, '_blank', 'noopener,noreferrer')
      }
    }
  }

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {t('dashboard.birthdayDialogTitle')}
        </DialogTitle>
        <p className="text-sm text-muted-foreground">{contact.full_name}</p>
      </DialogHeader>

      <div className="space-y-4">
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={7}
          placeholder={isGenerating ? t('dashboard.birthdayGenerating') : t('dashboard.birthdayEmpty')}
          className="resize-none text-sm leading-6"
        />

        <div className="flex flex-wrap items-start gap-3">
          <Button
            onClick={handleRegenerate}
            disabled={isGenerating}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', isGenerating && 'animate-spin')} />
            {t('dashboard.regenerateBirthdayMessage')}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={!message.trim() || deliveryChannels.length === 0}
              className={cn(buttonVariants({ variant: 'default' }), 'gap-2')}
            >
              <Send className="h-4 w-4" />
              {t('common.send')}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {deliveryChannels.map((channel) => {
                const Icon = channel.icon
                return (
                  <DropdownMenuItem key={channel.key} onClick={() => void handleSend(channel)} className="gap-2">
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors',
                        channel.color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{channel.title}</span>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </DialogContent>
  )
}
