import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Upload, Download, LayoutGrid, LayoutList, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ContactSearchBar } from '@/components/contacts/ContactSearchBar'
import { ContactFilters } from '@/components/contacts/ContactFilters'
import { ContactTable } from '@/components/contacts/ContactTable'
import { ContactCard } from '@/components/contacts/ContactCard'
import { BulkActionsBar } from '@/components/contacts/BulkActionsBar'
import { ContactImportModal } from './ContactImportModal'
import { useContacts } from '@/hooks/useContacts'
import { useContactFilters } from '@/hooks/useContactFilters'
import { useTags } from '@/hooks/useTags'
import { useArchiveContact, useDeleteContact } from '@/hooks/useContact'
import { useQueryClient } from '@tanstack/react-query'
import { bulkUpdateStage, bulkArchive, bulkDelete, bulkAddTag, bulkRemoveTag } from '@/lib/contacts/mutations'
import { exportContactsToCSV } from '@/lib/contacts/export'
import { fetchContacts } from '@/lib/contacts/queries'
import { contactKeys } from '@/hooks/useContacts'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants'
import { PAGE_SIZE } from '@/lib/contacts/constants'
import type { SortField } from '@/lib/contacts/types'

export function ContactsListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const qc = useQueryClient()
  const { t } = useTranslation()

  const { filters, sort, page, setFilters, setSort, setPage, resetFilters, hasActiveFilters } = useContactFilters()
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [exporting, setExporting] = useState(false)

  const { data, isLoading } = useContacts({
    filters,
    sort,
    page,
    pageSize: PAGE_SIZE,
    userId,
  })

  const { data: tags = [] } = useTags(userId)
  const archiveMutation = useArchiveContact()
  const deleteMutation = useDeleteContact()

  const contacts = data?.data ?? []
  const totalPages = data?.totalPages ?? 1
  const totalCount = data?.count ?? 0

  // Sort toggle
  const handleSort = (field: SortField) => {
    if (sort.field === field) {
      setSort({ field, order: sort.order === 'asc' ? 'desc' : 'asc' })
    } else {
      setSort({ field, order: 'desc' })
    }
  }

  // Selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (contacts.every((c) => selectedIds.includes(c.id))) {
      setSelectedIds([])
    } else {
      setSelectedIds(contacts.map((c) => c.id))
    }
  }

  // Single actions
  const handleEdit = (id: string) => navigate(`${ROUTES.CONTACTS}/${id}/duzenle`)

  const handleArchive = async (id: string, archived: boolean) => {
    try {
      await archiveMutation.mutateAsync({ id, archived })
      toast.success(archived ? t('contacts.archived') : t('contacts.unarchived'))
    } catch {
      toast.error(t('contacts.saveError'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('contacts.deleteConfirm'))) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success(t('contacts.deleted'))
      setSelectedIds((prev) => prev.filter((x) => x !== id))
    } catch {
      toast.error(t('contacts.saveError'))
    }
  }

  // CSV Export
  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await fetchContacts({
        filters,
        sort,
        page: 1,
        pageSize: 10000,
        userId,
      })
      exportContactsToCSV(result.data)
      toast.success(t('contacts.exportCount', { count: result.data.length }))
    } catch {
      toast.error(t('contacts.saveError'))
    } finally {
      setExporting(false)
    }
  }

  // Bulk actions
  const invalidate = () => qc.invalidateQueries({ queryKey: contactKeys.all })

  const handleBulkStage = async (stage: string) => {
    try {
      await bulkUpdateStage(selectedIds, stage)
      await invalidate()
      toast.success(t('contacts.bulk.stageChanged', { count: selectedIds.length }))
      setSelectedIds([])
    } catch {
      toast.error(t('contacts.bulk.error'))
    }
  }

  const handleBulkArchive = async () => {
    try {
      await bulkArchive(selectedIds, true)
      await invalidate()
      toast.success(t('contacts.bulk.archived', { count: selectedIds.length }))
      setSelectedIds([])
    } catch {
      toast.error(t('contacts.bulk.error'))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(t('contacts.bulkDeleteConfirm', { count: selectedIds.length }))) return
    try {
      await bulkDelete(selectedIds)
      await invalidate()
      toast.success(t('contacts.bulk.deleted', { count: selectedIds.length }))
      setSelectedIds([])
    } catch {
      toast.error(t('contacts.bulk.error'))
    }
  }

  const handleBulkAddTag = async (tagId: string) => {
    try {
      await bulkAddTag(selectedIds, tagId)
      await invalidate()
      toast.success(t('contacts.tag.added'))
    } catch {
      toast.error(t('contacts.bulk.error'))
    }
  }

  const handleBulkRemoveTag = async (tagId: string) => {
    try {
      await bulkRemoveTag(selectedIds, tagId)
      await invalidate()
      toast.success(t('contacts.tag.removed'))
    } catch {
      toast.error(t('contacts.bulk.error'))
    }
  }

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('contacts.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalCount > 0 ? t('contacts.total', { count: totalCount }) : t('contacts.noContacts')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting || totalCount === 0}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.export')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImport(true)}
            className="gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.import')}</span>
          </Button>
          <Button onClick={() => navigate(`${ROUTES.CONTACTS}/yeni`)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            {t('contacts.new')}
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <BulkActionsBar
          count={selectedIds.length}
          tags={tags}
          onClear={() => setSelectedIds([])}
          onAddTag={handleBulkAddTag}
          onRemoveTag={handleBulkRemoveTag}
          onChangeStage={handleBulkStage}
          onArchive={handleBulkArchive}
          onDelete={handleBulkDelete}
        />
      )}

      {/* Search + controls */}
      <div className="flex items-center gap-2">
        <ContactSearchBar
          value={filters.search}
          onChange={(search) => setFilters({ search })}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={hasActiveFilters ? 'border-primary text-primary' : ''}
          title={t('common.filter')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M10 12h4" />
          </svg>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
          title={viewMode === 'table' ? t('contacts.viewCard') : t('contacts.viewTable')}
        >
          {viewMode === 'table'
            ? <LayoutGrid className="w-4 h-4" />
            : <LayoutList className="w-4 h-4" />}
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <ContactFilters
          filters={filters}
          tags={tags}
          onChange={setFilters}
          onReset={resetFilters}
          hasActive={hasActiveFilters}
        />
      )}

      {/* Content */}
      {isLoading ? (
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground text-sm">
          {t('common.loading')}
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground text-sm mb-3">
            {hasActiveFilters ? t('contacts.noResults') : t('contacts.noContacts')}
          </p>
          {!hasActiveFilters && (
            <Button onClick={() => navigate(`${ROUTES.CONTACTS}/yeni`)} className="gap-1.5">
              <Plus className="w-4 h-4" />
              {t('contacts.addFirst')}
            </Button>
          )}
          {hasActiveFilters && (
            <Button variant="outline" onClick={resetFilters}>
              {t('contacts.clearFilters')}
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <ContactTable
          contacts={contacts}
          selectedIds={selectedIds}
          sort={sort}
          onSort={handleSort}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              selected={selectedIds.includes(contact.id)}
              onToggleSelect={() => toggleSelect(contact.id)}
              onEdit={() => handleEdit(contact.id)}
              onArchive={() => handleArchive(contact.id, !contact.is_archived)}
              onDelete={() => handleDelete(contact.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {t('common.page', { page, total: totalPages })}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <ContactImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        userId={userId}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: contactKeys.all })
          toast.success(t('contacts.importSuccess'))
        }}
      />
    </div>
  )
}
