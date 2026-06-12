#!/usr/bin/env node
/**
 * Rota hız baseline'ı — TTFB (time-to-first-byte) ölçer.
 *
 * Amaç: "vasat UX" hissinin sayısal kökünü görmek. Memory'deki tahmin Supabase
 * origin'in uzak olması (~320ms/sorgu); bu script onu ÖLÇER → bölge taşıma
 * kararına veri sağlar. Frontend optimizasyonu bu sayıyı GİZLER, SİLMEZ.
 *
 * Kullanım:
 *   # 1) Uygulamayı çalıştır:  npm run build && npm run start   (veya npm run dev)
 *   # 2) Public rotalar:        node scripts/perf-baseline.mjs
 *   # 3) Auth'lu rotalar da:    NMM_COOKIE="sb-...=...; ..." node scripts/perf-baseline.mjs
 *        (Cookie'yi tarayıcı DevTools → Application → Cookies'ten kopyala.)
 *
 * Ortam değişkenleri:
 *   BASE_URL   (varsayılan http://localhost:3000)
 *   NMM_COOKIE (auth'lu rotalar için oturum cookie'si; yoksa atlanır)
 *   SAMPLES    (rota başına örnek sayısı; varsayılan 8)
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const COOKIE = process.env.NMM_COOKIE ?? ''
const SAMPLES = Number(process.env.SAMPLES ?? 8)

const PUBLIC_ROUTES = ['/', '/giris', '/kayit']
// Ana dashboard rotaları — yalnızca NMM_COOKIE verilince ölçülür.
const AUTH_ROUTES = [
  '/pano',
  '/pipeline',
  '/ekip',
  '/saha-ozetim',
  '/istatistikler',
]

function percentile(sorted, p) {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[idx]
}

async function measure(route) {
  const url = BASE_URL + route
  const ttfbs = []
  let lastStatus = 0
  for (let i = 0; i < SAMPLES; i++) {
    const start = performance.now()
    try {
      const res = await fetch(url, {
        headers: COOKIE ? { cookie: COOKIE } : {},
        redirect: 'manual',
      })
      // İlk byte ~ response header'ları geldiğinde; body'yi de tüketip bitir.
      const ttfb = performance.now() - start
      await res.arrayBuffer()
      ttfbs.push(ttfb)
      lastStatus = res.status
    } catch (err) {
      console.error(`  ! ${route} fetch hatası:`, err.message)
    }
  }
  ttfbs.sort((a, b) => a - b)
  return {
    route,
    status: lastStatus,
    n: ttfbs.length,
    p50: Math.round(percentile(ttfbs, 50)),
    p95: Math.round(percentile(ttfbs, 95)),
  }
}

async function main() {
  const routes = [...PUBLIC_ROUTES, ...(COOKIE ? AUTH_ROUTES : [])]
  console.log(`\n🏁 Perf baseline → ${BASE_URL}  (örnek/rota: ${SAMPLES})`)
  if (!COOKIE) {
    console.log('   ℹ️  NMM_COOKIE yok → yalnız public rotalar. Authlu rotalar için cookie ver.\n')
  } else {
    console.log('')
  }
  const rows = []
  for (const route of routes) {
    process.stdout.write(`   ölçülüyor ${route} ...\r`)
    rows.push(await measure(route))
  }
  console.log('   ' + 'Rota'.padEnd(20) + 'Durum'.padEnd(8) + 'p50(ms)'.padEnd(10) + 'p95(ms)')
  console.log('   ' + '-'.repeat(46))
  for (const r of rows) {
    const warn = r.p50 > 600 ? '  ⚠️ yavaş' : ''
    console.log(
      '   ' + r.route.padEnd(20) + String(r.status).padEnd(8) +
      String(r.p50).padEnd(10) + String(r.p95) + warn,
    )
  }
  console.log('\n   p50 > ~600ms olan rotalar bölge/round-trip darboğazının işareti.\n')
}

main()
