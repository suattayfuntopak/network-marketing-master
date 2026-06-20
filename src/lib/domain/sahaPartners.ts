// Saha Ortakları eşleştirme — "katildi" aşamasındaki adaylardan, workspace üyesiyle
// (NMM uygulama kullanıcısı) eşleşMEYENLER. Türkçe-duyarlı isim normalizasyonu ile
// isim çakışması ararız; eşleşen aday zaten ekip üyesi olarak listelenir, tekrar
// "saha ortağı" sayılmaz. İstatistik perf tablosu ve süper-admin YZ tablosu paylaşır.

/** Türkçe-duyarlı isim normalizasyonu (EkipPanel cleanStr ile birebir aynı olmalı). */
export function normalizeName(s: string | null | undefined): string {
  return (s ?? '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export function matchUnlinkedKatildiCandidates<
  C extends { stage: string | null; full_name: string | null },
  M extends { full_name: string | null },
>(candidates: C[], members: M[]): C[] {
  return candidates
    .filter(c => c.stage === 'katildi')
    .filter(c => !members.some(m => {
      const mf = normalizeName(m.full_name)
      const cf = normalizeName(c.full_name)
      if (!mf || !cf) return false
      if (mf.includes(cf) || cf.includes(mf)) return true
      const mWords = (m.full_name ?? '')
        .split(/\s+/)
        .map(w => normalizeName(w))
        .filter(w => w.length >= 3)
      return mWords.some(w => cf.includes(w))
    }))
}
