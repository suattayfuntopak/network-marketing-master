import type { ModerationContentType } from '@/app/(dashboard)/actions/moderation'

const LINK_PREFIX = 'NMM_LINK:'

/** Onay bildiriminde tıklanacak rota — e-posta deep link ile aynı hedefler. */
export function moderationApprovedHref(
  contentType: ModerationContentType,
  itemKey: string,
): string {
  const encoded = encodeURIComponent(itemKey)
  if (contentType === 'training') {
    return `/egitim?tab=training&id=${encoded}&highlight=1`
  }
  if (contentType === 'video') {
    return `/egitim?tab=videos&highlight=${encoded}`
  }
  return `/egitim?tab=objections&id=${encoded}&highlight=1`
}

export function embedNotificationActionLink(href: string, humanText: string): string {
  return `${LINK_PREFIX}${href}\n${humanText}`
}

export function parseNotificationDescription(raw: string): { href: string | null; text: string } {
  if (!raw.startsWith(LINK_PREFIX)) return { href: null, text: raw }
  const nl = raw.indexOf('\n')
  if (nl === -1) return { href: null, text: raw }
  return {
    href: raw.slice(LINK_PREFIX.length, nl),
    text: raw.slice(nl + 1),
  }
}

export function isModerationApprovalNotification(n: {
  title_tr?: string | null
  title_en?: string | null
}): boolean {
  const tr = n.title_tr ?? ''
  const en = n.title_en ?? ''
  return tr.includes('İçerik talebin onaylandı') || en.includes('submission was approved')
}
