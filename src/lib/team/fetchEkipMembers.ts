import { fetchTeamBundleAction } from '@/app/(dashboard)/actions/team'

/** @deprecated fetchTeamBundleAction().ekipRows kullanın — geriye dönük uyumluluk. */
export async function fetchEkipMembers(workspaceId: string) {
  const bundle = await fetchTeamBundleAction(workspaceId)
  return bundle.ekipRows
}
