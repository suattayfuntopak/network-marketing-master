'use client'

import { useWorkspace } from '@/hooks/useWorkspace'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Crown, User } from 'lucide-react'

interface MemberRow {
  user_id: string
  full_name: string | null
  role: 'leader' | 'member'
  candidate_count: number
}

async function fetchMembers(workspaceId: string): Promise<MemberRow[]> {
  const supabase = createClient()

  const { data: members, error } = await supabase
    .from('nmm_workspace_members')
    .select('user_id, full_name, role')
    .eq('workspace_id', workspaceId)

  if (error) throw error

  const counts = await Promise.all(
    (members ?? []).map(async m => {
      const { count } = await supabase
        .from('nmm_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('owner_id', m.user_id)
      return { ...m, candidate_count: count ?? 0 }
    })
  )

  return counts.sort((a, b) => b.candidate_count - a.candidate_count)
}

export function EkipPanel() {
  const { data: ws, isLoading: wsLoading } = useWorkspace()

  const { data: members = [], isLoading: mLoading } = useQuery({
    queryKey: ['members', ws?.workspaceId],
    queryFn: () => fetchMembers(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
  })

  if (wsLoading || mLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    )
  }

  const isLeader = ws?.role === 'leader'

  return (
    <div className="space-y-6">
      {/* Özet */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#FAEEDA] p-4">
          <p className="text-2xl font-bold text-[#854F0B]">{members.length}</p>
          <p className="mt-0.5 text-xs font-medium text-[#854F0B]">Ekip Üyesi</p>
        </div>
        <div className="rounded-2xl bg-[#EEEDFE] p-4">
          <p className="text-2xl font-bold text-[#534AB7]">
            {members.reduce((s, m) => s + m.candidate_count, 0)}
          </p>
          <p className="mt-0.5 text-xs font-medium text-[#534AB7]">Toplam Aday</p>
        </div>
      </div>

      {/* Üye listesi */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">Üyeler</h2>
        <ul className="space-y-2">
          {members.map(m => (
            <li
              key={m.user_id}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FAEEDA] text-sm font-bold text-[#854F0B]">
                {(m.full_name ?? '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {m.full_name ?? 'İsimsiz'}
                  </p>
                  {m.role === 'leader' && (
                    <Crown className="h-3.5 w-3.5 shrink-0 text-[#854F0B]" strokeWidth={2} />
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {m.role === 'leader' ? 'Lider' : 'Üye'}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-gray-900">{m.candidate_count}</p>
                <p className="text-xs text-gray-400">aday</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {!isLeader && (
        <p className="rounded-xl bg-gray-50 px-4 py-3 text-center text-sm text-gray-400">
          Ekip yönetimi sadece lider tarafından yapılabilir.
        </p>
      )}
    </div>
  )
}
