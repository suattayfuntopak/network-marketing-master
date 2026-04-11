import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { startOfDay, startOfMonth, startOfWeek } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { fetchContacts } from '@/lib/contacts/queries'
import { DEFAULT_FILTERS, DEFAULT_SORT, type ContactWithTags } from '@/lib/contacts/types'
import { ROUTES } from '@/lib/constants'

type ContactSummaryKey = 'all' | 'month' | 'week' | 'today'

export function ContactsSummaryListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { summaryKey } = useParams<{ summaryKey: ContactSummaryKey }>()
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const { data } = useQuery({
    queryKey: ['contacts', 'summary-list', userId],
    queryFn: () =>
      fetchContacts({
        userId,
        filters: DEFAULT_FILTERS,
        sort: DEFAULT_SORT,
        page: 1,
        pageSize: 10000,
      }),
    enabled: !!userId,
    staleTime: 10000,
  })

  const contacts = data?.data ?? []
  const activeKey: ContactSummaryKey =
    summaryKey === 'month' || summaryKey === 'week' || summaryKey === 'today' || summaryKey === 'all'
      ? summaryKey
      : 'all'

  const rows = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const todayStart = startOfDay(now)

    return contacts.filter((contact) => {
      const createdAt = new Date(contact.created_at)
      if (activeKey === 'month') return createdAt >= monthStart
      if (activeKey === 'week') return createdAt >= weekStart
      if (activeKey === 'today') return createdAt >= todayStart
      return true
    })
  }, [activeKey, contacts])

  const titleKeyMap: Record<ContactSummaryKey, string> = {
    all: 'contacts.summaryCards.all.title',
    month: 'contacts.summaryCards.month.title',
    week: 'contacts.summaryCards.week.title',
    today: 'contacts.summaryCards.today.title',
  }

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(ROUTES.CONTACTS)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
              {t('contacts.title')}
            </p>
            <h1 className="mt-2 text-2xl font-bold">{t(titleKeyMap[activeKey])}</h1>
          </div>
        </div>

        <span className="rounded-full border border-border/70 bg-card/60 px-3 py-1 text-sm font-medium text-muted-foreground">
          {rows.length}
        </span>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card/55">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[1.4fr_140px_150px_110px_140px_160px] gap-3 border-b bg-muted/25 px-4 py-3 text-xs font-semibold text-muted-foreground">
              <span>{t('contacts.columns.name')}</span>
              <span>{t('contacts.columns.stage')}</span>
              <span>{t('contacts.columns.lastContact')}</span>
              <span>{t('contacts.columns.warmth')}</span>
              <span>{t('contacts.fields.source')}</span>
              <span>{t('contacts.summaryTable.createdAt')}</span>
            </div>
            <div className="divide-y">
              {rows.map((contact: ContactWithTags) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => navigate(`${ROUTES.CONTACTS}/${contact.id}`)}
                  className="grid w-full grid-cols-[1.4fr_140px_150px_110px_140px_160px] gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/20"
                >
                  <span className="truncate font-medium">{contact.full_name}</span>
                  <span className="truncate text-muted-foreground">{t(`pipelineStages.${contact.stage}`)}</span>
                  <span className="truncate text-muted-foreground">
                    {contact.last_contact_at ? new Date(contact.last_contact_at).toLocaleDateString() : t('contacts.columns.noLastContact')}
                  </span>
                  <span className="truncate text-muted-foreground">{contact.warmth_score}</span>
                  <span className="truncate text-muted-foreground">{t(`contacts.sources.${contact.source}`)}</span>
                  <span className="truncate text-muted-foreground">{new Date(contact.created_at).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 px-5 py-10 text-sm text-muted-foreground">
          {t('contacts.summaryTable.empty')}
        </div>
      )}
    </div>
  )
}
