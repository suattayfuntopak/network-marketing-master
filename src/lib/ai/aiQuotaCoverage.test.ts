import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

/**
 * YAPISAL GÜVENLİK: Her kullanıcı-tetikli YZ ÜRETİM noktası plan kotasına bağlı
 * olmalı — yani aynı dosyada hem `checkAIQuota(` (limit kapısı) hem `logAIGeneration(`
 * (ai_generate kaydı → günlük havuzdan düşüş) çağrılmalı. Aksi halde buton "boşta"
 * kalır: Basic kullanıcı 20 mesaj limitini hiç tüketmeden sınırsız üretir.
 *
 * Kota bağlama MANUEL (her action kendi çağırır). Bu test, yeni bir YZ butonu
 * eklenip kota unutulduğunda /health test adımında patlar → regresyon kapısı.
 *
 * Gemini'ye erişim iki biçimde olur:
 *   - `generateMessage(...)`  (merkezi yardımcı, lib/ai/generateMessage.ts)
 *   - `model.generateContent(...)`  (action içi doğrudan Gemini çağrısı)
 */

const SRC = path.resolve(__dirname, '../..')

// generateMessage'ın TANIMI (çağrı değil) ve kota yardımcısının kendisi hariç.
const SELF_EXCLUDE = new Set([
  path.join(SRC, 'lib/ai/generateMessage.ts'),
  path.join(SRC, 'lib/ai/checkQuota.ts'),
])

/**
 * Altyapısal çeviri carve-out'u (CLAUDE.md Dil Politikası): kullanıcı içeriği DB'ye
 * yazılmadan ÖNCE kalıcı TR|||EN çevirisi üretilir. Bu kayıt-anı otomatik çeviridir,
 * kullanıcının tıkladığı tekrarlanabilir bir "üret" butonu değildir → kotaya yazılmaz.
 * Tek generateContent çağrısı çeviri olan ve bu yüzden checkAIQuota içermeyen dosyalar:
 */
const TRANSLATION_ONLY_WHITELIST = new Set([
  path.join(SRC, 'app/(dashboard)/itirazlar/actions.ts'),
])

const AI_CALL = /(?:\.generateContent\s*\(|(?<![A-Za-z])generateMessage\s*\()/
const HAS_QUOTA_GATE = /checkAIQuota\s*\(/
// logAIGeneration(...) veya ergonomik logAIGenerationFromQuota(quota, ...)
const HAS_USAGE_LOG = /logAIGeneration(?:FromQuota)?\s*\(/

function collectTsFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const full = path.join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      out.push(...collectTsFiles(full))
    } else if (
      (entry.endsWith('.ts') || entry.endsWith('.tsx')) &&
      !entry.endsWith('.test.ts') &&
      !entry.endsWith('.test.tsx')
    ) {
      out.push(full)
    }
  }
  return out
}

describe('AI quota coverage — boşta üretim butonu yok', () => {
  const files = collectTsFiles(SRC)
  const aiGenerationFiles = files.filter((f) => {
    if (SELF_EXCLUDE.has(f)) return false
    return AI_CALL.test(readFileSync(f, 'utf8'))
  })

  it('YZ üretim yapan en az bir action dosyası tespit edildi (tarama sağlıklı)', () => {
    // Tarama bozulursa (yol/regex) sessizce 0 dosya bulup yeşil kalmasın.
    expect(aiGenerationFiles.length).toBeGreaterThan(5)
  })

  it.each(aiGenerationFiles.map((f) => [path.relative(SRC, f), f] as const))(
    '%s → checkAIQuota + logAIGeneration ile kotaya bağlı (veya çeviri whitelist)',
    (_rel, full) => {
      if (TRANSLATION_ONLY_WHITELIST.has(full)) return
      const src = readFileSync(full, 'utf8')
      expect(
        HAS_QUOTA_GATE.test(src),
        `${path.relative(SRC, full)} YZ üretiyor ama checkAIQuota() çağırmıyor — buton kotasız (boşta). Kota kapısı ekle ya da altyapısal çeviriyse TRANSLATION_ONLY_WHITELIST'e gerekçeyle ekle.`,
      ).toBe(true)
      expect(
        HAS_USAGE_LOG.test(src),
        `${path.relative(SRC, full)} YZ üretiyor ama logAIGeneration() çağırmıyor — kullanım günlük havuza yazılmıyor.`,
      ).toBe(true)
    },
  )

  it('çeviri whitelist girdileri gerçekten mevcut (ölü whitelist birikmesin)', () => {
    for (const wl of TRANSLATION_ONLY_WHITELIST) {
      expect(aiGenerationFiles, `${path.relative(SRC, wl)} artık YZ çağırmıyor — whitelist'ten çıkar`).toContain(wl)
    }
  })
})
