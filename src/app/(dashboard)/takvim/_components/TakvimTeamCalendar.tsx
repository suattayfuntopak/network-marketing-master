'use client'

import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { fetchTeamCalendarSummaryAction } from '../actions'
import { formatCalendarDayKey, formatCalendarMonth } from '@/lib/utils/calendarLocale'

type TakvimTeamCalendarProps = {
  workspaceId: string
  year: number
  month: number
  lang: 'tr' | 'en'
  title: string
  subtitle: string
  emptyLabel: string
}

export function TakvimTeamCalendar({
  workspaceId,
  year,
  month,
  lang,
  title,
  subtitle,
  emptyLabel,
}: TakvimTeamCalendarProps) {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['takvim-team', workspaceId, year, month],
    queryFn: () => fetchTeamCalendarSummaryAction(workspaceId, year, month),
    enabled: !!workspaceId,
    staleTime: 120_000,
  })

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="h-16 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
      </div>
    )
  }

  if (!members.length) return null

  const monthLabel = formatCalendarMonth(new Date(year, month, 1, 12, 0, 0), lang)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEEDFE]">
          <Users className="h-4 w-4 text-[#534AB7]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-1)]">{title}</p>
          <p className="text-xs text-[var(--text-2)]">{subtitle}</p>
        </div>
      </div>

      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">
        {monthLabel} {year}
      </p>

      <ul className="space-y-3">
        {members.map(member => (
          <li key={member.userId} className="rounded-xl bg-[var(--bg-subtle)] px-3 py-2.5">
            <p className="mb-1.5 text-xs font-semibold text-[var(--text-1)]">{member.fullName}</p>
            {member.days.length === 0 ? (
              <p className="text-[11px] text-[var(--text-3)]">{emptyLabel}</p>
            ) : (
              <ul className="space-y-1">
                {member.days.map(day => (
                  <li
                    key={day.dateKey}
                    className="flex items-center justify-between text-[11px] text-[var(--text-2)]"
                  >
                    <span>{formatCalendarDayKey(day.dateKey, lang)}</span>
                    <span className="rounded-full bg-[#EEEDFE] px-2 py-0.5 font-semibold text-[#534AB7]">
                      {day.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
