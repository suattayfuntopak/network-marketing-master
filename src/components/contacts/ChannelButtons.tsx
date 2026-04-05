import { Phone, Mail, MessageCircle, Send, Camera } from 'lucide-react'
import type { Contact } from '@/types/database'
import { cn } from '@/lib/utils'

interface ChannelButtonsProps {
  contact: Contact
  size?: 'sm' | 'default'
  className?: string
}

export function ChannelButtons({ contact, size = 'default', className }: ChannelButtonsProps) {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const btnSize = size === 'sm' ? 'p-1' : 'p-1.5'

  const channels = [
    {
      key: 'whatsapp',
      icon: MessageCircle,
      href: contact.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}` : null,
      label: 'WhatsApp',
      color: 'hover:text-green-600 dark:hover:text-green-400',
    },
    {
      key: 'phone',
      icon: Phone,
      href: contact.phone ? `tel:${contact.phone}` : null,
      label: 'Telefon',
      color: 'hover:text-blue-600 dark:hover:text-blue-400',
    },
    {
      key: 'email',
      icon: Mail,
      href: contact.email ? `mailto:${contact.email}` : null,
      label: 'Email',
      color: 'hover:text-purple-600 dark:hover:text-purple-400',
    },
    {
      key: 'telegram',
      icon: Send,
      href: contact.telegram ? `https://t.me/${contact.telegram.replace('@', '')}` : null,
      label: 'Telegram',
      color: 'hover:text-sky-600 dark:hover:text-sky-400',
    },
    {
      key: 'instagram',
      icon: Camera,
      href: contact.instagram
        ? `https://instagram.com/${contact.instagram.replace('@', '')}`
        : null,
      label: 'Instagram',
      color: 'hover:text-pink-600 dark:hover:text-pink-400',
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
