/** Downline (ekip ağacı) yapısal analizi — SAF, mevcut jenerasyon ağacından türer. */

export interface DownlineAnalyticsNode {
  /** 0 = lider; 1+ = downline jenerasyonu. */
  generation: number
  joinedAt: string | null
}

export interface GenerationBucket {
  generation: number
  count: number
}

export interface DownlineAnalytics {
  /** Lider hariç toplam üye (generation >= 1). */
  totalMembers: number
  /** En derin jenerasyon (boşsa 0). */
  depth: number
  /** Jenerasyon başına üye sayısı (1..depth, artan). */
  perGeneration: GenerationBucket[]
  /** En kalabalık jenerasyon (eşitlikte en düşük); boşsa null. */
  biggestGeneration: GenerationBucket | null
  /** Son 30 günde katılan üye sayısı. */
  joinedLast30: number
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export function computeDownlineAnalytics(
  nodes: DownlineAnalyticsNode[],
  nowMs: number = Date.now(),
): DownlineAnalytics {
  const downline = nodes.filter(n => n.generation >= 1)

  const counts = new Map<number, number>()
  let depth = 0
  let joinedLast30 = 0

  for (const n of downline) {
    counts.set(n.generation, (counts.get(n.generation) ?? 0) + 1)
    if (n.generation > depth) depth = n.generation
    if (n.joinedAt) {
      const t = new Date(n.joinedAt).getTime()
      if (Number.isFinite(t) && nowMs - t <= THIRTY_DAYS_MS && nowMs - t >= 0) joinedLast30++
    }
  }

  const perGeneration: GenerationBucket[] = Array.from(counts.entries())
    .map(([generation, count]) => ({ generation, count }))
    .sort((a, b) => a.generation - b.generation)

  let biggestGeneration: GenerationBucket | null = null
  for (const b of perGeneration) {
    if (!biggestGeneration || b.count > biggestGeneration.count) biggestGeneration = b
  }

  return {
    totalMembers: downline.length,
    depth,
    perGeneration,
    biggestGeneration,
    joinedLast30,
  }
}
