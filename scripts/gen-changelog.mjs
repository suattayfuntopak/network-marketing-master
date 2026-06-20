#!/usr/bin/env node
/**
 * CHANGELOG.md üretici — git log'taki conventional-commit'leri tip bazında gruplar.
 * `hot.md` (TR insan-okur günlük) TAMAMLAYICISIDIR; otomatik üretilir.
 *
 * Aralık seçimi:
 *   - `--since <ref>` verilirse `<ref>..HEAD`,
 *   - yoksa en son git tag varsa `<lastTag>..HEAD` (sürüm sistemi gelince otomatik),
 *   - tag da yoksa son `--limit N` commit (vars. 120).
 *
 * Kullanım: npm run changelog            (vars.)
 *           npm run changelog -- --since v1.0.0
 *           npm run changelog -- --limit 50
 *
 * `buildSection`/`getSubjects` ayrıca `release.mjs` tarafından kullanılır (sürüm bölümü).
 */
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

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

export const CHANGELOG_HEADER =
  `# Changelog\n\n` +
  `_Otomatik üretildi (\`npm run changelog\` / \`npm run release\`) — \`hot.md\` (TR insan-okur günlük) tamamlayıcısıdır._\n\n`

export function git(cmd) {
  return execSync(`git ${cmd}`, { encoding: 'utf8' }).trim()
}

function argVal(flag) {
  const i = process.argv.indexOf(flag)
  return i !== -1 ? process.argv[i + 1] : null
}

/** Verilen aralıktaki (no-merge) commit'leri {hash, subject} olarak döndürür. */
export function getCommits({ range = '', extra = '' } = {}) {
  return git(`log ${range} ${extra} --no-merges --pretty=format:%h%x09%s`)
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const tab = line.indexOf('\t')
      return tab === -1
        ? { hash: '', subject: line }
        : { hash: line.slice(0, tab), subject: line.slice(tab + 1) }
    })
}

/**
 * Commit'leri tip bazında gruplayıp tek bir markdown bölümü ("## label (date)\n...")
 * üretir. Her madde sonuna kısa hash eklenir — GitHub release notu / CHANGELOG'da
 * commit'e OTOMATİK linklenir (izlenebilirlik). PR no'su (#123) konuda varsa korunur.
 */
export function buildSection(commits, label, date = new Date().toISOString().slice(0, 10)) {
  const CONV = /^(\w+)(?:\([^)]*\))?(!)?:\s*(.+)$/
  const groups = new Map()
  for (const { hash, subject } of commits) {
    const m = subject.match(CONV)
    const type = m && KNOWN.has(m[1]) ? m[1] : 'other'
    const text = m ? m[3] : subject
    if (!groups.has(type)) groups.set(type, [])
    groups.get(type).push(hash ? `${text} (${hash})` : text)
  }
  let out = `## ${label} (${date})\n\n`
  for (const [type, heading] of SECTIONS) {
    const items = groups.get(type)
    if (!items?.length) continue
    out += `### ${heading}\n${items.map((i) => `- ${i}`).join('\n')}\n\n`
  }
  const other = groups.get('other')
  if (other?.length) out += `### Diğer\n${other.map((i) => `- ${i}`).join('\n')}\n\n`
  return out
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

function main() {
  const { range, label, extra } = resolveLog()
  const commits = getCommits({ range, extra })
  writeFileSync('CHANGELOG.md', CHANGELOG_HEADER + buildSection(commits, label))
  console.log(`✅ CHANGELOG.md üretildi — ${commits.length} commit (${label}).`)
}

// Yalnız doğrudan çalıştırıldığında üret (import edilince fonksiyonlar açıkta kalır).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
}
