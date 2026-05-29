import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Supabase server client and auth helper before importing the unit.
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/auth', () => ({ isSuperAdmin: vi.fn() }))

import { checkAIQuota } from './checkQuota'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth'

interface MockState {
  user: { id: string; email: string | null } | null
  membership: { workspace_id: string } | null
  workspace: {
    license_type: string | null
    license_expires_at: string | null
    created_at?: string | null
  } | null
  dailyCount: number
}

/**
 * Builds a chainable Supabase mock. `.maybeSingle()` resolves the table's single
 * row; the daily-actions count query is awaited directly and resolves `{ count }`.
 */
function makeClient(state: MockState) {
  const from = (table: string) => {
    const single =
      table === 'nmm_workspace_members'
        ? { data: state.membership }
        : table === 'nmm_workspaces'
        ? { data: state.workspace }
        : { data: null }

    const builder: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'gte', 'or']) builder[m] = () => builder
    builder.maybeSingle = async () => single
    // Thenable: awaiting the daily-actions query resolves the count.
    builder.then = (resolve: (v: { count: number }) => unknown) =>
      resolve({ count: state.dailyCount })
    return builder
  }

  return {
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from,
  }
}

function setup(state: MockState, superAdmin = false) {
  ;(createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeClient(state))
  ;(isSuperAdmin as unknown as ReturnType<typeof vi.fn>).mockReturnValue(superAdmin)
}

const future = new Date(Date.now() + 86_400_000).toISOString()
const past = new Date(Date.now() - 86_400_000).toISOString()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('checkAIQuota', () => {
  it('returns no_auth when there is no session', async () => {
    setup({ user: null, membership: null, workspace: null, dailyCount: 0 })
    const res = await checkAIQuota('message')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toBe('no_auth')
  })

  it('grants unlimited access to super admin without counting usage', async () => {
    setup(
      { user: { id: 'u1', email: 'admin@x.com' }, membership: { workspace_id: 'w1' }, workspace: { license_type: 'free', license_expires_at: null }, dailyCount: 999 },
      true
    )
    const res = await checkAIQuota('compliance')
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.isSuperAdmin).toBe(true)
      expect(res.remaining).toBe(Infinity)
    }
  })

  it('allows compliance during active free trial', async () => {
    setup({ user: { id: 'u1', email: null }, membership: { workspace_id: 'w1' }, workspace: { license_type: 'free', license_expires_at: future }, dailyCount: 0 })
    const res = await checkAIQuota('compliance')
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.licenseType).toBe('leader')
      expect(res.limit).toBe(2)
    }
  })

  it('gates compliance after trial ends', async () => {
    setup({ user: { id: 'u1', email: null }, membership: { workspace_id: 'w1' }, workspace: { license_type: 'free', license_expires_at: past }, dailyCount: 0 })
    const res = await checkAIQuota('compliance')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toBe('feature_unavailable')
  })

  it('treats an expired license as free', async () => {
    // leader normally allows compliance (limit 2), but expired => free => gated
    setup({ user: { id: 'u1', email: null }, membership: { workspace_id: 'w1' }, workspace: { license_type: 'leader', license_expires_at: past }, dailyCount: 0 })
    const res = await checkAIQuota('compliance')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toBe('feature_unavailable')
  })

  it('returns limit_reached when daily usage meets the trial limit', async () => {
    setup({ user: { id: 'u1', email: null }, membership: { workspace_id: 'w1' }, workspace: { license_type: 'free', license_expires_at: future }, dailyCount: 15 })
    const res = await checkAIQuota('message')
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.reason).toBe('limit_reached')
      expect(res.limit).toBe(15)
    }
  })

  it('returns post-trial free message limit when trial expired', async () => {
    setup({ user: { id: 'u1', email: null }, membership: { workspace_id: 'w1' }, workspace: { license_type: 'free', license_expires_at: past }, dailyCount: 5 })
    const res = await checkAIQuota('message')
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.reason).toBe('limit_reached')
      expect(res.limit).toBe(5)
    }
  })

  it('infers trial limits from workspace created_at when expiry is missing', async () => {
    const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    setup({
      user: { id: 'u1', email: null },
      membership: { workspace_id: 'w1' },
      workspace: {
        license_type: 'free',
        license_expires_at: null,
        created_at: recent,
      },
      dailyCount: 0,
    })
    const res = await checkAIQuota('compliance')
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.limit).toBe(2)
  })

  it('returns ok with correct remaining when under the limit', async () => {
    setup({ user: { id: 'u1', email: 'u@x.com' }, membership: { workspace_id: 'w1' }, workspace: { license_type: 'pro', license_expires_at: future }, dailyCount: 10 })
    const res = await checkAIQuota('message')
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.licenseType).toBe('pro')
      expect(res.limit).toBe(100)
      expect(res.used).toBe(10)
      expect(res.remaining).toBe(89) // 100 - 10 - 1
    }
  })
})
