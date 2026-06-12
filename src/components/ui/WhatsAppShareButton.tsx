'use client'

import { WhatsAppIcon } from './WhatsAppIcon'
import { whatsappShareUrl } from '@/lib/utils/waLink'

/**
 * "Bir kişiye gönder" WhatsApp paylaşım butonu. Telefon vermez → wa.me/?text=...
 * WhatsApp açılır, kullanıcı alıcıyı kendisi seçer, hazır metin gelir.
 * Edit/sil ikonlarıyla aynı boyut/renkte (gri, hover yeşil).
 */
export function WhatsAppShareButton({
  text,
  title,
  className,
}: {
  text: string
  title: string
  className?: string
}) {
  return (
    <a
      href={whatsappShareUrl(text)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      title={title}
      aria-label={title}
      className={
        className ??
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-3)] transition-all hover:scale-105 hover:bg-[#E7FBF0] hover:text-[#1a9e4f] dark:hover:bg-[#0d2e1a]/40 dark:hover:text-[#4ade80]'
      }
    >
      <WhatsAppIcon className="h-4 w-4 fill-current" />
    </a>
  )
}
