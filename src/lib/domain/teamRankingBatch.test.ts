import { describe, it, expect } from 'vitest'
import { TEAM_RANKING_BATCH_PERIODS } from './teamRankingBatch'

describe('TEAM_RANKING_BATCH_PERIODS', () => {
  it('includes all-time period for ekip hover prefetch', () => {
    expect(TEAM_RANKING_BATCH_PERIODS).toContain('all')
    expect(TEAM_RANKING_BATCH_PERIODS).toEqual(['today', '7d', '30d', 'ytd', 'all'])
  })
})
