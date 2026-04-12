import { Phone, Mail } from 'lucide-react'
import { SiWhatsapp, SiTelegram, SiInstagram } from 'react-icons/si'
import type { Contact } from '@/types/database'
import { cn } from '@/lib/utils'

type ChannelContact = Pick<Contact, 'phone' | 'whatsapp' | 'telegram' | 'email' | 'instagram'>

interface ChannelButtonsProps {
  contact: ChannelContact
  size?: 'sm' | 'default'
  className?: string
}

export function ChannelButtons({ contact, size = 'default', className }: ChannelButtonsProps) {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const btnSize = size === 'sm' ? 'p-1' : 'p-1.5'
  const whatsappValue = contact.whatsapp?.trim() || null

  const buildWhatsAppHref = (value: string | null) => {
    if (!value) return null

    const normalized = value.trim()
    const digits = normalized.replace(/\D/g, '')

    if (digits) return `https://wa.me/${digits}`
    if (/^https?:\/\//i.test(normalized)) return normalized

    return `https://wa.me/${normalized.replace(/^@/, '')}`
  }

  const channels = [
    {
      key: 'phone',
      icon: Phone,
      href: contact.phone ? `tel:${contact.phone}` : null,
      label: 'Telefon',
      color: 'hover:bg-primary hover:text-primary-foreground',
    },
    {
      key: 'whatsapp',
      icon: SiWhatsapp,
      href: buildWhatsAppHref(whatsappValue),
      label: 'WhatsApp',
      color: 'text-[#25D366] hover:bg-[#25D366] hover:text-white',
    },
    {
      key: 'telegram',
      icon: SiTelegram,
      href: contact.telegram ? `https://t.me/${contact.telegram.replace('@', '')}` : null,
      label: 'Telegram',
      color: 'hover:bg-sky-500 hover:text-white',
    },
    {
      key: 'email',
      icon: Mail,
      href: contact.email ? `mailto:${contact.email}` : null,
      label: 'Email',
      color: 'hover:bg-violet-500 hover:text-white',
    },
    {
      key: 'instagram',
      icon: SiInstagram,
      href: contact.instagram
        ? `https://instagram.com/${contact.instagram.replace('@', '')}`
        : null,
      label: 'Instagram',
      color: 'hover:bg-pink-500 hover:text-white',
    },
  ]

  const available = channels.filter((c) => c.href !== null)

  if (available.length === 0) return null

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {available.map(({ key, icon: Icon, href, label, color }) => (
        <a
          key={key}
          href={href!}
          target="_blank"
          rel="noopener noreferrer"
          title={label}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'rounded-md text-muted-foreground transition-colors',
            btnSize,
            color
          )}
        >
          <Icon className={iconSize} />
        </a>
      ))}
    </div>
  )
}
