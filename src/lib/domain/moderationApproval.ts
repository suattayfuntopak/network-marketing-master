/** Onay öncesi custom içeriğe kalıcı EN çevirileri ekler (CLAUDE.md kuralı). */

export type ModerationTranslator = (text: string) => Promise<string>

async function translateIfMissing(
  existingEn: string | undefined,
  trSource: string | undefined,
  translate: ModerationTranslator,
): Promise<string> {
  const existing = (existingEn ?? '').trim()
  if (existing) return existing
  const trimmed = (trSource ?? '').trim()
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
    const soruExistingEn = typeof soru === 'object' ? soru?.en : undefined
    const kategoriTr = typeof kategori === 'string' ? kategori : (kategori?.tr ?? '')
    const kategoriExistingEn = typeof kategori === 'object' ? kategori?.en : undefined

    const [soruEn, kategoriEn, kisaEn, detayEn, yaklasimEn, diyalogEn] = await Promise.all([
      translateIfMissing(soruExistingEn, soruTr, translateTrToEn),
      translateIfMissing(kategoriExistingEn, kategoriTr, translateTrToEn),
      translateIfMissing(data.kisaCevapEn as string | undefined, data.kisaCevap as string | undefined, translateTrToEn),
      translateIfMissing(data.detayliCevapEn as string | undefined, data.detayliCevap as string | undefined, translateTrToEn),
      translateIfMissing(data.yaklasimEn as string | undefined, data.yaklasim as string | undefined, translateTrToEn),
      translateIfMissing(data.ornekDiyalogEn as string | undefined, data.ornekDiyalog as string | undefined, translateTrToEn),
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
  const existingMaddelerEn = Array.isArray(data.maddelerEn)
    ? (data.maddelerEn as string[])
    : []

  const [baslikEn, ozetEn, kategoriBaslikEn, ...maddelerEn] = await Promise.all([
    translateIfMissing(data.baslikEn as string | undefined, baslik, translateTrToEn),
    translateIfMissing(data.ozetEn as string | undefined, ozet, translateTrToEn),
    translateIfMissing(data.kategoriBaslikEn as string | undefined, kategoriBaslik, translateTrToEn),
    ...maddeler.map((m, i) =>
      translateIfMissing(existingMaddelerEn[i], m, translateTrToEn),
    ),
  ])

  return {
    ...data,
    baslikEn: baslikEn || baslik,
    ozetEn: ozetEn || ozet,
    kategoriBaslikEn: kategoriBaslikEn || kategoriBaslik,
    ...(maddeler.length > 0 ? { maddelerEn } : {}),
  }
}
