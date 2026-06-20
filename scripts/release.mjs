#!/usr/bin/env node
/**
 * Sürüm yayını — package.json version bump + CHANGELOG bölümü + commit + git tag.
 * PUSH YAPMAZ (güvenli); sonunda `git push --follow-tags` hatırlatır.
 *
 * Kullanım: npm run release            (patch: 0.1.0 → 0.1.1)
 *           npm run release -- minor    (0.1.0 → 0.2.0)
 *           npm run release -- major    (0.1.0 → 1.0.0)
 *
 * Akış: temiz-ağaç kontrolü → version bump → CHANGELOG.md'ye yeni sürüm bölümünü
 * PREPEND (önceki tag..HEAD; geçmiş korunur) → commit `chore(release): vX.Y.Z` → tag vX.Y.Z.
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { CHANGELOG_HEADER, git, getCommits, buildSection } from './gen-changelog.mjs'

function fail(msg) {
  console.error(`❌ ${msg}`)
  process.exit(1)
}

const bump = (process.argv[2] || 'patch').toLowerCase()
if (!['patch', 'minor', 'major'].includes(bump)) {
  fail(`Geçersiz bump türü: "${bump}" (patch | minor | major)`)
}

// 1. Temiz çalışma ağacı zorunlu (release sadece package.json + CHANGELOG'u commit etmeli).
if (git('status --porcelain')) {
  fail('Çalışma ağacı kirli — önce commit/stash yap, sonra release.')
}

// 2. Sürümü hesapla.
const pkgPath = 'package.json'
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
const [maj, min, pat] = String(pkg.version).split('.').map(Number)
if ([maj, min, pat].some((n) => Number.isNaN(n))) {
  fail(`package.json version semver değil: "${pkg.version}"`)
}
const next =
  bump === 'major' ? `${maj + 1}.0.0` : bump === 'minor' ? `${maj}.${min + 1}.0` : `${maj}.${min}.${pat + 1}`
const tag = `v${next}`

// 3. CHANGELOG bölümü — önceki tag..HEAD (yoksa tüm geçmiş).
let range = ''
try {
  const prev = git('describe --tags --abbrev=0')
  if (prev) range = `${prev}..HEAD`
} catch {
  /* ilk sürüm — tüm geçmiş */
}
const section = buildSection(getCommits({ range }), tag)

// 4. Prepend (geçmiş korunur).
const existing = existsSync('CHANGELOG.md') ? readFileSync('CHANGELOG.md', 'utf8') : ''
const body = existing.startsWith(CHANGELOG_HEADER) ? existing.slice(CHANGELOG_HEADER.length) : existing
writeFileSync('CHANGELOG.md', CHANGELOG_HEADER + section + body)

// 5. package.json version bump (2-boşluk + sondaki newline korunur).
pkg.version = next
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

// 6. Commit + tag (push yok).
execSync('git add package.json CHANGELOG.md', { stdio: 'inherit' })
execSync(`git commit -m "chore(release): ${tag}"`, { stdio: 'inherit' })
execSync(`git tag ${tag}`, { stdio: 'inherit' })

console.log(`\n✅ ${tag} hazır (commit + tag oluşturuldu).`)
console.log(`   Yayınlamak için: git push --follow-tags`)
