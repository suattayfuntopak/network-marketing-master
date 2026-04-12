const PREFERRED_WORKSPACE_KEY = 'nmm-preferred-workspace-id'

export function getPreferredWorkspaceId() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(PREFERRED_WORKSPACE_KEY) ?? ''
}

export function setPreferredWorkspaceId(workspaceId: string) {
  if (typeof window === 'undefined') return

  if (workspaceId) {
    window.localStorage.setItem(PREFERRED_WORKSPACE_KEY, workspaceId)
    return
  }

  window.localStorage.removeItem(PREFERRED_WORKSPACE_KEY)
}
