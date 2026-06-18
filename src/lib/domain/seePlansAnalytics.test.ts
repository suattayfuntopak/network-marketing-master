import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logSeePlansClick } from './seePlansAnalytics'
import { PRODUCT_EVENTS } from './productEvents'

const logProductEventAction = vi.fn()

vi.mock('@/app/(dashboard)/_shared-actions/productEvents', () => ({
  logProductEventAction: (...args: unknown[]) => logProductEventAction(...args),
}))

describe('logSeePlansClick', () => {
  beforeEach(() => {
    logProductEventAction.mockClear()
  })

  it('logs see_plans_click with phase and source metadata', () => {
    logSeePlansClick('ended', 'upgrade_gate')
    expect(logProductEventAction).toHaveBeenCalledWith(PRODUCT_EVENTS.seePlansClick, {
      phase: 'ended',
      source: 'upgrade_gate',
    })
  })

  it('supports notification source', () => {
    logSeePlansClick('trial', 'notification')
    expect(logProductEventAction).toHaveBeenCalledWith(PRODUCT_EVENTS.seePlansClick, {
      phase: 'trial',
      source: 'notification',
    })
  })
})
