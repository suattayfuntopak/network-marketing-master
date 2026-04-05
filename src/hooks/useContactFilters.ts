import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ContactFilters, ContactSort, SortField, SortOrder } from '@/lib/contacts/types'
import { DEFAULT_FILTERS, DEFAULT_SORT } from '@/lib/contacts/types'

function parseArray(value: string | null): string[] {
  if (!value) return []
  return value.split(',').filter(Boolean)
}

export function useContactFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: ContactFilters = useMemo(() => ({
    search: searchParams.get('q') ?? '',
    stages: parseArray(searchParams.get('stages')),
    tagIds: parseArray(searchParams.get('tags')),
    warmthMin: Number(searchParams.get('wmin') ?? 0),
    warmthMax: Number(searchParams.get('wmax') ?? 100),
    sources: parseArray(searchParams.get('sources')),
    contactTypes: parseArray(searchParams.get('types')),
    pendingFollowUp: searchParams.get('followup') === '1',
    archived: searchParams.get('archived') === '1',
  }), [searchParams])

  const sort: ContactSort = useMemo(() => ({
    field: (searchParams.get('sortField') as SortField) ?? DEFAULT_SORT.field,
    order: (searchParams.get('sortOrder') as SortOrder) ?? DEFAULT_SORT.order,
  }), [searchParams])

  const page = Number(searchParams.get('page') ?? 1)

  const setFilters = useCallback((updates: Partial<ContactFilters>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const merged = { ...filters, ...updates }

      if (merged.search) next.set('q', merged.search); else next.delete('q')
      if (merged.stages.length) next.set('stages', merged.stages.join(',')); else next.delete('stages')
      if (merged.tagIds.length) next.set('tags', merged.tagIds.join(',')); else next.delete('tags')
      if (merged.warmthMin > 0) next.set('wmin', String(merged.warmthMin)); else next.delete('wmin')
      if (merged.warmthMax < 100) next.set('wmax', String(merged.warmthMax)); else next.delete('wmax')
      if (merged.sources.length) next.set('sources', merged.sources.join(',')); else next.delete('sources')
      if (merged.contactTypes.length) next.set('types', merged.contactTypes.join(',')); else next.delete('types')
      if (merged.pendingFollowUp) next.set('followup', '1'); else next.delete('followup')
      if (merged.archived) next.set('archived', '1'); else next.delete('archived')
      next.set('page', '1')

      return next
    }, { replace: true })
  }, [filters, setSearchParams])

  const setSort = useCallback((newSort: ContactSort) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('sortField', newSort.field)
      next.set('sortOrder', newSort.order)
      next.set('page', '1')
      return next
    }, { replace: true })
  }, [setSearchParams])

  const setPage = useCallback((p: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(p))
      return next
    }, { replace: true })
  }, [setSearchParams])

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  useEffect(() => {
    console.debug('[useContactFilters] filters updated:', { stages: filters.stages, tagIds: filters.tagIds, warmthMin: filters.warmthMin, warmthMax: filters.warmthMax })
  }, [filters])

  const hasActiveFilters = useMemo(() => {
    return (
      !!filters.search ||
      filters.stages.length > 0 ||
      filters.tagIds.length > 0 ||
      filters.sources.length > 0 ||
      filters.contactTypes.length > 0 ||
      filters.warmthMin > 0 ||
      filters.warmthMax < 100 ||
      filters.pendingFollowUp ||
      filters.archived
    )
  }, [filters])

  return {
    filters,
    sort,
    page,
    setFilters,
    setSort,
    setPage,
    resetFilters,
    hasActiveFilters,
    defaultFilters: DEFAULT_FILTERS,
  }
}
