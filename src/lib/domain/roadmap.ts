/**
 * Hedef → Yol Haritası → Günlük hedef türetme (SAF, şirketten bağımsız).
 *
 * Girdi yalnız kişi-sayısı + ay. PV/bonus/rütbe/gelir YOK. Tüm sayılar generic
 * varsayılan sabitlerle türetilir (ileride kullanıcı/şirket ayarına açılabilir).
 *
 * Duplikasyon (geometrik) modeli: aylık yeni-üye katkısı sabit oranla büyür
 * (ekip büyüdükçe ivmelenir); A ayda toplam H'ye ulaşır.
 */

/** Ekip her ay ~%30 hızlanır (aylık yeni-üye geometrik büyüme oranı). */
export const DEFAULT_GROWTH_RATE = 1.3
/**
 * Aylık hedefleri günlüğe ve kısa dönemlere bölerken kullanılan iş günü sayısı.
 * Tek kaynak: `hubFunnelTargets.prorateMonthlyTargets` ve `dailyTargetsForMonth` buradan okur.
 */
export const WORKING_DAYS_PER_MONTH = 26
/** Generic huni: 1 yeni üye için ortalama aktivite (1 üye ← 3 sunum ← 9 tanışma ← 18 arama). */
export const FUNNEL = { sunumPerUye: 3, tanismaPerUye: 9, aramaPerUye: 18 } as const

export interface FunnelCounts {
  arama: number
  tanisma: number
  sunum: number
  yeniUye: number
}

export interface RoadmapStage {
  /** 1..A */
  month: number
  /** O ay eklenecek yeni üye (tam sayı). */
  newMembers: number
  /** Kademe sonu kümülatif ekip boyu. */
  teamSize: number
  /** O ay için huni hedefleri. */
  monthly: FunnelCounts
}

/**
 * Hedeften kademeli (aylık) yol haritası türetir. `currentTeam` mevcut ekip boyu
 * (downline sayısı). Hedef zaten karşılanıyorsa boş dizi döner.
 */
export function computeRoadmap(
  targetPeople: number,
  targetMonths: number,
  currentTeam = 0,
  growthRate: number = DEFAULT_GROWTH_RATE,
): RoadmapStage[] {
  const A = Math.max(1, Math.floor(targetMonths))
  const remaining = Math.max(0, Math.floor(targetPeople) - Math.max(0, Math.floor(currentTeam)))
  if (remaining === 0) return []

  const r = growthRate > 0 ? growthRate : DEFAULT_GROWTH_RATE
  // Geometrik seri toplamı = remaining → ilk ayın tabanı b çözülür.
  const denom = Math.abs(r - 1) < 1e-9 ? A : (Math.pow(r, A) - 1) / (r - 1)
  const b = remaining / denom

  const raw: number[] = []
  for (let i = 0; i < A; i++) raw.push(b * Math.pow(r, i))

  // Tam sayıya yuvarla; yuvarlama sapmasını son aya yansıtarak toplam = remaining.
  const rounded = raw.map((x) => Math.max(0, Math.round(x)))
  const drift = remaining - rounded.reduce((s, x) => s + x, 0)
  rounded[A - 1] = Math.max(0, rounded[A - 1] + drift)

  const stages: RoadmapStage[] = []
  let cum = Math.max(0, Math.floor(currentTeam))
  for (let i = 0; i < A; i++) {
    const nm = rounded[i]
    cum += nm
    stages.push({
      month: i + 1,
      newMembers: nm,
      teamSize: cum,
      monthly: {
        yeniUye: nm,
        sunum: nm * FUNNEL.sunumPerUye,
        tanisma: nm * FUNNEL.tanismaPerUye,
        arama: nm * FUNNEL.aramaPerUye,
      },
    })
  }
  return stages
}

/** Bir ayın huni hedefini günlüğe böler (yukarı yuvarlar — hedef düşmesin). */
export function dailyTargetsForMonth(
  stage: RoadmapStage | undefined,
  workingDays: number = WORKING_DAYS_PER_MONTH,
): FunnelCounts {
  if (!stage || workingDays <= 0) return { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }
  const d = (n: number) => Math.max(0, Math.ceil(n / workingDays))
  return {
    arama: d(stage.monthly.arama),
    tanisma: d(stage.monthly.tanisma),
    sunum: d(stage.monthly.sunum),
    yeniUye: d(stage.monthly.yeniUye),
  }
}

/**
 * Hedef başlangıcından bu yana geçen ay indeksini (1-tabanlı) döndürür.
 * Süre dolduysa A ile sınırlanır (son kademe hedefleri kullanılır).
 */
export function currentMonthIndex(startAt: Date, totalMonths: number, now: Date = new Date()): number {
  const months =
    (now.getFullYear() - startAt.getFullYear()) * 12 + (now.getMonth() - startAt.getMonth())
  return Math.min(Math.max(1, totalMonths), Math.max(1, months + 1))
}

/** Yol haritası ay N → aylık özet `?offset=` (takvim ayı farkı). */
export function calendarMonthOffsetForRoadmapMonth(
  startAt: string | Date,
  roadmapMonth: number,
  now: Date = new Date(),
): number {
  const start = typeof startAt === 'string' ? new Date(startAt) : startAt
  const target = new Date(start.getFullYear(), start.getMonth() + (roadmapMonth - 1), 1)
  return (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
}
