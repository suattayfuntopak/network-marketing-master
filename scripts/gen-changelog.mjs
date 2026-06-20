#!/usr/bin/env node
/**
 * CHANGELOG.md üretici — git log'taki conventional-commit'leri tip bazında gruplar.
 * `hot.md` (TR insan-okur günlük) TAMAMLAYICISIDIR; otomatik üretilir, elle düzenlenmez.
 *
 * Aralık seçimi:
 *   - `--since <ref>` verilirse `<ref>..HEAD`,
 *   - yoksa en son git tag varsa `<lastTag>..HEAD` (sürüm sistemi gelince otomatik),
 *   - tag da yoksa son `--limit N` commit (vars. 120).
 *
 * Kullanım: npm run changelog            (vars.)
 *           npm run changelog -- --since v1.0.0
 *           npm run changelog -- --limit 50
 */
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const SECTIONS = [
  ['feat', '✨ Yeni Özellikler'],
  ['fix', '🐛 Düzeltmeler'],
  ['perf', '⚡ Performans'],
  ['refactor', '♻️ Refactor'],
  ['docs', '📝 Dokümantasyon'],
  ['test', '✅ Testler'],
  ['ci', '🤖 CI/CD'],
  ['build', '📦 Build'],
  ['chore', '🧹 Bakım'],
  ['style', '🎨 Stil'],
]
const KNOWN = new Set(SECTIONS.map(([t]) => t))

function git(cmd) {
  return execSync(`git ${cmd}`, { encoding: 'utf8' }).trim()
}

function argVal(flag) {
  const i = process.argv.indexOf(flag)
  return i !== -1 ? process.argv[i + 1] : null
}

function resolveLog() {
  const since = argVal('--since')
  if (since) return { range: `${since}..HEAD`, label: `${since} → HEAD`, extra: '' }
  try {
    const tag = git('describe --tags --abbrev=0')
    if (tag) return { range: `${tag}..HEAD`, label: `${tag} → HEAD`, extra: '' }
  } catch {
    /* tag yok — limite düş */
  }
  const limit = Number(argVal('--limit')) || 120
  return { range: '', label: `son ${limit} commit`, extra: `-n ${limit}` }
}

const { range, label, extra } = resolveLog()
const subjects = git(`log ${range} ${extra} --no-merges --pretty=format:%s`)
  .split('\n')
  .filter(Boolean)

const CONV = /^(\w+)(?:\([^)]*\))?(!)?:\s*(.+)$/
const groups = new Map()
for (const subject of subjects) {
  const m = subject.match(CONV)
  const type = m && KNOWN.has(m[1]) ? m[1] : 'other'
  if (!groups.has(type)) groups.set(type, [])
  groups.get(type).push(m ? m[3] : subject)
}

const date = new Date().toISOString().slice(0, 10)
let out =
  `# Changelog\n\n` +
  `_Otomatik üretildi (\`npm run changelog\`) — \`hot.md\` (TR insan-okur günlük) tamamlayıcısıdır. Elle düzenleme._\n\n` +
  `## ${label} (${date})\n\n`

for (const [type, heading] of SECTIONS) {
  const items = groups.get(type)
  if (!items?.length) continue
  out += `### ${heading}\n${items.map((i) => `- ${i}`).join('\n')}\n\n`
}
const other = groups.get('other')
if (other?.length) {
  out += `### Diğer\n${other.map((i) => `- ${i}`).join('\n')}\n\n`
}

writeFileSync('CHANGELOG.md', out)
console.log(`✅ CHANGELOG.md üretildi — ${subjects.length} commit (${label}).`)
