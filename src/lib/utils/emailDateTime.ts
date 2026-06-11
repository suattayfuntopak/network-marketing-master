/** E-posta gövdesindeki tarih/saat — her zaman Türkiye (UTC+3). */
const ISTANBUL = 'Europe/Istanbul'

export function formatEmailDateTime(
  date: Date = new Date(),
  lang: 'tr' | 'en' = 'tr',
): string {
  const locale = lang === 'en' ? 'en-GB' : 'tr-TR'
  return date.toLocaleString(locale, {
    timeZone: ISTANBUL,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatEmailDate(
  isoOrDate: string | Date,
  lang: 'tr' | 'en' = 'tr',
): string {
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  const locale = lang === 'en' ? 'en-US' : 'tr-TR'
  return date.toLocaleDateString(locale, {
    timeZone: ISTANBUL,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
