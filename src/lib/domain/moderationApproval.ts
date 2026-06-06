/** Onay öncesi custom içeriğe kalıcı EN çevirileri ekler (CLAUDE.md kuralı). */

export type ModerationTranslator = (text: string) => Promise<string>

async function translateOptional(
  text: string | undefined,
  translate: ModerationTranslator,
): Promise<string> {
  const trimmed = (text ?? '').trim()
  if (!trimmed) return ''
  return translate(trimmed)
}

export async function enrichApprovedModerationData(
  contentType: 'training' | 'objection',
  data: Record<string, unknown>,
  translateTrToEn: ModerationTranslator,
): Promise<Record<string, unknown>> {
  if (contentType === 'objection') {
    const soru = data.soru as { tr?: string; en?: string } | string | undefined
    const kategori = data.kategori as { tr?: string; en?: string } | string | undefined
    const soruTr = typeof soru === 'string' ? soru : (soru?.tr ?? '')
    const kategoriTr = typeof kategori === 'string' ? kategori : (kategori?.tr ?? '')

    const [soruEn, kategoriEn, kisaEn, detayEn, yaklasimEn, diyalogEn] = await Promise.all([
      translateOptional(soruTr, translateTrToEn),
      translateOptional(kategoriTr, translateTrToEn),
      translateOptional(data.kisaCevap as string | undefined, translateTrToEn),
      translateOptional(data.detayliCevap as string | undefined, translateTrToEn),
      translateOptional(data.yaklasim as string | undefined, translateTrToEn),
      translateOptional(data.ornekDiyalog as string | undefined, translateTrToEn),
    ])

    return {
      ...data,
      soru: { tr: soruTr, en: soruEn || soruTr },
      kategori: { tr: kategoriTr, en: kategoriEn || kategoriTr },
      ...(kisaEn ? { kisaCevapEn: kisaEn } : {}),
      ...(detayEn ? { detayliCevapEn: detayEn } : {}),
      ...(yaklasimEn ? { yaklasimEn: yaklasimEn } : {}),
      ...(diyalogEn ? { ornekDiyalogEn: diyalogEn } : {}),
    }
  }

  const baslik = String(data.baslik ?? '')
  const ozet = String(data.ozet ?? '')
  const kategoriBaslik = String(data.kategoriBaslik ?? '')
  const maddeler = Array.isArray(data.maddeler)
    ? (data.maddeler as string[]).map(m => String(m))
    : []

  const [baslikEn, ozetEn, kategoriBaslikEn, ...maddelerEn] = await Promise.all([
    translateOptional(baslik, translateTrToEn),
    translateOptional(ozet, translateTrToEn),
    translateOptional(kategoriBaslik, translateTrToEn),
    ...maddeler.map(m => translateOptional(m, translateTrToEn)),
  ])

  return {
    ...data,
    baslikEn: baslikEn || baslik,
    ozetEn: ozetEn || ozet,
    kategoriBaslikEn: kategoriBaslikEn || kategoriBaslik,
    ...(maddeler.length > 0 ? { maddelerEn } : {}),
  }
}
