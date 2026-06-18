import type { QueryClient } from '@tanstack/react-query'
import { queryKeyRoots, queryKeys } from './keys'

export const queryInvalidator = {
  /**
   * Candidate data mutated (add, edit, delete, stage change, notes, status, activity).
   * Automatically invalidates all lists, specific candidate details, notes, activities,
   * and any dependent hub summary / funnel metrics.
   */
  invalidateCandidates: (qc: QueryClient, workspaceId?: string | null, candidateId?: string | null) => {
    qc.invalidateQueries({ queryKey: ['candidates'] })
    if (workspaceId) {
      qc.invalidateQueries({ queryKey: queryKeys.candidates(workspaceId) })
    }
    if (workspaceId && candidateId) {
      qc.invalidateQueries({ queryKey: queryKeys.candidateDetail(workspaceId, candidateId) })
    }
    
    // Invalidate activity logs and notes
    qc.invalidateQueries({ queryKey: queryKeys.candidateActivity() })
    if (candidateId) {
      qc.invalidateQueries({ queryKey: queryKeys.candidateActivity(candidateId) })
      qc.invalidateQueries({ queryKey: queryKeys.candidateNotes(candidateId) })
      qc.invalidateQueries({ queryKey: queryKeys.candidateNotesCount(candidateId) })
    } else {
      qc.invalidateQueries({ queryKey: queryKeys.candidateNotes() })
      qc.invalidateQueries({ queryKey: queryKeys.candidateNotesCount() })
    }
    
    // Changing candidates also impacts hub metrics & funnel actuals
    qc.invalidateQueries({ queryKey: [queryKeyRoots.hub] })
    qc.invalidateQueries({ queryKey: [queryKeyRoots.statsFunnelBundle] })
    qc.invalidateQueries({ queryKey: [queryKeyRoots.panoFieldInsights] })
    qc.invalidateQueries({ queryKey: queryKeys.goalDashboard() })
    qc.invalidateQueries({ queryKey: queryKeys.selfUserProgress() })
  },

  /**
   * Team sponsor/leader or downline member data changed.
   * Standardizes cleaning of team hierarchies, member detail, ranking matrices, and activity pulse charts.
   */
  invalidateTeam: (qc: QueryClient, workspaceId?: string | null, userId?: string | null) => {
    qc.invalidateQueries({ queryKey: ['team'] })
    if (workspaceId) {
      qc.invalidateQueries({ queryKey: queryKeys.team(workspaceId) })
      qc.invalidateQueries({ queryKey: queryKeys.akademiCustomCounts(workspaceId) })
    }
    if (workspaceId && userId) {
      qc.invalidateQueries({ queryKey: queryKeys.memberDetail(workspaceId, userId) })
    }
    // Invalidate batch metrics and ranking maps that depend on team
    qc.invalidateQueries({ queryKey: ['team-field-activity'] })
    qc.invalidateQueries({ queryKey: ['team-period-pulse'] })
    qc.invalidateQueries({ queryKey: ['team-ranking-metrics'] })
    qc.invalidateQueries({ queryKey: ['team-ranking-metrics-batch'] })
    qc.invalidateQueries({ queryKey: ['team-progress-map'] })
  },

  /**
   * Goal / Roadmap updated.
   * Cleans goal statistics, progress widgets, and related hub grids.
   */
  invalidateGoals: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: queryKeys.goalDashboard() })
    qc.invalidateQueries({ queryKey: queryKeys.selfUserProgress() })
    qc.invalidateQueries({ queryKey: [queryKeyRoots.hub] })
    qc.invalidateQueries({ queryKey: [queryKeyRoots.panoFieldInsights] })
    qc.invalidateQueries({ queryKey: [queryKeyRoots.statsFunnelBundle] })
  },

  /**
   * Workspace / Profile settings changed.
   */
  invalidateWorkspace: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: queryKeys.workspace() })
  },

  /**
   * AI generated actions completed / quota changes.
   */
  invalidateAIUsage: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: queryKeys.dailyAiUsage() })
  },

  /**
   * Notifications modified.
   */
  invalidateNotifications: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: queryKeys.notifications() })
  },

  /**
   * Hub metrics refreshed (refresh pull-down or day transitions).
   */
  invalidateHub: (qc: QueryClient, workspaceId?: string | null) => {
    qc.invalidateQueries({ queryKey: [queryKeyRoots.hub] })
    qc.invalidateQueries({ queryKey: [queryKeyRoots.statsFunnelBundle] })
    qc.invalidateQueries({ queryKey: [queryKeyRoots.panoFieldInsights] })
    qc.invalidateQueries({ queryKey: queryKeys.goalDashboard() })
    qc.invalidateQueries({ queryKey: queryKeys.selfUserProgress() })
    if (workspaceId) {
      qc.invalidateQueries({ queryKey: queryKeys.candidates(workspaceId) })
      qc.invalidateQueries({ queryKey: queryKeys.team(workspaceId) })
      qc.invalidateQueries({ queryKey: queryKeys.akademiCustomCounts(workspaceId) })
    }
  }
}
