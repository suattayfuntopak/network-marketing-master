import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Supabase server client and auth helper before importing the unit.
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/domain/auth', () => ({ isSuperAdmin: vi.fn() }))
// checkAIQuota artık kimliği getAuthUser() (getClaims, yerel doğrulama) ile alır;
// ham supabase.auth.getUser() yerine bunu mock'la.
vi.mock('@/lib/supabase/authUser', () => ({ getAuthUser: vi.fn() }))

import { checkAIQuota } from './checkQuota'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/domain/auth'
import { getAuthUser } from '@/lib/supabase/authUser'

interface MockWorkspace {
  license_type: string | null
  license_expires_at: string | null
  created_at?: string | null
}

interface MockState {
  user: { id: string; email: string | null } | null
  membership: { workspace_id: string; nmm_workspaces: MockWorkspace | MockWorkspace[] } | null
  dailyCount: number
}

/**
 * Builds a chainable Supabase mock. Membership JOIN ile workspace gömülü gelir.
 */
function makeClient(state: MockState) {
  const from = (table: string) => {
    const single =
      table === 'nmm_workspace_members'
        ? { data: state.membership }
        : { data: null }

    const builder: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'gte', 'or']) builder[m] = () => builder
    builder.maybeSingle = async () => single
    builder.then = (resolve: (v: { count: number }) => unknown) =>
      resolve({ count: state.dailyCount })
    return builder
  }

  return { from }
}

function setup(state: MockState, superAdmin = false) {
  ;(createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeClient(state))
  ;(getAuthUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    user: state.user,
    error: null,
  })
  ;(isSuperAdmin as unknown as ReturnType<typeof vi.fn>).mockReturnValue(superAdmin)
}

function ws(
  license_type: string | null,
  license_expires_at: string | null,
  created_at?: string | null,
): MockWorkspace {
  return { license_type, license_expires_at, created_at: created_at ?? null }
}

function membership(workspaceId: string, workspace: MockWorkspace) {
  return { workspace_id: workspaceId, nmm_workspaces: workspace }
}

const future = new Date(Date.now() + 86_400_000).toISOString()
const past = new Date(Date.now() - 86_400_000).toISOString()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('checkAIQuota', () => {
  it('returns no_auth when there is no session', async () => {
    setup({ user: null, membership: null, dailyCount: 0 })
    const res = await checkAIQuota('message')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toBe('no_auth')
  })

  it('grants unlimited access to super admin without counting usage', async () => {
    setup(
      {
        user: { id: 'u1', email: 'admin@x.com' },
        membership: membership('w1', ws('free', null)),
        dailyCount: 999,
      },
      true,
    )
    const res = await checkAIQuota('compliance')
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.isSuperAdmin).toBe(true)
      expect(res.remaining).toBe(Infinity)
    }
  })

  it('allows AI during active trial (license_expires_at in future)', async () => {
    setup({
      user: { id: 'u1', email: null },
      membership: membership('w1', ws('free', future)),
      dailyCount: 0,
    })
    const res = await checkAIQuota('compliance')
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.licenseType).toBe('basic')
      expect(res.limit).toBe(20)
    }
  })

  it('gates compliance after trial ends', async () => {
    setup({
      user: { id: 'u1', email: null },
      membership: membership('w1', ws('free', past)),
      dailyCount: 0,
    })
    const res = await checkAIQuota('compliance')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toBe('feature_unavailable')
  })

  it('treats an expired license as free', async () => {
    setup({
      user: { id: 'u1', email: null },
      membership: membership('w1', ws('leader', past)),
      dailyCount: 0,
    })
    const res = await checkAIQuota('compliance')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toBe('feature_unavailable')
  })

  it('returns limit_reached when daily usage meets the plan limit', async () => {
    setup({
      user: { id: 'u1', email: null },
      membership: membership('w1', ws('basic', future)),
      dailyCount: 20,
    })
    const res = await checkAIQuota('message')
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.reason).toBe('limit_reached')
      expect(res.limit).toBe(20)
    }
  })

  it('blocks free plan message AI regardless of usage', async () => {
    setup({
      user: { id: 'u1', email: null },
      membership: membership('w1', ws('free', past)),
      dailyCount: 5,
    })
    const res = await checkAIQuota('message')
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.reason).toBe('feature_unavailable')
      expect(res.limit).toBe(0)
    }
  })

  it('allows AI when trial inferred from recent created_at', async () => {
    const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    setup({
      user: { id: 'u1', email: null },
      membership: membership('w1', ws('free', null, recent)),
      dailyCount: 0,
    })
    const res = await checkAIQuota('compliance')
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.licenseType).toBe('basic')
  })

  it('returns ok with correct remaining when under the limit', async () => {
    setup({
      user: { id: 'u1', email: 'u@x.com' },
      membership: membership('w1', ws('pro', future)),
      dailyCount: 10,
    })
    const res = await checkAIQuota('message')
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.licenseType).toBe('pro')
      expect(res.limit).toBe(100)
      expect(res.used).toBe(10)
      expect(res.remaining).toBe(89)
    }
  })
})
