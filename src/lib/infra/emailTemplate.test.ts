import { describe, expect, it } from 'vitest'
import { buildPremiumEmail, emailHeading, NMM_LOGO_URL } from '@/lib/infra/emailTemplate'

describe('emailTemplate', () => {
  it('uses light background (no dark spam-style theme)', () => {
    const html = buildPremiumEmail(emailHeading('Test'), 'tr')
    expect(html).toContain('background:#f4f5f8')
    expect(html).toContain('background:#ffffff')
    expect(html).not.toContain('#0A0B10')
  })

  it('includes hosted NMM logo in header', () => {
    const html = buildPremiumEmail(emailHeading('Test'), 'tr')
    expect(html).toContain(NMM_LOGO_URL)
    expect(html).toContain('alt="Network Marketing Master"')
  })
})
