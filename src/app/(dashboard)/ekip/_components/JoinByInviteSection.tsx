'use client'

import { LogIn, Loader2 } from 'lucide-react'

interface JoinByInviteSectionProps {
  inviteCodeInput: string
  joining: boolean
  onInviteCodeChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

export function JoinByInviteSection({
  inviteCodeInput,
  joining,
  onInviteCodeChange,
  onSubmit,
  t,
}: JoinByInviteSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-3)] flex items-center gap-2">
        <LogIn className="h-5 w-5" />
        {t('team.joinATeam')}
      </h2>
      <div className="w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-4 shadow-sm">
        <p className="text-sm text-[var(--text-2)] font-medium leading-relaxed">
          {t('team.joinATeamDesc')}
        </p>
        <form onSubmit={onSubmit} className="flex min-w-0 gap-3 overflow-hidden">
          <input
            type="text"
            required
            value={inviteCodeInput}
            onChange={e => onInviteCodeChange(e.target.value)}
            placeholder={t('team.pasteInvitePlaceholder')}
            className="flex-1 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-brand transition-all font-medium"
          />
          <button
            type="submit"
            disabled={joining}
            className="flex h-11 px-5 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0F6E56] text-base font-bold text-white hover:bg-[#0a5a44] transition active:scale-95 disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {joining ? <Loader2 className="h-5 w-5 animate-spin" /> : t('team.joinBtn')}
          </button>
        </form>
      </div>
    </section>
  )
}
