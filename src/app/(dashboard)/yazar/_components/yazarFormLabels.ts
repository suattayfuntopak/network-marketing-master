/**
 * YazarForm seçenek verileri — mesaj türü ve ton etiketleri.
 * Değerler AI prompt'una TR anahtar olarak gider; görünen etiket dile göre çözülür.
 */

export const MESSAGE_TYPES = [
  { value: 'genel', label: 'Genel' },
  { value: 'ilk_temas', label: 'İlk Temas' },
  { value: 'bag_kurma', label: 'Bağ Kurma' },
  { value: 'deger_paylasimi', label: 'Değer Paylaşımı' },
  { value: 'davet', label: 'Davet' },
  { value: 'sunum', label: 'Sunum' },
  { value: 'takip', label: 'Takip' },
  { value: 'itiraz_yonetimi', label: 'İtiraz Yönetimi' },
  { value: 'karar_asamasi', label: 'Karar Aşaması' },
  { value: 'hayir_sonrasi', label: 'Hayır Sonrası' },
  { value: 'yeniden_bag', label: 'Yeniden Bağ' },
  { value: 'dogum_gunu', label: 'Doğum Günü' },
  { value: 'evlilik_yildonumu', label: 'Evlilik Yıldönümü' },
  { value: 'tesekkur', label: 'Teşekkür' },
  { value: 'yeni_uye_karsilama', label: 'Yeni Üye Karşılama' },
]

export const TONES = [
  { value: 'samimi', label: 'Samimi' },
  { value: 'profesyonel', label: 'Profesyonel' },
  { value: 'merakli', label: 'Meraklı' },
  { value: 'empatik', label: 'Empatik' },
  { value: 'kendinden_emin', label: 'Kendinden Emin' },
  { value: 'esprili', label: 'Esprili' },
  { value: 'net', label: 'Net' },
  { value: 'motive_edici', label: 'Motive Edici' },
]

const MESSAGE_TYPE_LABELS_TR: Record<string, string> = {
  genel: 'Genel',
  ilk_temas: 'İlk Temas',
  bag_kurma: 'Bağ Kurma',
  deger_paylasimi: 'Değer Paylaşımı',
  davet: 'Davet',
  sunum: 'Sunum',
  takip: 'Takip',
  itiraz_yonetimi: 'İtiraz Yönetimi',
  karar_asamasi: 'Karar Aşaması',
  hayir_sonrasi: 'Hayır Sonrası',
  yeniden_bag: 'Yeniden Bağ',
  dogum_gunu: 'Doğum Günü',
  evlilik_yildonumu: 'Evlilik Yıldönümü',
  tesekkur: 'Teşekkür',
  yeni_uye_karsilama: 'Yeni Üye Karşılama',
}

const MESSAGE_TYPE_LABELS_EN: Record<string, string> = {
  genel: 'General',
  ilk_temas: 'First Contact',
  bag_kurma: 'Connecting',
  deger_paylasimi: 'Sharing Value',
  davet: 'Invite',
  sunum: 'Presentation',
  takip: 'Follow-up',
  itiraz_yonetimi: 'Objection Handling',
  karar_asamasi: 'Decision Phase',
  hayir_sonrasi: 'Post-Rejection',
  yeniden_bag: 'Reconnecting',
  dogum_gunu: 'Birthday',
  evlilik_yildonumu: 'Wedding Anniversary',
  tesekkur: 'Thank You',
  yeni_uye_karsilama: 'New Member Welcome',
}

const TONE_LABELS_TR: Record<string, string> = {
  samimi: 'Samimi',
  profesyonel: 'Profesyonel',
  merakli: 'Meraklı',
  empatik: 'Empatik',
  kendinden_emin: 'Kendinden Emin',
  esprili: 'Esprili',
  net: 'Net',
  motive_edici: 'Motive Edici',
}

const TONE_LABELS_EN: Record<string, string> = {
  samimi: 'Warm',
  profesyonel: 'Professional',
  merakli: 'Curious',
  empatik: 'Empathetic',
  kendinden_emin: 'Confident',
  esprili: 'Humorous',
  net: 'Direct',
  motive_edici: 'Motivating',
}

export function getMessageTypeLabel(val: string, lang: 'tr' | 'en'): string {
  return (lang === 'en' ? MESSAGE_TYPE_LABELS_EN : MESSAGE_TYPE_LABELS_TR)[val] || val
}

export function getToneLabel(val: string, lang: 'tr' | 'en'): string {
  return (lang === 'en' ? TONE_LABELS_EN : TONE_LABELS_TR)[val] || val
}
