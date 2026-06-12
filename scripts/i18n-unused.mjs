#!/usr/bin/env node
/**
 * i18n kullanılmayan anahtar dedektörü (ADVISORY).
 *
 * Çeviri SÖZLÜĞÜNDEKİ tam noktalı yolları (ör. `crown.sahaRadarTitle`) toplar ve
 * src/** kaynaklarında bu yol bir string literal olarak HİÇ geçmiyorsa "olası
 * kullanılmayan" diye raporlar. Dinamik erişim (`t(row.labelKey)`) için ilgili
 * anahtarlar genelde başka bir dosyada literal olarak durur → düşük yanlış-pozitif.
 *
 * Çalıştır: `npm run i18n:unused`  (yalnız rapor; CI'yi kırmaz.)
 * Anahtarları okumak için TS'i Node ile sıyırarak yükler (Node 22+).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const TR_DIR = join(ROOT, 'src/lib/translations')

function flatten(obj, prefix = '') {
  const keys = []
  for (const k of Object.keys(obj ?? {})) {
    const v = obj[k]
    const path = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) keys.push(...flatten(v, path))
    else keys.push(path)
  }
  return keys
}

async function loadDict() {
  // Node 22 --experimental-strip-types ile .ts import edilebilir.
  const core = await import(pathToFileURL(join(TR_DIR, 'tr.ts')).href)
  const dictPaths = new Set(flatten(core.tr))
  const sectionsDir = join(TR_DIR, 'sections')
  for (const f of readdirSync(sectionsDir)) {
    if (!f.endsWith('.ts') || f.endsWith('.test.ts')) continue
    const mod = await import(pathToFileURL(join(sectionsDir, f)).href)
    for (const exp of Object.values(mod)) {
      if (exp && typeof exp === 'object' && 'tr' in exp) {
        for (const p of flatten(exp.tr)) dictPaths.add(p)
      }
    }
  }
  return [...dictPaths]
}

function collectSrc(dir, acc) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'translations') continue
      collectSrc(full, acc)
    } else if (['.ts', '.tsx'].includes(extname(name)) && !name.endsWith('.test.ts')) {
      acc.push(readFileSync(full, 'utf8'))
    }
  }
  return acc
}

const allKeys = await loadDict()
const haystack = collectSrc(join(ROOT, 'src'), []).join('\n')

// Dinamik anahtar erişimi: `t(`ns.sub${...}`)` veya `t('ns.sub' + ...)` → bu
// statik önekle BAŞLAYAN tüm anahtarları "kullanılıyor" say (yanlış-pozitif azalt).
const dynamicPrefixes = new Set()
for (const m of haystack.matchAll(/[`'"]([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*\.)\$\{/g)) {
  dynamicPrefixes.add(m[1])
}
for (const m of haystack.matchAll(/['"]([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*\.)['"]\s*\+/g)) {
  dynamicPrefixes.add(m[1])
}
const usedByDynamic = (k) => {
  for (const p of dynamicPrefixes) if (k.startsWith(p)) return true
  return false
}

const unused = allKeys.filter(k => !haystack.includes(k) && !usedByDynamic(k)).sort()

if (unused.length === 0) {
  console.log(`✅ i18n: ${allKeys.length} anahtarın hepsi kaynakta referanslı.`)
} else {
  console.log(`⚠️  i18n: ${unused.length}/${allKeys.length} olası kullanılmayan anahtar`)
  console.log('   (dinamik erişim varsa yanlış-pozitif olabilir; silmeden önce doğrula)\n')
  for (const k of unused) console.log('   • ' + k)
}
