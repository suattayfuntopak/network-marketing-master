import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from './keys'

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
    qc.invalidateQueries({ queryKey: ['activity'] })
    if (candidateId) {
      qc.invalidateQueries({ queryKey: ['activity', candidateId] })
      qc.invalidateQueries({ queryKey: ['candidate-notes', candidateId] })
      qc.invalidateQueries({ queryKey: ['candidate-notes-count', candidateId] })
    } else {
      qc.invalidateQueries({ queryKey: ['candidate-notes'] })
      qc.invalidateQueries({ queryKey: ['candidate-notes-count'] })
    }
    
    // Changing candidates also impacts hub metrics & funnel actuals
    qc.invalidateQueries({ queryKey: ['hub'] })
    qc.invalidateQueries({ queryKey: ['stats-funnel-bundle'] })
    qc.invalidateQueries({ queryKey: ['pano-field-insights'] })
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
    
    // Academy pulse logs
    qc.invalidateQueries({ queryKey: ['pulse-my'] })
  },

  /**
   * Goal / Roadmap updated.
   * Cleans goal statistics, progress widgets, and related hub grids.
   */
  invalidateGoals: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: queryKeys.goalDashboard() })
    qc.invalidateQueries({ queryKey: queryKeys.selfUserProgress() })
    qc.invalidateQueries({ queryKey: ['hub'] })
    qc.invalidateQueries({ queryKey: ['pano-field-insights'] })
    qc.invalidateQueries({ queryKey: ['stats-funnel-bundle'] })
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
    qc.invalidateQueries({ queryKey: ['hub'] })
    qc.invalidateQueries({ queryKey: ['stats-funnel-bundle'] })
    qc.invalidateQueries({ queryKey: ['pano-field-insights'] })
    qc.invalidateQueries({ queryKey: queryKeys.goalDashboard() })
    qc.invalidateQueries({ queryKey: queryKeys.selfUserProgress() })
    if (workspaceId) {
      qc.invalidateQueries({ queryKey: queryKeys.candidates(workspaceId) })
      qc.invalidateQueries({ queryKey: queryKeys.team(workspaceId) })
      qc.invalidateQueries({ queryKey: queryKeys.akademiCustomCounts(workspaceId) })
    }
  }
}
