import type { ContactWithTags } from './types'
import { STAGE_LABELS, SOURCE_LABELS, CONTACT_TYPE_LABELS } from './constants'

export function exportContactsToCSV(contacts: ContactWithTags[]): void {
  const headers = [
    'Ad Soyad', 'Takma Ad', 'Telefon', 'WhatsApp', 'Telegram', 'Email', 'Instagram',
    'Şehir', 'Meslek', 'İlişki', 'Kaynak', 'Kontak Türü', 'Aşama', 'Sıcaklık',
    'Etiketler', 'Son Temas', 'Notlar', 'Eklenme Tarihi',
  ]

  const rows = contacts.map((c) => [
    c.full_name,
    c.nickname ?? '',
    c.phone ?? '',
    c.whatsapp ?? '',
    c.telegram ?? '',
    c.email ?? '',
    c.instagram ?? '',
    c.city ?? '',
    c.occupation ?? '',
    c.relationship ?? '',
    SOURCE_LABELS[c.source],
    CONTACT_TYPE_LABELS[c.contact_type],
    STAGE_LABELS[c.stage],
    String(c.warmth_score),
    c.tags.map((t) => t.name).join('; '),
    c.last_contact_at ? new Date(c.last_contact_at).toLocaleDateString('tr-TR') : '',
    c.notes ?? '',
    new Date(c.created_at).toLocaleDateString('tr-TR'),
  ])

  const escape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  const csv =
    [headers, ...rows]
      .map((row) => row.map(escape).join(','))
      .join('\n')

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kontaklar_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
