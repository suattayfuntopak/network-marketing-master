import type { QueryClient } from '@tanstack/react-query'
import { queryInvalidator } from './invalidator'

/** Huni / günlük özet / istatistik önbelleklerini tazele. */
export function invalidateHubMetrics(qc: QueryClient, workspaceId?: string) {
  queryInvalidator.invalidateHub(qc, workspaceId)
}
