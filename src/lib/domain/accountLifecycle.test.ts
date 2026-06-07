import { describe, it, expect } from 'vitest'
import { getAccountLifecycle } from './accountLifecycle'

const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
const pastTrial = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

describe('getAccountLifecycle', () => {
  it('returns paid phase for leader license', () => {
    expect(getAccountLifecycle({ licenseType: 'leader' }).phase).toBe('paid')
  })

  it('returns trial for active 14-day window', () => {
    expect(
      getAccountLifecycle({
        licenseType: 'free',
        licenseExpiresAt: future,
        workspaceCreatedAt: new Date().toISOString(),
      }).phase
    ).toBe('trial')
  })

  it('never blocks access after trial — free phase instead', () => {
    const lc = getAccountLifecycle({
      licenseType: 'free',
      licenseExpiresAt: pastTrial,
      workspaceCreatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    })
    expect(lc.phase).toBe('free')
    expect(lc.isAccessBlocked).toBe(false)
  })
})
