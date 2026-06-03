/**
 * Telefon numarasını sadeleştirir: boşluk/tire/parantez/nokta atılır, baştaki +
 * korunur. (Türk yerel formatı "0555 123 45 67" → "05551234567".)
 */
export function sanitizePhone(raw: string): string {
  const trimmed = (raw ?? '').trim()
  const plus = trimmed.startsWith('+') ? '+' : ''
  return plus + trimmed.replace(/\D/g, '')
}

/**
 * 7-15 hane, opsiyonel +. BAŞTAKİ 0'A İZİN VERİR — Türk yerel formatı "05xx..."
 * (11 hane) buradan geçer. waLink (toWaNumber) baştaki 0'ı 90 ile değiştirir.
 * Doğrulamadan ÖNCE sanitizePhone ile sadeleştir.
 */
export const PHONE_RE = /^\+?\d{7,15}$/
