import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Package2, Plus, RefreshCw, Search } from 'lucide-react'
import { startOfMonth } from 'date-fns'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useContacts } from '@/hooks/useContacts'
import { useAuth } from '@/hooks/useAuth'
import { fetchContacts } from '@/lib/contacts/queries'
import { exportContactsToCSV } from '@/lib/contacts/export'
import { PAGE_SIZE } from '@/lib/contacts/constants'
import { ROUTES } from '@/lib/constants'
import { DEFAULT_FILTERS, DEFAULT_SORT, type ContactWithTags } from '@/lib/contacts/types'

function formatList(items: string[] | null, fallback: string) {
  if (!items || items.length === 0) return fallback
  if (items.length === 1) return items[0]
  return `${items.slice(0, 2).join(', ')}${items.length > 2 ? ` +${items.length - 2}` : ''}`
}

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

  const filters = useMemo(
    () => ({
      ...DEFAULT_FILTERS,
      search,
      contactTypes: ['customer'],
    }),
    [search]
  )

  const insightFilters = useMemo(
    () => ({
      ...DEFAULT_FILTERS,
      contactTypes: ['customer'],
    }),
    []
  )

  const { data, isLoading, isError } = useContacts({
    filters,
    sort: { field: 'created_at', order: 'desc' },
    page: 1,
    pageSize: PAGE_SIZE,
    userId,
  })

  const { data: insightData } = useContacts({
    filters: insightFilters,
    sort: DEFAULT_SORT,
    page: 1,
    pageSize: 10000,
    userId,
  })

  const rows = data?.data ?? []
  const insightRows = insightData?.data ?? rows

  const metrics = useMemo(() => {
    const monthStart = startOfMonth(new Date())
    const dueSoonThreshold = Date.now() + 14 * 24 * 60 * 60 * 1000

    return {
      total: insightRows.length,
      month: insightRows.filter((contact) => new Date(contact.created_at) >= monthStart).length,
      activeProducts: insightRows.filter((contact) => (contact.interests?.length ?? 0) > 0).length,
      dueSoon: insightRows.filter((contact) => {
        if (!contact.next_follow_up_at) return false
        const nextTouch = new Date(contact.next_follow_up_at).getTime()
        return nextTouch <= dueSoonThreshold
      }).length,
    }
  }, [insightRows])

  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await fetchContacts({
        filters: insightFilters,
        sort: DEFAULT_SORT,
        page: 1,
        pageSize: 10000,
        userId,
      })
      exportContactsToCSV(result.data)
      toast.success(t('customers.exportCount', { count: result.data.length }))
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
            disabled={exporting || metrics.total === 0}
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
              value: metrics.total,
              label: t('customers.cards.total.title'),
              body: t('customers.cards.total.body'),
              icon: Package2,
            },
            {
              key: 'month',
              value: metrics.month,
              label: t('customers.cards.month.title'),
              body: t('customers.cards.month.body'),
              icon: Plus,
            },
            {
              key: 'activeProducts',
              value: metrics.activeProducts,
              label: t('customers.cards.activeProducts.title'),
              body: t('customers.cards.activeProducts.body'),
              icon: RefreshCw,
            },
            {
              key: 'dueSoon',
              value: metrics.dueSoon,
              label: t('customers.cards.dueSoon.title'),
              body: t('customers.cards.dueSoon.body'),
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
          <div className="min-w-[1120px]">
            <div className="grid grid-cols-[1.35fr_1.2fr_150px_150px_130px_150px_150px_110px] gap-3 border-b bg-muted/25 px-4 py-3 text-xs font-semibold text-muted-foreground">
              <span>{t('customers.columns.name')}</span>
              <span>{t('customers.columns.products')}</span>
              <span>{t('customers.columns.lastContact')}</span>
              <span>{t('customers.columns.nextTouch')}</span>
              <span>{t('customers.columns.loyalty')}</span>
              <span>{t('customers.columns.channel')}</span>
              <span>{t('customers.columns.customerSince')}</span>
              <span>{t('common.edit')}</span>
            </div>
            <div className="divide-y">
              {rows.map((contact: ContactWithTags) => (
                <div
                  key={contact.id}
                  className="grid grid-cols-[1.35fr_1.2fr_150px_150px_130px_150px_150px_110px] items-center gap-3 px-4 py-3 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`${ROUTES.CONTACTS}/${contact.id}`)}
                    className="truncate text-left font-medium transition-colors hover:text-primary"
                  >
                    {contact.full_name}
                  </button>
                  <span className="truncate text-muted-foreground">
                    {formatList(contact.interests, t('customers.fallbacks.noProducts'))}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {formatDate(contact.last_contact_at, i18n.language, t('customers.fallbacks.noDate'))}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {formatDate(contact.next_follow_up_at, i18n.language, t('customers.fallbacks.noPlan'))}
                  </span>
                  <span className="truncate text-muted-foreground">{contact.warmth_score}</span>
                  <span className="truncate text-muted-foreground">{t(`contacts.sources.${contact.source}`)}</span>
                  <span className="truncate text-muted-foreground">
                    {formatDate(contact.created_at, i18n.language, t('customers.fallbacks.noDate'))}
                  </span>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`${ROUTES.PRODUCT_CUSTOMERS}/${contact.id}/duzenle`)}
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
    </div>
  )
}
