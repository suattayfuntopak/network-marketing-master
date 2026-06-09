export type WorkspaceTreeRow = {
  id: string
  owner_id: string
  parent_id: string | null
}

const MAX_WALK = 24

/** Sponsor zincirinden lider = 0, doğrudan downline = 1, … */
export function computeMemberGeneration(
  memberUserId: string,
  leaderUserId: string,
  leaderWorkspaceId: string,
  treeRows: WorkspaceTreeRow[],
  directMemberIds: Set<string>,
): number {
  if (memberUserId === leaderUserId) return 0

  const wsByOwner = new Map(treeRows.map(r => [r.owner_id, r]))
  const wsById = new Map(treeRows.map(r => [r.id, r]))

  const memberWs = wsByOwner.get(memberUserId)
  if (!memberWs) {
    return directMemberIds.has(memberUserId) ? 1 : 2
  }

  let depth = 0
  let current: WorkspaceTreeRow | undefined = memberWs
  const visited = new Set<string>()

  while (current?.parent_id && depth < MAX_WALK) {
    const parentRef: string = current.parent_id
    if (parentRef === leaderUserId || parentRef === leaderWorkspaceId) {
      return depth + 1
    }

    if (visited.has(parentRef)) break
    visited.add(parentRef)

    depth += 1
    current = wsById.get(parentRef) ?? wsByOwner.get(parentRef)
  }

  return Math.max(1, depth)
}
