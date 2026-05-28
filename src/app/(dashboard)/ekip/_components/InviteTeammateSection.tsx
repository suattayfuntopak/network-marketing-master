'use client'

import { UserPlus, Copy, Check } from 'lucide-react'
import { SpoilerCode } from './SpoilerCode'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { REGISTER_URL } from '@/lib/constants'

interface InviteTeammateSectionProps {
  inviteCode: string
  copied: boolean
  onCopy: () => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

export function InviteTeammateSection({
  inviteCode,
  copied,
  onCopy,
  t,
}: InviteTeammateSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-3)] flex items-center gap-2">
        <UserPlus className="h-5 w-5" />
        {t('team.inviteTeammate')}
      </h2>
      <div className="w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-4 shadow-sm">
        <p className="text-sm text-[var(--text-2)] font-medium leading-relaxed">
          {t('team.inviteTeammateDesc')}
        </p>
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <SpoilerCode code={inviteCode} />
          <button
            type="button"
            onClick={onCopy}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white hover:bg-[#433a9f] transition active:scale-95 shadow-sm cursor-pointer"
            title={t('team.copyCode')}
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              t('team.waInviteGroup', { code: inviteCode, link: REGISTER_URL })
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-whatsapp text-white hover:bg-[#20ba56] transition active:scale-95 shadow-sm cursor-pointer"
            title="WhatsApp ile Paylaş"
          >
            <WhatsAppIcon className="h-5 w-5" />
          </a>
        </div>
      </div>
    </section>
  )
}
