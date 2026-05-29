import { describe, it, expect } from 'vitest'
import { getAccountLifecycle } from './accountLifecycle'

const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
const pastTrial = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
describe('getAccountLifecycle', () => {
  it('returns paid phase for leader license', () => {
    expect(getAccountLifecycle({ licenseType: 'leader' }).phase).toBe('paid')
  })

  it('returns trial for active free trial', () => {
    expect(
      getAccountLifecycle({
        licenseType: 'free',
        licenseExpiresAt: future,
        workspaceCreatedAt: new Date().toISOString(),
      }).phase
    ).toBe('trial')
  })

  it('returns limited_free after trial within grace window', () => {
    expect(
      getAccountLifecycle({
        licenseType: 'free',
        licenseExpiresAt: pastTrial,
        workspaceCreatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      }).phase
    ).toBe('limited_free')
  })

  it('locks access after grace period', () => {
    const signup = new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString()
    const trialEnded = new Date(Date.now() - 43 * 24 * 60 * 60 * 1000).toISOString()
    const lc = getAccountLifecycle({
      licenseType: 'free',
      licenseExpiresAt: trialEnded,
      workspaceCreatedAt: signup,
    })
    expect(lc.phase).toBe('access_locked')
    expect(lc.isAccessBlocked).toBe(true)
  })
})
