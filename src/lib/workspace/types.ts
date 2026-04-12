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
  schemaReady: boolean
}

export interface WorkspaceDirectoryMember {
  membership: WorkspaceMember
  profile: Pick<Profile, 'id' | 'full_name' | 'email' | 'role' | 'avatar_url' | 'company'> | null
  sponsorUserId: string | null
  sponsorName: string | null
  depth: number | null
  isCurrentUser: boolean
}

export interface WorkspaceInviteCandidate {
  id: string
  full_name: string
  email: string
  role: Profile['role']
  company: string | null
  avatar_url: string | null
}

export interface WorkspaceMembershipSummary {
  membership: WorkspaceMember
  workspace: Workspace
}

export interface IncomingWorkspaceInvite {
  membership: WorkspaceMember
  workspace: Workspace
  inviter: Pick<Profile, 'id' | 'full_name' | 'email'> | null
}
