import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, Download, MessageSquarePlus, Package2, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NewFollowUpModal } from '@/components/calendar/modals/NewFollowUpModal'
import { AIMessageGeneratorModal } from '@/components/messages/AIMessageGeneratorModal'
import { useContacts, useContactSummaryCounts } from '@/hooks/useContacts'
import { useFollowUps } from '@/hooks/useCalendar'
import { useAuth } from '@/hooks/useAuth'
import { fetchContactsForExport } from '@/lib/contacts/queries'
import { exportContactsToCSV } from '@/lib/contacts/export'
import { PAGE_SIZE } from '@/lib/contacts/constants'
import { ROUTES } from '@/lib/constants'
import { DEFAULT_FILTERS, DEFAULT_SORT, type ContactWithTags } from '@/lib/contacts/types'

function formatDate(value: string | null, locale: string, fallback: string) {
  if (!value) return fallback
  return new Date(value).toLocaleDateString(locale)
}

export function ProductCustomersPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)
  const [followUpContact, setFollowUpContact] = useState<ContactWithTags | null>(null)
  const [messageContact, setMessageContact] = useState<ContactWithTags | null>(null)

  const filters = useMemo(
    () => ({
      ...DEFAULT_FILTERS,
      search,
      contactTypes: ['customer'],
    }),
    [search]
  )

  const { data, isLoading, isError } = useContacts({
    filters,
    sort: { field: 'created_at', order: 'desc' },
    page: 1,
    pageSize: PAGE_SIZE,
    userId,
  })
  const { data: metrics } = useContactSummaryCounts(userId, ['customer'])
  const { data: followUps = [] } = useFollowUps(userId, 'pending')

  const rows = data?.data ?? []
  const customerMetrics = metrics ?? { total: rows.length, month: 0, week: 0, today: 0 }

  const nextFollowUps = useMemo(() => {
    const nextByContact = new Map<string, string>()

    followUps.forEach((item) => {
      if (!item.contact_id || nextByContact.has(item.contact_id)) return
      nextByContact.set(item.contact_id, item.due_at)
    })

    return nextByContact
  }, [followUps])

  const handleExport = async () => {
    setExporting(true)
    try {
      const exportRows = await fetchContactsForExport({
        filters: {
          ...DEFAULT_FILTERS,
          contactTypes: ['customer'],
        },
        sort: DEFAULT_SORT,
        userId,
        batchSize: 250,
      })
      exportContactsToCSV(exportRows)
      toast.success(t('customers.exportCount', { count: exportRows.length }))
    } catch {
      toast.error(t('contacts.saveError'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('customers.title')}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('customers.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting || customerMetrics.total === 0}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            {t('common.export')}
          </Button>
          <Button onClick={() => navigate(`${ROUTES.PRODUCT_CUSTOMERS}/yeni`)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t('customers.new')}
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-primary/15 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.09),transparent_35%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.08),transparent_30%)] p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              key: 'total',
              value: customerMetrics.total,
              label: t('customers.cards.total.title'),
              body: t('customers.cards.total.body'),
              icon: Package2,
            },
            {
              key: 'month',
              value: customerMetrics.month,
              label: t('customers.cards.month.title'),
              body: t('customers.cards.month.body'),
              icon: Plus,
            },
            {
              key: 'week',
              value: customerMetrics.week,
              label: t('customers.cards.week.title'),
              body: t('customers.cards.week.body'),
              icon: CalendarPlus,
            },
            {
              key: 'today',
              value: customerMetrics.today,
              label: t('customers.cards.today.title'),
              body: t('customers.cards.today.body'),
              icon: Search,
            },
          ].map(({ key, value, label, body, icon: Icon }) => (
            <div key={key} className="rounded-2xl border border-border/70 bg-card/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold tabular-nums">{value}</p>
              </div>
              <p className="mt-3 text-sm font-medium">{label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/40 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('customers.searchPlaceholder')}
            className="pl-9"
          />
        </div>
      </div>

      {isError ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 px-5 py-10 text-sm text-muted-foreground">
          {t('customers.loadError')}
        </div>
      ) : isLoading ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 px-5 py-10 text-sm text-muted-foreground">
          {t('common.loading')}
        </div>
      ) : rows.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card/55">
          <div className="min-w-[1100px]">
            <div className="grid grid-cols-[minmax(200px,1.85fr)_minmax(110px,1fr)_108px_minmax(170px,1.45fr)_108px_116px_122px_122px_72px] gap-x-3 gap-y-2 border-b bg-muted/25 px-4 py-3 text-xs font-semibold text-muted-foreground">
              <span>{t('customers.columns.name')}</span>
              <span>{t('customers.columns.source')}</span>
              <span>{t('customers.columns.customerSince')}</span>
              <span>{t('customers.columns.products')}</span>
              <span>{t('customers.columns.lastContact')}</span>
              <span>{t('customers.columns.nextTouch')}</span>
              <span>{t('customers.columns.planFollowUp')}</span>
              <span>{t('customers.columns.aiMessage')}</span>
              <span>{t('common.edit')}</span>
            </div>
            <div className="divide-y">
              {rows.map((contact: ContactWithTags) => (
                <div
                  key={contact.id}
                  className="grid grid-cols-[minmax(200px,1.85fr)_minmax(110px,1fr)_108px_minmax(170px,1.45fr)_108px_116px_122px_122px_72px] items-start gap-x-3 gap-y-2 px-4 py-3 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`${ROUTES.CONTACTS}/${contact.id}`)}
                    className="pr-2 whitespace-normal break-words text-left font-medium leading-5 transition-colors hover:text-primary"
                  >
                    {contact.full_name}
                  </button>
                  <span className="truncate text-muted-foreground">{t(`contactSources.${contact.source}`)}</span>
                  <span className="truncate text-muted-foreground">
                    {formatDate(contact.created_at, i18n.language, t('customers.fallbacks.noDate'))}
                  </span>
                  <div className="space-y-1 text-muted-foreground">
                    {contact.interests && contact.interests.length > 0 ? (
                      contact.interests.map((product) => (
                        <div key={`${contact.id}-${product}`} className="whitespace-normal break-words leading-5">
                          {product}
                        </div>
                      ))
                    ) : (
                      <span>{t('customers.fallbacks.noProducts')}</span>
                    )}
                  </div>
                  <span className="truncate text-muted-foreground">
                    {formatDate(contact.last_contact_at, i18n.language, t('customers.fallbacks.noDate'))}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {formatDate(nextFollowUps.get(contact.id) ?? null, i18n.language, t('customers.fallbacks.noPlan'))}
                  </span>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFollowUpContact(contact)}
                      className="w-full gap-1 px-2 text-xs"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                      {t('customers.actions.planFollowUp')}
                    </Button>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessageContact(contact)}
                      className="w-full gap-1 px-2 text-xs"
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5" />
                      {t('customers.actions.aiMessage')}
                    </Button>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`${ROUTES.PRODUCT_CUSTOMERS}/${contact.id}/duzenle`)}
                      className="w-full px-2 text-xs"
                    >
                      {t('common.edit')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 px-5 py-12 text-center">
          <h2 className="text-lg font-semibold">{t('customers.empty.title')}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">{t('customers.empty.body')}</p>
          <Button onClick={() => navigate(`${ROUTES.PRODUCT_CUSTOMERS}/yeni`)} className="mt-5 gap-1.5">
            <Plus className="h-4 w-4" />
            {t('customers.empty.cta')}
          </Button>
        </div>
      )}

      <NewFollowUpModal
        open={!!followUpContact}
        onClose={() => setFollowUpContact(null)}
        userId={userId}
        defaultContactId={followUpContact?.id}
        defaultContactName={followUpContact?.full_name}
      />

      <AIMessageGeneratorModal
        open={!!messageContact}
        onClose={() => setMessageContact(null)}
        contact={messageContact}
        initialCategory="follow_up"
        initialChannel={
          messageContact?.whatsapp || messageContact?.phone
            ? 'whatsapp'
            : messageContact?.email
              ? 'email'
              : messageContact?.telegram
                ? 'telegram'
                : messageContact?.instagram
                  ? 'instagram_dm'
                  : 'sms'
        }
        initialTone="friendly"
        deliveryMode="multi"
      />
    </div>
  )
}
