import { describe, expect, it } from 'vitest'
import { computeMemberGeneration } from './memberGeneration'

describe('computeMemberGeneration', () => {
  const leaderUser = 'leader-user'
  const leaderWs = 'leader-ws'
  const direct = new Set(['direct-member'])

  it('lider nesil 0', () => {
    expect(computeMemberGeneration(leaderUser, leaderUser, leaderWs, [], direct)).toBe(0)
  })

  it('doğrudan workspace üyesi nesil 1', () => {
    expect(computeMemberGeneration('direct-member', leaderUser, leaderWs, [], direct)).toBe(1)
  })

  it('doğrudan downline workspace nesil 1', () => {
    const tree = [{ id: 'ws-a', owner_id: 'member-a', parent_id: leaderWs }]
    expect(computeMemberGeneration('member-a', leaderUser, leaderWs, tree, direct)).toBe(1)
  })

  it('ikinci nesil sponsor zinciri', () => {
    const tree = [
      { id: 'ws-a', owner_id: 'member-a', parent_id: leaderWs },
      { id: 'ws-b', owner_id: 'member-b', parent_id: 'ws-a' },
    ]
    expect(computeMemberGeneration('member-b', leaderUser, leaderWs, tree, direct)).toBe(2)
  })
})
