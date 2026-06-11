import { describe, expect, it } from 'vitest'
import { formatEmailDateTime } from './emailDateTime'

describe('formatEmailDateTime', () => {
  it('uses Europe/Istanbul (UTC+3) not server local/UTC', () => {
    // 2026-06-11 10:00 UTC = 13:00 Istanbul
    const formatted = formatEmailDateTime(new Date('2026-06-11T10:00:00.000Z'), 'tr')
    expect(formatted).toMatch(/13:00/)
    expect(formatted).toMatch(/11/)
  })
})
