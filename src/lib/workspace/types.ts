import type { Database } from '@/types/database'

export type Profile = Database['public']['Tables']['nmm_profiles']['Row']
export type Workspace = Database['public']['Tables']['nmm_workspaces']['Row']
export type WorkspaceMember = Database['public']['Tables']['nmm_workspace_members']['Row']
export type WorkspaceRelationship = Database['public']['Tables']['nmm_member_relationships']['Row']

export interface WorkspaceContext {
  mode: 'legacy' | 'workspace'
  workspace: Workspace | null
  membership: WorkspaceMember | null
  memberCount: number
}

export interface WorkspaceDirectoryMember {
  membership: WorkspaceMember
  profile: Pick<Profile, 'id' | 'full_name' | 'email' | 'role' | 'avatar_url' | 'company'> | null
  sponsorUserId: string | null
  depth: number | null
  isCurrentUser: boolean
}
