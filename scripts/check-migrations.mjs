#!/usr/bin/env node
/**
 * Validates supabase/migrations numbering before deploy.
 * Run: npm run migrate:check
 * Remote drift (opsiyonel): npm run migrate:check -- --remote
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const REMOTE = process.argv.includes('--remote')
const MIGRATIONS_DIR = join(process.cwd(), 'supabase/migrations')
const files = readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort()

const byNumber = new Map()
let errors = 0
let warnings = 0

for (const file of files) {
  const m = file.match(/^(\d+)_/)
  if (!m) {
    console.error(`✗ ${file} — dosya adı NNN_description.sql formatında olmalı`)
    errors++
    continue
  }
  const num = Number(m[1])
  const list = byNumber.get(num) ?? []
  list.push(file)
  byNumber.set(num, list)
}

const numbers = [...byNumber.keys()].sort((a, b) => a - b)
let prev = 0
for (const n of numbers) {
  if (n !== prev + 1 && prev !== 0) {
    console.warn(`⚠ Numara boşluğu: ${prev} → ${n} (arada migration eksik olabilir)`)
    warnings++
  }
  prev = n
  const list = byNumber.get(n)
  if (list.length > 1) {
    console.warn(`⚠ Çakışan numara ${String(n).padStart(3, '0')}: ${list.join(', ')}`)
    warnings++
  }
}

const latest = numbers.at(-1)
const latestFile = latest != null ? byNumber.get(latest)?.[0] : null
const localVersions = new Set(
  files.map(f => {
    const m = f.match(/^(\d+)_/)
    return m ? String(Number(m[1])).padStart(3, '0') : null
  }).filter(Boolean),
)

console.log(`\n${files.length} migration dosyası, son: ${latestFile ?? '—'}`)

if (latestFile) {
  const body = readFileSync(join(MIGRATIONS_DIR, latestFile), 'utf8')
  if (/057_day_journal/.test(latestFile) || body.includes('nmm_day_journal')) {
    console.log('\n📋 Deploy checklist (057_day_journal):')
    console.log('   1. supabase db push  (veya Dashboard SQL editor)')
    console.log('   2. RLS policy doğrula')
    console.log('   3. docs/smoke/day-journal-cross-device.md smoke test')
  }
}

if (REMOTE) {
  console.log('\n🔗 Remote migration diff (supabase CLI — linked project gerekir):')
  try {
    const output = execSync('npx supabase migration list --linked 2>&1', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    const applied = new Set()
    for (const line of output.split('\n')) {
      const m = line.match(/\|\s*(\d{3})\s*\|/)
      if (m) applied.add(m[1])
    }
    const pendingLocal = [...localVersions].filter(v => !applied.has(v))
    const remoteOnly = [...applied].filter(v => !localVersions.has(v))
    if (pendingLocal.length) {
      console.warn(`⚠ Remote'da henüz yok (local): ${pendingLocal.join(', ')}`)
      warnings++
    }
    if (remoteOnly.length) {
      console.warn(`⚠ Remote'da var, repoda yok: ${remoteOnly.join(', ')}`)
      warnings++
    }
    if (!pendingLocal.length && !remoteOnly.length && applied.size > 0) {
      console.log('✓ Local dosya numaraları ile linked remote listesi uyumlu görünüyor')
    }
    if (applied.size === 0) {
      console.log('ℹ Remote liste boş veya parse edilemedi — `supabase link` + `migration list` kontrol et')
    }
  } catch {
    console.log('ℹ Remote diff atlandı — `supabase link` ve CLI login gerekli (`npm run migrate:check -- --remote`)')
  }
}

console.log(
  errors === 0
    ? `\n✓ Numara doğrulaması geçti${warnings ? ` (${warnings} uyarı)` : ''}`
    : `\n✗ ${errors} hata — deploy öncesi düzelt`,
)

process.exit(errors > 0 ? 1 : 0)
