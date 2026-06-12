function toWaNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // International format (+XX...): strip the + and use directly
  if (phone.trimStart().startsWith('+')) return digits
  // Turkish local formats
  if (digits.startsWith('90') && digits.length >= 11) return digits
  if (digits.startsWith('0') && digits.length === 11) return '9' + digits
  return '90' + digits
}

export function waHref(phone: string | null | undefined, text?: string): string | null {
  if (!phone) return null
  const number = toWaNumber(phone)
  if (number.length < 10) return null
  const base = `https://wa.me/${number}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

/**
 * Alıcı belirtmeden WhatsApp paylaşımı — kullanıcı kişiyi WhatsApp'ta kendi seçer.
 * Dağınık `wa.me/?text=` / `api.whatsapp.com/send?text=` kullanımlarını tek yerde toplar.
 */
export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
