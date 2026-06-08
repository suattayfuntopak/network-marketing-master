'use client'

import { BroadcastPanel } from './BroadcastPanel'
import { InviteTeammateSection } from './InviteTeammateSection'
import { JoinByInviteSection } from './JoinByInviteSection'
import type { MemberRow } from '@/lib/team/types'

type Props = {
  t: (key: string, vars?: Record<string, string | number>) => string
  ws: {
    inviteCode: string
    hasUpline: boolean
    role: string
  }
  isLeader: boolean
  teamPageUnlocked: boolean
  visibleMembers: MemberRow[]
  copied: boolean
  onCopy: () => void
  inviteCodeInput: string
  joining: boolean
  onInviteCodeChange: (value: string) => void
  onJoinSubmit: (e: React.FormEvent) => void
}

export function EkipToolsTab({
  t,
  ws,
  isLeader,
  teamPageUnlocked,
  visibleMembers,
  copied,
  onCopy,
  inviteCodeInput,
  joining,
  onInviteCodeChange,
  onJoinSubmit,
}: Props) {
  return (
    <div className="space-y-6">
      {isLeader && (
        <InviteTeammateSection
          inviteCode={ws.inviteCode}
          copied={copied}
          onCopy={onCopy}
          t={t}
        />
      )}

      {!ws.hasUpline && (
        <JoinByInviteSection
          inviteCodeInput={inviteCodeInput}
          joining={joining}
          onInviteCodeChange={onInviteCodeChange}
          onSubmit={onJoinSubmit}
          t={t}
        />
      )}

      {ws.hasUpline && !isLeader && (
        <p className="rounded-2xl border border-dashed border-[var(--border)] py-8 text-center text-sm text-[var(--text-3)]">
          {t('team.inviteMemberOnlyLeader')}
        </p>
      )}

      {isLeader && teamPageUnlocked && (
        <BroadcastPanel members={visibleMembers} t={t} />
      )}
    </div>
  )
}
