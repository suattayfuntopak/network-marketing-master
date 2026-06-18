#!/usr/bin/env node
/**
 * Supabase db push sarmalayıcısı — out-of-order migration (ör. 100 eksik, 101+ uygulanmış)
 * ve defter drift durumlarını yönetir.
 *
 * Kullanım (CI / yerel, link sonrası):
 *   node scripts/supabase-db-push.mjs dry-run
 *   node scripts/supabase-db-push.mjs apply
 *   node scripts/supabase-db-push.mjs repair-gaps
 */
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const mode = process.argv[2] ?? 'dry-run'
const MIGRATIONS_DIR = join(process.cwd(), 'supabase/migrations')

function localVersions() {
  return readdirSync(MIGRATIONS_DIR)
    .filter(f => /^\d+_.*\.sql$/.test(f))
    .map(f => Number(f.match(/^(\d+)_/)[1]))
    .sort((a, b) => a - b)
}

function padVersion(n) {
  return String(n).padStart(3, '0')
}

function run(cmd, { allowFail = false } = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  } catch (err) {
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}`
    if (allowFail) return out
    err.combined = out
    throw err
  }
}

function parseAppliedVersions(listOutput) {
  const applied = new Set()
  for (const line of listOutput.split('\n')) {
    const m = line.match(/\|\s*(\d{3})\s*\|/)
    if (m) applied.add(Number(m[1]))
  }
  return applied
}

function detectGaps(local, applied) {
  const maxApplied = applied.size ? Math.max(...applied) : 0
  const gaps = []
  for (const v of local) {
    if (v <= maxApplied && !applied.has(v)) gaps.push(v)
  }
  return gaps
}

function migrationList() {
  return run('npx supabase migration list --linked 2>&1', { allowFail: true })
}

const local = localVersions()
const listOut = migrationList()
const applied = parseAppliedVersions(listOut)
const gaps = detectGaps(local, applied)
const pending = local.filter(v => !applied.has(v))

console.log(`📋 Local: ${local.length} migration, remote applied: ${applied.size}`)
if (gaps.length) {
  console.warn(`⚠ Defter boşluğu (yüksek numara uygulanmış, ara eksik): ${gaps.map(padVersion).join(', ')}`)
  console.warn('  → SQL zaten uygulandıysa: repair-gaps. Henüz uygulanmadıysa: apply (--include-all).')
}
if (pending.length) {
  console.log(`▶ Bekleyen (remote'da yok): ${pending.map(padVersion).join(', ')}`)
}

if (mode === 'repair-gaps') {
  if (!gaps.length) {
    console.log('✅ Defter boşluğu yok — repair-gaps gerekmez.')
    process.exit(0)
  }
  const args = gaps.map(padVersion).join(' ')
  console.log(`▶ repair --status applied: ${args}`)
  run(`npx supabase migration repair --status applied ${args}`)
  console.log('✅ Defter boşlukları işaretlendi. dry-run ile doğrulayın.')
  process.exit(0)
}

const includeAll = gaps.length > 0 || pending.some(v => applied.size > 0 && v < Math.max(...applied))
const pushFlags = includeAll ? '--include-all' : ''

if (mode === 'dry-run') {
  console.log(`▶ supabase db push --dry-run ${pushFlags}`.trim())
  try {
    run(`npx supabase db push --dry-run ${pushFlags}`.trim())
    console.log('✅ Dry-run tamam — uygulanacak bekleyen migration yok veya listelendi.')
  } catch (err) {
    console.error(err.combined ?? err.message)
    if (gaps.length) {
      console.error('\n💡 Öneri: GitHub Actions → DB migrate (prod) → mode=repair-gaps, confirm=PUSH')
    }
    process.exit(1)
  }
  process.exit(0)
}

if (mode === 'apply') {
  console.log(`▶ supabase db push ${pushFlags}`.trim())
  try {
    run(`npx supabase db push ${pushFlags}`.trim())
    console.log('✅ Migration push tamamlandı.')
  } catch (err) {
    console.error(err.combined ?? err.message)
    process.exit(1)
  }
  process.exit(0)
}

console.error(`Bilinmeyen mod: ${mode} (dry-run | apply | repair-gaps)`)
process.exit(1)
