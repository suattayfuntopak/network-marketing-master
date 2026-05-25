'use client'

import { useState, useMemo } from 'react'
import {
  TrendingUp, Users, Target, Activity, Flame,
  BarChart2, Award, Clock
} from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { useTranslation } from '@/providers/LanguageProvider'
import { ACTIVE_STAGES, HOT_STAGES } from '@/lib/stages'

type PeriodOption = '7d' | '30d' | 'all'

export default function AnalyticsPage() {
  const { lang } = useTranslation()
  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { candidates = [], isLoading: cLoading } = useCandidates(ws?.workspaceId)
  
  const [period, setPeriod] = useState<PeriodOption>('30d')

  // 1. Adayları seçilen periyoda göre filtrele
  const filteredCandidates = useMemo(() => {
    if (period === 'all') return candidates

    const now = new Date()
    const cutoff = new Date()
    if (period === '7d') {
      cutoff.setDate(now.getDate() - 7)
    } else {
      cutoff.setDate(now.getDate() - 30)
    }
    cutoff.setHours(0, 0, 0, 0)

    return candidates.filter(c => {
      const createdAt = new Date(c.created_at)
      return createdAt >= cutoff
    })
  }, [candidates, period])

  // 2. Özet Metrikleri Hesaplama
  const metrics = useMemo(() => {
    const total = filteredCandidates.length
    const active = filteredCandidates.filter(c => ACTIVE_STAGES.includes(c.stage)).length
    const joined = filteredCandidates.filter(c => c.stage === 'katildi').length
    
    // Dönüşüm Oranı (Katıldı / Toplam Aday)
    const conversionRate = total > 0 ? Math.round((joined / total) * 100) : 0

    // Sunum Yapılan Aday Oranı (Sunum / Toplam Aday)
    const presentedCount = filteredCandidates.filter(c => 
      ['sunum', 'takip', 'kararsiz', 'katildi'].includes(c.stage)
    ).length
    const presentationRate = total > 0 ? Math.round((presentedCount / total) * 100) : 0

    return { total, active, joined, conversionRate, presentationRate }
  }, [filteredCandidates])

  // 3. Sıcaklık Dağılımını Hesaplama (Concentric Circle/Donut Data)
  const temperatureData = useMemo(() => {
    const total = filteredCandidates.length
    if (total === 0) return { hot: 0, warm: 0, cold: 0, hotPct: 0, warmPct: 0, coldPct: 0 }

    const hot = filteredCandidates.filter(c => HOT_STAGES.includes(c.stage)).length
    const warm = filteredCandidates.filter(c => ['yeni', 'iletisim', 'kararsiz'].includes(c.stage)).length
    const cold = filteredCandidates.filter(c => ['ilgilenmedi', 'kayboldu', 'pasif'].includes(c.stage)).length

    return {
      hot,
      warm,
      cold,
      hotPct: Math.round((hot / total) * 100),
      warmPct: Math.round((warm / total) * 100),
      coldPct: Math.round((cold / total) * 100),
    }
  }, [filteredCandidates])

  // 4. Dönüşüm Hunisi Kademelerini Hesaplama (Cumulative Waterfall Funnel)
  const funnelSteps = useMemo(() => {
    const total = filteredCandidates.length
    
    // 1. Yeni Aday (Tüm adaylar huninin ağzına girer)
    const step1 = total

    // 2. İletişim Kurulan (Yeni aday aşamasından ileri taşınmışlar)
    const step2 = filteredCandidates.filter(c => c.stage !== 'yeni').length

    // 3. Davet Edilen (İletişim aşamasını da geçmişler)
    const step3 = filteredCandidates.filter(c => !['yeni', 'iletisim'].includes(c.stage)).length

    // 4. Sunum Yapılan (Sunum ve sonrası)
    const step4 = filteredCandidates.filter(c => 
      ['sunum', 'takip', 'kararsiz', 'katildi'].includes(c.stage)
    ).length

    // 5. Takip Edilen (Takip ve sonrası)
    const step5 = filteredCandidates.filter(c => 
      ['takip', 'kararsiz', 'katildi'].includes(c.stage)
    ).length

    // 6. İş Ortağı (Katılanlar)
    const step6 = filteredCandidates.filter(c => c.stage === 'katildi').length

    const steps = [
      { key: 'yeni',      label: lang === 'en' ? 'Total Leads' : 'Yeni Aday',          count: step1, color: '#534AB7' },
      { key: 'iletisim',  label: lang === 'en' ? 'Contacted' : 'İletişim Kurulan',     count: step2, color: '#4169E1' },
      { key: 'davetli',   label: lang === 'en' ? 'Invited' : 'Davet Edilen',         count: step3, color: '#C03E1F' },
      { key: 'sunum',     label: lang === 'en' ? 'Presented' : 'Sunum Yapılan',        count: step4, color: '#0369A1' },
      { key: 'takip',     label: lang === 'en' ? 'Follow-up' : 'Takip Edilen',         count: step5, color: '#854F0B' },
      { key: 'katildi',   label: lang === 'en' ? 'Joined Partner' : 'İş Ortağı (Katıldı)',  count: step6, color: '#065F46' },
    ]

    return steps.map((step, idx) => {
      const pct = total > 0 ? Math.round((step.count / total) * 100) : 0
      const dropFromPrev = idx === 0 ? null : steps[idx - 1].count - step.count
      return { ...step, pct, dropFromPrev }
    })
  }, [filteredCandidates, lang])

  // 5. Kayıt Trendi Barları (MiniTrend benzeri)
  const trendBars = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const length = period === '7d' ? 7 : period === '30d' ? 6 : 8
    const intervalDays = period === '7d' ? 1 : period === '30d' ? 5 : 30

    return Array.from({ length }, (_, idx) => {
      const endOffset = (length - 1 - idx) * intervalDays
      const startOffset = endOffset + intervalDays
      
      const dStart = new Date(today)
      dStart.setDate(dStart.getDate() - startOffset)
      const dEnd = new Date(today)
      dEnd.setDate(dEnd.getDate() - endOffset)
      
      const count = candidates.filter(c => {
        const t = new Date(c.created_at)
        return t >= dStart && t < dEnd
      }).length

      let label = ''
      if (period === '7d') {
        const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
        const dayIdx = (dEnd.getDay() + 6) % 7
        label = days[dayIdx]
      } else if (period === '30d') {
        label = `${dEnd.getDate()} ${dEnd.toLocaleDateString(undefined, { month: 'short' })}`
      } else {
        label = dEnd.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
      }

      return { label, count }
    })
  }, [candidates, period])

  const maxTrendCount = Math.max(...trendBars.map(b => b.count), 1)

  if (wsLoading || cLoading) {
    return (
      <div className="md:max-w-[80%] md:mx-auto space-y-4 px-4 pt-6">
        <div className="h-6 w-32 animate-pulse rounded bg-[var(--bg-subtle)]" />
        <div className="h-10 w-44 animate-pulse rounded bg-[var(--bg-subtle)]" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[14px] bg-[var(--bg-subtle)]" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
      </div>
    )
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8 animate-in fade-in duration-300">
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F0FE] dark:bg-[#0a1f4d]">
              <TrendingUp className="h-5 w-5 text-[#1A56DB]" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-1)]">
                {lang === 'en' ? 'Statistics & Analytics' : 'İstatistikler & Analiz'}
              </h1>
              <p className="text-sm text-[var(--text-3)]">
                {lang === 'en' ? 'Lightweight candidate and pipeline performance insights' : 'Hafif aday hunisi ve organizasyonel ivme analizleri'}
              </p>
            </div>
          </div>

          {/* Period Filter */}
          <div className="flex rounded-xl bg-[var(--bg-subtle)] p-0.5 border border-[var(--border)] self-start sm:self-auto">
            {(['7d', '30d', 'all'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  period === p
                    ? 'bg-[var(--bg-card)] text-[#1A56DB] shadow-sm border border-[var(--border)]'
                    : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
                }`}
              >
                {p === '7d' && (lang === 'en' ? 'Last 7 Days' : 'Son 7 Gün')}
                {p === '30d' && (lang === 'en' ? 'Last 30 Days' : 'Son 30 Gün')}
                {p === 'all' && (lang === 'en' ? 'All Time' : 'Tüm Zamanlar')}
              </button>
            ))}
          </div>
        </header>

        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 relative overflow-hidden">
              <span className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider block">
                {lang === 'en' ? 'TOTAL LEADS' : 'TOPLAM ADAY'}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[var(--text-1)]">{metrics.total}</span>
                <Users className="h-4 w-4 text-[var(--text-3)] ml-auto" />
              </div>
              <p className="text-[10px] text-[var(--text-3)] mt-1 font-semibold">
                {lang === 'en' ? 'Candidates in period' : 'Filtreye uyan aday sayısı'}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <span className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider block">
                {lang === 'en' ? 'ACTIVE LEADS' : 'AKTİF SÜREÇ'}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#534AB7]">{metrics.active}</span>
                <Activity className="h-4 w-4 text-[#534AB7] ml-auto" />
              </div>
              <p className="text-[10px] text-[var(--text-3)] mt-1 font-semibold">
                {lang === 'en' ? 'Moving candidates' : 'İlişkisi canlı adaylar'}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <span className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider block">
                {lang === 'en' ? 'CONVERSION RATE' : 'DÖNÜŞÜM ORANI'}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#065F46]">%{metrics.conversionRate}</span>
                <Award className="h-4 w-4 text-[#065F46] ml-auto" />
              </div>
              <p className="text-[10px] text-[var(--text-3)] mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                {metrics.joined} {lang === 'en' ? 'became member' : 'distribütör oldu'}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <span className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider block">
                {lang === 'en' ? 'PRESENTATION RATE' : 'SUNUM ORANI'}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#0369A1]">%{metrics.presentationRate}</span>
                <Target className="h-4 w-4 text-[#0369A1] ml-auto" />
              </div>
              <p className="text-[10px] text-[var(--text-3)] mt-1 font-semibold">
                {lang === 'en' ? 'Completed pitches' : 'Yapılan fırsat sunumu'}
              </p>
            </div>
          </div>

          {/* Huni & Grafik Bölümü */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Dönüşüm Hunisi */}
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-[#1A56DB]" />
                  {lang === 'en' ? 'Candidate Conversion Funnel' : 'Aday Dönüşüm Hunisi'}
                </h2>
                <p className="mt-1 text-xs text-[var(--text-3)] leading-relaxed">
                  {lang === 'en'
                    ? 'Cumulative waterfall representing step-by-step conversion of your contact list.'
                    : 'Aday listendeki kişilerin aşama aşama organizasyonuna katılım sürecini gör.'}
                </p>
              </div>

              {metrics.total === 0 ? (
                <div className="py-16 text-center text-xs text-[var(--text-3)] italic">
                  {lang === 'en' ? 'No candidates found in this period' : 'Bu periyotta veri bulunamadı'}
                </div>
              ) : (
                <div className="space-y-2">
                  {funnelSteps.map((step) => (
                    <div key={step.key} className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-24 shrink-0 text-xs font-semibold text-[var(--text-2)] line-clamp-1">
                          {step.label}
                        </div>
                        {/* Custom Dynamic CSS Bar */}
                        <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                          <div
                            className="h-full rounded-lg transition-all duration-1000 ease-out"
                            style={{
                              backgroundColor: step.color,
                              width: `${Math.max(step.pct, step.count > 0 ? 8 : 0)}%`
                            }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-1)] drop-shadow-sm">
                            {step.count}
                          </span>
                        </div>
                        <div className="w-10 text-right text-xs font-bold text-[var(--text-1)]">
                          %{step.pct}
                        </div>
                      </div>
                      {step.dropFromPrev !== null && step.dropFromPrev > 0 && (
                        <p className="mt-1 pl-28 text-[9px] text-[var(--text-3)] font-medium">
                          ↓ {step.dropFromPrev} {lang === 'en' ? 'prospects remained in the previous step' : 'kişi önceki aşamada kaldı'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* İvme Grafikleri: Sıcaklık & Mini Trend */}
            <div className="space-y-6">
              
              {/* Sıcaklık Dağılımı Donut */}
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-orange-500" />
                    {lang === 'en' ? 'Pipeline Temperature' : 'Süreç Sıcaklık Dağılımı'}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-3)] leading-relaxed">
                    {lang === 'en' ? 'Warmth levels calculated based on their active process stages.' : 'Adayların süreçteki aktifliklerine göre boru hattı sıcaklıkları.'}
                  </p>
                </div>

                {metrics.total === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--text-3)] italic">
                    {lang === 'en' ? 'No candidates to analyze' : 'Analiz edilecek aday yok'}
                  </div>
                ) : (
                  <div className="flex items-center gap-6 py-2">
                    {/* SVG Concentric Gauge / Ring Chart */}
                    <div className="relative h-24 w-24 flex items-center justify-center shrink-0">
                      <svg width="96" height="96" className="transform -rotate-90">
                        {/* Cold Arc */}
                        <circle cx="48" cy="48" r="38" stroke="var(--border)" strokeWidth="6" fill="transparent" />
                        <circle cx="48" cy="48" r="38" stroke="#6B7280" strokeWidth="6" fill="transparent"
                          strokeDasharray="238.7" strokeDashoffset={238.7 - (238.7 * temperatureData.coldPct) / 100} strokeLinecap="round" />
                        
                        {/* Warm Arc */}
                        <circle cx="48" cy="48" r="28" stroke="var(--border)" strokeWidth="6" fill="transparent" />
                        <circle cx="48" cy="48" r="28" stroke="#534AB7" strokeWidth="6" fill="transparent"
                          strokeDasharray="175.9" strokeDashoffset={175.9 - (175.9 * temperatureData.warmPct) / 100} strokeLinecap="round" />
                        
                        {/* Hot Arc */}
                        <circle cx="48" cy="48" r="18" stroke="var(--border)" strokeWidth="6" fill="transparent" />
                        <circle cx="48" cy="48" r="18" stroke="#C03E1F" strokeWidth="6" fill="transparent"
                          strokeDasharray="113.1" strokeDashoffset={113.1 - (113.1 * temperatureData.hotPct) / 100} strokeLinecap="round" />
                      </svg>
                      <div className="absolute text-center">
                        <Flame className="h-4 w-4 text-orange-500 mx-auto animate-pulse" />
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#C03E1F]" />
                          <span>{lang === 'en' ? 'Hot Market' : 'Sıcak (Arama/Sunum)'}</span>
                        </div>
                        <span className="text-[var(--text-3)] font-bold tabular-nums">%{temperatureData.hotPct} ({temperatureData.hot})</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#534AB7]" />
                          <span>{lang === 'en' ? 'Warm Market' : 'Ilık (Yeni/İletişim)'}</span>
                        </div>
                        <span className="text-[var(--text-3)] font-bold tabular-nums">%{temperatureData.warmPct} ({temperatureData.warm})</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#6B7280]" />
                          <span>{lang === 'en' ? 'Cold/Lost' : 'Soğuk (İlgilenmedi)'}</span>
                        </div>
                        <span className="text-[var(--text-3)] font-bold tabular-nums">%{temperatureData.coldPct} ({temperatureData.cold})</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Büyüme Hızı / Aday Edinme Trendi */}
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-1.5">
                      <BarChart2 className="h-4 w-4 text-[#4169E1]" />
                      {lang === 'en' ? 'Acquisition Velocity' : 'Aday Kazanım İvmesi'}
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-3)] leading-relaxed">
                      {lang === 'en' ? 'Growth trend representing new candidate creations.' : 'Seçilen periyotta organizasyonuna yeni katılan adayların trendi.'}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#4169E1] bg-[#EEF2FF] dark:bg-[#0a0f2e] border border-blue-100/50 dark:border-blue-900/10 px-2 py-0.5 rounded-full">
                    {metrics.total} {lang === 'en' ? 'new' : 'yeni'}
                  </span>
                </div>

                {metrics.total === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--text-3)] italic">
                    {lang === 'en' ? 'No recent trend data' : 'Kayıt trendi verisi yok'}
                  </div>
                ) : (
                  <div className="flex items-end gap-2 h-20 pt-4">
                    {trendBars.map((bar, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-[9px] font-bold text-[var(--text-1)]">{bar.count > 0 ? bar.count : ''}</span>
                        <div
                          className={`w-full rounded-t-md transition-all ${bar.count > 0 ? 'bg-[#4169E1]' : 'bg-[#EEF2FF] dark:bg-[#4169E1]/20'}`}
                          style={{ height: `${Math.max((bar.count / maxTrendCount) * 52, bar.count > 0 ? 6 : 2)}px` }}
                        />
                        <span className="text-[9px] font-semibold text-[var(--text-3)] truncate w-full text-center">{bar.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

            </div>

          </div>

          {/* Bilgi Notu */}
          <section className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
            <Clock className="h-4 w-4 shrink-0 text-[var(--text-3)] mt-0.5" />
            <p className="text-[11px] leading-relaxed text-[var(--text-3)] font-semibold">
              {lang === 'en'
                ? 'Calculations are processed client-side based on your active candidates pipeline database. Keep candidate stages updated in Pipeline to ensure precise data.'
                : 'İstatistikler, Boru Hattınızdaki adayların güncel durumuna göre anlık olarak cihazınızda hesaplanır. Verilerinizin doğru olması için Aday Detaylarındaki aşama güncellemelerini aksatmayın.'}
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}
