import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ArrowUpRight, CalendarClock, CheckCircle2, Clock3, GitBranch, MoreHorizontal, Sparkles, UserPlus, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { FollowUpItem } from '@/components/calendar/FollowUpItem'
import { NewFollowUpModal } from '@/components/calendar/modals/NewFollowUpModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { WarmthScoreBadge } from '@/components/contacts/WarmthScoreBadge'
import { PageState } from '@/components/shared/PageState'
import { InviteWorkspaceMemberDialog } from '@/components/team/InviteWorkspaceMemberDialog'
import { useAuth } from '@/hooks/useAuth'
import { useContactInsights } from '@/hooks/useContacts'
import { useCompleteFollowUp, useFollowUps, useSnoozeFollowUp } from '@/hooks/useCalendar'
import { usePipelineStages } from '@/hooks/usePipeline'
import {
  useBootstrapWorkspace,
  useUpdateWorkspaceRelationship,
  useUpdateWorkspaceMember,
  useWorkspaceContext,
  useWorkspaceMembers,
  useWorkspacePendingMembers,
} from '@/hooks/useWorkspace'
import { buildTeamRadarInsight, type TeamRadarStatus } from '@/lib/team/teamRadar'
import { buildPageWindow } from '@/lib/pagination'
import { resolveContactStageLabel } from '@/lib/pipeline/stageLabels'
import { ROUTES } from '@/lib/constants'
import { getPreferredWorkspaceId } from '@/lib/workspace/storage'
import { cn } from '@/lib/utils'
import type { FollowUpWithContact } from '@/lib/calendar/types'

const TEAM_MEMBERS_PAGE_SIZE = 15

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .map((name) => name[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getStatusClasses(status: TeamRadarStatus) {
  if (status === 'active') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400'
  }

  if (status === 'gaining_momentum') {
    return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-400'
  }

  if (status === 'slowing_down') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400'
  }

  return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400'
}

function getStatusPriority(status: TeamRadarStatus) {
  if (status === 'needs_support') return 0
  if (status === 'slowing_down') return 1
  if (status === 'gaining_momentum') return 2
  return 3
}

function compareWorkspaceMembers(
  a: {
    membership: { role: 'owner' | 'leader' | 'member' | 'assistant' }
    profile: { full_name: string | null; email: string | null } | null
  },
  b: {
    membership: { role: 'owner' | 'leader' | 'member' | 'assistant' }
    profile: { full_name: string | null; email: string | null } | null
  },
  locale: string
) {
  const rolePriority = { owner: 0, leader: 1, member: 2, assistant: 3 }
  const roleDiff = rolePriority[a.membership.role] - rolePriority[b.membership.role]
  if (roleDiff !== 0) return roleDiff

  return (a.profile?.full_name ?? a.profile?.email ?? '').localeCompare(
    b.profile?.full_name ?? b.profile?.email ?? '',
    locale
  )
}

function getWeekWindow(referenceNow: number) {
  const start = new Date(referenceNow)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return {
    startMs: start.getTime(),
    endMs: end.getTime(),
  }
}

function formatDateTimeLocalInput(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function TeamPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr'
  const [referenceNow] = useState(() => Date.now())
  const [membersPage, setMembersPage] = useState(1)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [showCoachingModal, setShowCoachingModal] = useState(false)
  const [editCoachingTask, setEditCoachingTask] = useState<FollowUpWithContact | null>(null)
  const [selectedSponsorMemberId, setSelectedSponsorMemberId] = useState<string | null>(null)
  const autoBootstrapAttemptedRef = useRef(false)
  const [coachingDraft, setCoachingDraft] = useState<{
    contactId: string
    contactName: string
    title: string
    action_type: 'call' | 'message' | 'check_in'
    priority: 'medium' | 'high' | 'urgent'
    due_at: string
    notes: string
  } | null>(null)
  const preferredWorkspaceId = getPreferredWorkspaceId()
  const { data: workspaceContext, isLoading: workspaceLoading } = useWorkspaceContext(userId, preferredWorkspaceId)
  const workspaceId = workspaceContext?.workspace?.id ?? ''
  const { data: workspaceMembers = [], isLoading: workspaceMembersLoading } = useWorkspaceMembers(workspaceId, userId)
  const { data: pendingMembers = [], isLoading: pendingMembersLoading } = useWorkspacePendingMembers(workspaceId, userId)
  const bootstrapWorkspace = useBootstrapWorkspace(userId)
  const updateWorkspaceMember = useUpdateWorkspaceMember(userId, workspaceId)
  const updateWorkspaceRelationship = useUpdateWorkspaceRelationship(userId, workspaceId)
  const { data: pipelineStages = [] } = usePipelineStages(userId)
  const { data: followUps = [], isLoading: followUpsLoading } = useFollowUps(userId, ['pending', 'snoozed'])
  const completeFollowUp = useCompleteFollowUp(userId)
  const snoozeFollowUp = useSnoozeFollowUp(userId)

  const { data: members = [] } = useContactInsights({
    userId,
    contactTypes: ['distributor'],
    limit: 250,
  })

  const radarMembers = useMemo(() => members.map((member) => buildTeamRadarInsight(member)), [members])
  const radarMemberMap = useMemo(
    () => new Map(radarMembers.map((member) => [member.contact.id, member])),
    [radarMembers]
  )
  const memberIds = useMemo(() => new Set(members.map((member) => member.id)), [members])
  const coachingTasks = useMemo(
    () =>
      followUps
        .filter((followUp) => memberIds.has(followUp.contact.id))
        .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()),
    [followUps, memberIds]
  )
  const coachingTaskMap = useMemo(() => {
    return coachingTasks.reduce<Map<string, FollowUpWithContact[]>>((acc, task) => {
      const current = acc.get(task.contact.id) ?? []
      current.push(task)
      acc.set(task.contact.id, current)
      return acc
    }, new Map())
  }, [coachingTasks])
  const coachingMetrics = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    return {
      overdue: coachingTasks.filter((task) => new Date(task.due_at).getTime() < todayStart.getTime()).length,
      today: coachingTasks.filter((task) => {
        const due = new Date(task.due_at).getTime()
        return due >= todayStart.getTime() && due <= todayEnd.getTime()
      }).length,
      upcoming: coachingTasks.filter((task) => new Date(task.due_at).getTime() > todayEnd.getTime()).length,
    }
  }, [coachingTasks])
  const coachingAnalytics = useMemo(() => {
    const now = new Date()
    const coveredMembers = members.filter((member) => (coachingTaskMap.get(member.id) ?? []).length > 0).length
    const overdueMembers = members.filter((member) =>
      (coachingTaskMap.get(member.id) ?? []).some((task) => new Date(task.due_at).getTime() < now.getTime())
    ).length
    const averageTasks = members.length > 0 ? Math.round((coachingTasks.length / members.length) * 10) / 10 : 0

    const focusMembers = members
      .map((member) => {
        const tasks = [...(coachingTaskMap.get(member.id) ?? [])].sort(
          (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
        )
        const overdueCount = tasks.filter((task) => new Date(task.due_at).getTime() < now.getTime()).length

        return {
          member,
          tasks,
          totalTasks: tasks.length,
          overdueCount,
          nextTask: tasks[0] ?? null,
        }
      })
      .filter((entry) => entry.totalTasks > 0)
      .sort((a, b) => {
        if (b.overdueCount !== a.overdueCount) return b.overdueCount - a.overdueCount
        if (b.totalTasks !== a.totalTasks) return b.totalTasks - a.totalTasks
        if (a.nextTask && b.nextTask) {
          return new Date(a.nextTask.due_at).getTime() - new Date(b.nextTask.due_at).getTime()
        }
        if (a.nextTask) return -1
        if (b.nextTask) return 1
        return b.member.warmth_score - a.member.warmth_score
      })

    return {
      coverageRate: members.length > 0 ? Math.round((coveredMembers / members.length) * 100) : 0,
      coveredMembers,
      noPlanMembers: Math.max(members.length - coveredMembers, 0),
      overdueMembers,
      averageTasks,
      focusMembers: focusMembers.slice(0, 4),
      peakLoadMember: focusMembers[0] ?? null,
    }
  }, [coachingTaskMap, coachingTasks.length, members])
  const coachingRecommendations = useMemo(() => {
    const items: Array<{
      key: 'urgentReset' | 'coverageGap' | 'momentumSupport'
      memberId: string
      memberName: string
      stage: (typeof members)[number]['stage']
      status: TeamRadarStatus
      focusKey: 'followUpDiscipline' | 'newConversations' | 'presentationSupport' | 'decisionSupport'
      leaderSuggestionKey: 'praiseAndExpand' | 'lightCheckIn' | 'defineNextStep' | 'resetWithOneGoal'
      bodyValues: Record<string, string | number>
    }> = []

    const urgentEntry = coachingAnalytics.focusMembers.find((entry) => entry.overdueCount > 0)
    if (urgentEntry) {
      const urgentRadar = radarMemberMap.get(urgentEntry.member.id)
      if (urgentRadar) {
        items.push({
          key: 'urgentReset',
          memberId: urgentEntry.member.id,
          memberName: urgentEntry.member.full_name,
          stage: urgentEntry.member.stage,
          status: urgentRadar.status,
          focusKey: urgentRadar.focusKey,
          leaderSuggestionKey: urgentRadar.leaderSuggestionKey,
          bodyValues: {
            name: urgentEntry.member.full_name,
            overdue: urgentEntry.overdueCount,
          },
        })
      }
    }

    const noPlanCandidate = radarMembers
      .filter((member) => (coachingTaskMap.get(member.contact.id) ?? []).length === 0)
      .filter((member) => member.status === 'needs_support' || member.status === 'slowing_down')
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'needs_support' ? -1 : 1
        return b.contact.warmth_score - a.contact.warmth_score
      })[0]

    if (noPlanCandidate && !items.some((item) => item.memberId === noPlanCandidate.contact.id)) {
      items.push({
        key: 'coverageGap',
        memberId: noPlanCandidate.contact.id,
        memberName: noPlanCandidate.contact.full_name,
        stage: noPlanCandidate.contact.stage,
        status: noPlanCandidate.status,
        focusKey: noPlanCandidate.focusKey,
        leaderSuggestionKey: noPlanCandidate.leaderSuggestionKey,
        bodyValues: {
          name: noPlanCandidate.contact.full_name,
        },
      })
    }

    const momentumCandidate = [...radarMembers]
      .filter((member) => member.status === 'gaining_momentum')
      .sort((a, b) => b.contact.warmth_score - a.contact.warmth_score)[0]

    if (momentumCandidate && !items.some((item) => item.memberId === momentumCandidate.contact.id)) {
      items.push({
        key: 'momentumSupport',
        memberId: momentumCandidate.contact.id,
        memberName: momentumCandidate.contact.full_name,
        stage: momentumCandidate.contact.stage,
        status: momentumCandidate.status,
        focusKey: momentumCandidate.focusKey,
        leaderSuggestionKey: momentumCandidate.leaderSuggestionKey,
        bodyValues: {
          name: momentumCandidate.contact.full_name,
        },
      })
    }

    return items
  }, [coachingAnalytics.focusMembers, coachingTaskMap, radarMemberMap, radarMembers])

  const metrics = useMemo(() => {
    const now = referenceNow
    const totalMembers = members.length
    const activeMembers = radarMembers.filter((member) => member.status === 'active').length
    const newThisMonth = members.filter((member) => now - new Date(member.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000).length
    const joinedMembers = members.filter((member) => member.stage === 'joined').length
    const overdueMembers = members.filter((member) => Boolean(member.next_follow_up_at) && new Date(member.next_follow_up_at!).getTime() < now).length
    const gainingMomentum = radarMembers.filter((member) => member.status === 'gaining_momentum').length
    const needsSupport = radarMembers.filter((member) => member.status === 'needs_support').length

    return {
      totalMembers,
      activeMembers,
      activeRate: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0,
      newThisMonth,
      joinedMembers,
      overdueMembers,
      gainingMomentum,
      needsSupport,
    }
  }, [members, radarMembers, referenceNow])

  const sortedMembers = useMemo(
    () =>
      [...radarMembers].sort((a, b) => {
        const createdDiff = new Date(b.contact.created_at).getTime() - new Date(a.contact.created_at).getTime()
        if (createdDiff !== 0) return createdDiff
        return b.contact.warmth_score - a.contact.warmth_score
      }),
    [radarMembers]
  )
  const memberTotalPages = Math.max(1, Math.ceil(sortedMembers.length / TEAM_MEMBERS_PAGE_SIZE))
  const resolvedMembersPage = Math.min(membersPage, memberTotalPages)
  const memberPageNumbers = useMemo(
    () => buildPageWindow(resolvedMembersPage, memberTotalPages),
    [memberTotalPages, resolvedMembersPage]
  )
  const visibleMembers = useMemo(() => {
    const startIndex = (resolvedMembersPage - 1) * TEAM_MEMBERS_PAGE_SIZE
    return sortedMembers.slice(startIndex, startIndex + TEAM_MEMBERS_PAGE_SIZE)
  }, [resolvedMembersPage, sortedMembers])

  const workspaceRoleLabel = workspaceContext?.membership?.role
    ? t(`team.workspace.roles.${workspaceContext.membership.role}`)
    : null
  const weekWindow = useMemo(() => getWeekWindow(referenceNow), [referenceNow])
  const workspaceRoleCounts = useMemo(() => {
    return workspaceMembers.reduce<Record<string, number>>((acc, member) => {
      const role = member.membership.role
      acc[role] = (acc[role] ?? 0) + 1
      return acc
    }, {})
  }, [workspaceMembers])
  const sponsorTreeLevels = useMemo(() => {
    if (workspaceMembers.length === 0) return []

    const childrenBySponsor = workspaceMembers.reduce<Map<string, number>>((acc, member) => {
      if (!member.sponsorUserId) return acc
      acc.set(member.sponsorUserId, (acc.get(member.sponsorUserId) ?? 0) + 1)
      return acc
    }, new Map())

    const maxDepth = workspaceMembers.reduce((acc, member) => Math.max(acc, member.depth ?? 0), 0)

    return Array.from({ length: maxDepth + 1 }, (_, depth) => ({
      depth,
      members: workspaceMembers
        .filter((member) => (member.depth ?? 0) === depth)
        .sort((a, b) => compareWorkspaceMembers(a, b, i18n.language))
        .map((member) => ({
          ...member,
          childCount: childrenBySponsor.get(member.membership.user_id) ?? 0,
        })),
    })).filter((level) => level.members.length > 0)
  }, [i18n.language, workspaceMembers])
  const sponsorNetworkInsights = useMemo(() => {
    const membersByUserId = new Map(workspaceMembers.map((member) => [member.membership.user_id, member]))
    const childrenBySponsor = workspaceMembers.reduce<Map<string, typeof workspaceMembers>>((acc, member) => {
      if (!member.sponsorUserId) return acc
      const current = acc.get(member.sponsorUserId) ?? []
      current.push(member)
      acc.set(member.sponsorUserId, current)
      return acc
    }, new Map())

    childrenBySponsor.forEach((children, userId) => {
      children.sort((a, b) => compareWorkspaceMembers(a, b, i18n.language))
      childrenBySponsor.set(userId, children)
    })

    const lineageCache = new Map<string, typeof workspaceMembers>()
    const descendantCache = new Map<string, number>()

    const getLineage = (userId: string): typeof workspaceMembers => {
      const cached = lineageCache.get(userId)
      if (cached) return cached

      const member = membersByUserId.get(userId)
      if (!member?.sponsorUserId) {
        lineageCache.set(userId, [])
        return []
      }

      const sponsor = membersByUserId.get(member.sponsorUserId)
      if (!sponsor) {
        lineageCache.set(userId, [])
        return []
      }

      const lineage = [...getLineage(sponsor.membership.user_id), sponsor]
      lineageCache.set(userId, lineage)
      return lineage
    }

    const getDescendantCount = (userId: string): number => {
      const cached = descendantCache.get(userId)
      if (typeof cached === 'number') return cached

      const directChildren = childrenBySponsor.get(userId) ?? []
      const total = directChildren.reduce((sum, child) => {
        return sum + 1 + getDescendantCount(child.membership.user_id)
      }, 0)

      descendantCache.set(userId, total)
      return total
    }

    const peersByUserId = new Map(
      workspaceMembers.map((member) => [
        member.membership.user_id,
        Math.max(workspaceMembers.filter((candidate) => (candidate.depth ?? 0) === (member.depth ?? 0)).length - 1, 0),
      ])
    )

    return {
      membersByUserId,
      childrenBySponsor,
      getLineage,
      getDescendantCount,
      peersByUserId,
    }
  }, [i18n.language, workspaceMembers])
  const selectedSponsorMember = selectedSponsorMemberId
    ? sponsorNetworkInsights.membersByUserId.get(selectedSponsorMemberId) ?? null
    : null
  const selectedSponsorLineage = selectedSponsorMember
    ? sponsorNetworkInsights.getLineage(selectedSponsorMember.membership.user_id)
    : []
  const selectedSponsorChildren = selectedSponsorMember
    ? sponsorNetworkInsights.childrenBySponsor.get(selectedSponsorMember.membership.user_id) ?? []
    : []
  const selectedSponsorDescendantCount = selectedSponsorMember
    ? sponsorNetworkInsights.getDescendantCount(selectedSponsorMember.membership.user_id)
    : 0
  const selectedSponsorPeerCount = selectedSponsorMember
    ? sponsorNetworkInsights.peersByUserId.get(selectedSponsorMember.membership.user_id) ?? 0
    : 0
  const currentWorkspaceRole = workspaceContext?.membership?.role ?? null
  const canManageMembers = currentWorkspaceRole === 'owner' || currentWorkspaceRole === 'leader'
  const sponsorCandidates = useMemo(
    () => workspaceMembers.map((member) => ({
      userId: member.membership.user_id,
      label: member.profile?.full_name ?? member.profile?.email ?? t('team.workspace.memberFallback'),
    })),
    [t, workspaceMembers]
  )
  const weeklyTargetSummary = useMemo(() => {
    const plannedThisWeek = coachingTasks.filter((task) => {
      const due = new Date(task.due_at).getTime()
      return due >= weekWindow.startMs && due <= weekWindow.endMs
    }).length

    const priorityMembers = radarMembers.filter(
      (member) => member.status === 'needs_support' || member.status === 'slowing_down'
    ).length
    const membersWithoutPlan = radarMembers.filter(
      (member) => (coachingTaskMap.get(member.contact.id) ?? []).length === 0
    ).length

    return {
      priorityMembers,
      plannedThisWeek,
      membersWithoutPlan,
    }
  }, [coachingTaskMap, coachingTasks, radarMembers, weekWindow.endMs, weekWindow.startMs])
  const weeklyTargets = useMemo(() => {
    return radarMembers
      .map((member) => {
        const tasks = [...(coachingTaskMap.get(member.contact.id) ?? [])].sort(
          (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
        )
        const overdueCount = tasks.filter((task) => new Date(task.due_at).getTime() < referenceNow).length
        const dueThisWeekCount = tasks.filter((task) => {
          const due = new Date(task.due_at).getTime()
          return due >= weekWindow.startMs && due <= weekWindow.endMs
        }).length
        const nextTask = tasks[0] ?? null
        const targetKey =
          overdueCount > 0
            ? 'resetRhythm'
            : member.status === 'gaining_momentum'
              ? 'expandMomentum'
              : member.focusKey === 'newConversations'
                ? 'buildRhythm'
                : 'secureNextStep'

        return {
          member,
          targetKey,
          openCount: tasks.length,
          overdueCount,
          dueThisWeekCount,
          nextTask,
        }
      })
      .sort((a, b) => {
        const statusDiff = getStatusPriority(a.member.status) - getStatusPriority(b.member.status)
        if (statusDiff !== 0) return statusDiff
        if (b.overdueCount !== a.overdueCount) return b.overdueCount - a.overdueCount
        if (b.dueThisWeekCount !== a.dueThisWeekCount) return b.dueThisWeekCount - a.dueThisWeekCount
        if (a.openCount !== b.openCount) return b.openCount - a.openCount
        if (a.nextTask && b.nextTask) {
          return new Date(a.nextTask.due_at).getTime() - new Date(b.nextTask.due_at).getTime()
        }
        if (a.nextTask) return -1
        if (b.nextTask) return 1
        return b.member.contact.warmth_score - a.member.contact.warmth_score
      })
      .slice(0, 4)
  }, [coachingTaskMap, radarMembers, referenceNow, weekWindow.endMs, weekWindow.startMs])

  const canManageWorkspaceMember = (role: 'owner' | 'leader' | 'member' | 'assistant', isCurrentUser: boolean) => {
    if (!canManageMembers || isCurrentUser) return false
    if (currentWorkspaceRole === 'owner') return role !== 'owner'
    if (currentWorkspaceRole === 'leader') return role === 'member' || role === 'assistant'
    return false
  }

  const handleBootstrapWorkspace = async () => {
    try {
      await bootstrapWorkspace.mutateAsync()
      toast.success(t('team.workspace.bootstrapSuccess'))
    } catch {
      toast.error(t('team.workspace.bootstrapError'))
    }
  }

  const handleWorkspaceMemberUpdate = async (
    memberId: string,
    data: { role?: 'owner' | 'leader' | 'member' | 'assistant'; status?: 'active' | 'paused' | 'removed' }
  ) => {
    try {
      await updateWorkspaceMember.mutateAsync({ memberId, data })
      toast.success(t('team.workspace.memberUpdated'))
    } catch {
      toast.error(t('team.workspace.memberUpdateError'))
    }
  }

  useEffect(() => {
    if (
      autoBootstrapAttemptedRef.current
      || workspaceLoading
      || workspaceContext?.mode === 'workspace'
      || !workspaceContext?.schemaReady
      || bootstrapWorkspace.isPending
    ) {
      return
    }

    autoBootstrapAttemptedRef.current = true
    void handleBootstrapWorkspace()
  }, [bootstrapWorkspace.isPending, workspaceContext?.mode, workspaceContext?.schemaReady, workspaceLoading])

  const handleWorkspaceRelationshipUpdate = async (memberUserId: string, sponsorUserId: string) => {
    try {
      await updateWorkspaceRelationship.mutateAsync({ memberUserId, sponsorUserId })
      toast.success(t('team.workspace.sponsorUpdated'))
    } catch {
      toast.error(t('team.workspace.sponsorUpdateError'))
    }
  }

  const getStageLabel = (stage: (typeof members)[number]['stage']) =>
    resolveContactStageLabel(pipelineStages, stage, t, currentLang)

  const formatDate = (value: string | null) => {
    if (!value) return t('team.labels.noDate')
    return new Date(value).toLocaleDateString(i18n.language)
  }

  const openWeeklyTargetTask = (entry: (typeof weeklyTargets)[number]) => {
    const dueAt = new Date()
    dueAt.setSeconds(0, 0)

    if (entry.overdueCount > 0) {
      dueAt.setHours(17, 0, 0, 0)
    } else if (entry.member.status === 'gaining_momentum') {
      dueAt.setDate(dueAt.getDate() + 2)
      dueAt.setHours(10, 0, 0, 0)
    } else {
      dueAt.setDate(dueAt.getDate() + 1)
      dueAt.setHours(9, 30, 0, 0)
    }

    const actionType =
      entry.targetKey === 'buildRhythm' ? 'message' : entry.targetKey === 'expandMomentum' ? 'check_in' : 'call'
    const priority = entry.overdueCount > 0 ? 'urgent' : entry.member.status === 'needs_support' ? 'high' : 'medium'

    setEditCoachingTask(null)
    setCoachingDraft({
      contactId: entry.member.contact.id,
      contactName: entry.member.contact.full_name,
      title: t(`team.coaching.weeklyTargets.drafts.${entry.targetKey}.title`, {
        name: entry.member.contact.full_name,
      }),
      action_type: actionType,
      priority,
      due_at: formatDateTimeLocalInput(dueAt),
      notes: t(`team.coaching.weeklyTargets.drafts.${entry.targetKey}.notes`, {
        name: entry.member.contact.full_name,
        focus: t(`team.radar.focus.${entry.member.focusKey}`),
      }),
    })
    setShowCoachingModal(true)
  }

  const completeWeeklyTargetTask = (entry: (typeof weeklyTargets)[number]) => {
    if (!entry.nextTask || completeFollowUp.isPending) return
    completeFollowUp.mutate(entry.nextTask.id)
  }

  const snoozeWeeklyTargetTask = (entry: (typeof weeklyTargets)[number]) => {
    if (!entry.nextTask || snoozeFollowUp.isPending) return

    const until = new Date()
    until.setDate(until.getDate() + 1)
    until.setHours(9, 30, 0, 0)
    snoozeFollowUp.mutate({ id: entry.nextTask.id, until })
  }

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('team.title')}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('team.subtitle')}</p>
        </div>

        <div className="rounded-xl border bg-card px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {workspaceContext?.mode === 'workspace' ? t('team.workspace.label') : t('team.summary.label')}
          </div>
          <p className="mt-1 text-sm font-medium">
            {workspaceContext?.mode === 'workspace'
              ? t('team.workspace.value', {
                  workspace: workspaceContext.workspace?.name,
                  members: workspaceContext.memberCount,
                  role: workspaceRoleLabel,
                })
              : t('team.summary.value', {
                  members: metrics.totalMembers,
                  overdue: metrics.overdueMembers,
                })}
          </p>
          {!workspaceLoading && workspaceContext?.mode !== 'workspace' && workspaceContext?.schemaReady ? (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 h-8"
              onClick={() => void handleBootstrapWorkspace()}
              disabled={bootstrapWorkspace.isPending}
            >
              {bootstrapWorkspace.isPending ? t('team.workspace.bootstrapping') : t('team.workspace.bootstrapAction')}
            </Button>
          ) : null}
        </div>
      </div>

      {!workspaceLoading && workspaceContext?.mode === 'workspace' ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>{t('team.sections.workspaceMembers')}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{t('team.workspace.membersBody')}</p>
              </div>
              {canManageMembers ? (
                <Button onClick={() => setInviteDialogOpen(true)} className="gap-1.5">
                  <UserPlus className="h-4 w-4" />
                  {t('team.workspace.inviteAction')}
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {(['owner', 'leader', 'member', 'assistant'] as const).map((role) => (
                <div key={role} className="rounded-2xl border border-border/70 bg-card/60 px-4 py-4">
                  <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {t(`team.workspace.roles.${role}`)}
                  </div>
                  <div className="mt-2 text-2xl font-semibold tabular-nums">{workspaceRoleCounts[role] ?? 0}</div>
                </div>
              ))}
            </div>

            {workspaceMembersLoading ? (
              <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                {t('common.loading')}
              </div>
            ) : workspaceMembers.length > 0 ? (
              <div className="space-y-3">
                {workspaceMembers.map((member) => {
                  const roleLabel = t(`team.workspace.roles.${member.membership.role}`)
                  const joinedLabel = new Date(member.membership.joined_at).toLocaleDateString()
                  const memberCanBeManaged = canManageWorkspaceMember(member.membership.role, member.isCurrentUser)
                  const availableSponsors = sponsorCandidates.filter((candidate) => candidate.userId !== member.membership.user_id)

                  return (
                    <div key={member.membership.id} className="rounded-xl border bg-card/70 p-4">
                      <div className="flex items-start gap-3">
                        <Avatar size="sm">
                          <AvatarFallback>{getInitials(member.profile?.full_name ?? member.profile?.email ?? 'WM')}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold">
                              {member.profile?.full_name ?? member.profile?.email ?? t('team.workspace.memberFallback')}
                            </p>
                            {member.isCurrentUser ? (
                              <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                {t('team.workspace.you')}
                              </span>
                            ) : null}
                            <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {roleLabel}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {member.profile?.email ?? t('team.workspace.noEmail')}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>{t('team.workspace.joinedAt', { date: joinedLabel })}</span>
                            {member.depth ? <span>{t('team.workspace.depth', { count: member.depth })}</span> : null}
                            <span>{t('team.workspace.sponsorLabel', { sponsor: member.sponsorName ?? t('team.workspace.noSponsor') })}</span>
                            {member.profile?.company ? <span>{member.profile.company}</span> : null}
                          </div>
                        </div>
                        {memberCanBeManaged ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-44">
                              <DropdownMenuLabel>{t('team.workspace.manage')}</DropdownMenuLabel>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>{t('team.workspace.changeRole')}</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {(['leader', 'member', 'assistant'] as const)
                                    .filter((role) => role !== member.membership.role)
                                    .map((role) => (
                                      <DropdownMenuItem
                                        key={role}
                                        onClick={() => void handleWorkspaceMemberUpdate(member.membership.id, { role })}
                                      >
                                        {t(`team.workspace.roles.${role}`)}
                                      </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              {availableSponsors.length > 0 ? (
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>{t('team.workspace.changeSponsor')}</DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    {availableSponsors.map((candidate) => (
                                      <DropdownMenuItem
                                        key={candidate.userId}
                                        onClick={() => void handleWorkspaceRelationshipUpdate(member.membership.user_id, candidate.userId)}
                                      >
                                        {candidate.label}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              ) : null}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => void handleWorkspaceMemberUpdate(member.membership.id, { status: 'paused' })}
                              >
                                {t('team.workspace.pauseMember')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => void handleWorkspaceMemberUpdate(member.membership.id, { status: 'removed' })}
                              >
                                {t('team.workspace.removeMember')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                {t('team.workspace.emptyBody')}
              </div>
            )}

            {canManageMembers ? (
              <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold">{t('team.workspace.pendingTitle')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t('team.workspace.pendingBody')}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{pendingMembers.length}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {pendingMembersLoading ? (
                    <div className="rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                      {t('common.loading')}
                    </div>
                  ) : pendingMembers.length > 0 ? (
                    pendingMembers.map((member) => (
                      <div key={member.membership.id} className="rounded-xl border bg-card/70 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <Avatar size="sm">
                            <AvatarFallback>{getInitials(member.profile?.full_name ?? member.profile?.email ?? 'WI')}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {member.profile?.full_name ?? member.profile?.email ?? t('team.workspace.memberFallback')}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {member.profile?.email ?? t('team.workspace.noEmail')}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {t('team.workspace.sponsorLabel', { sponsor: member.sponsorName ?? t('team.workspace.noSponsor') })}
                            </p>
                          </div>
                          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-500">
                            {t('team.workspace.pendingBadge')}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                      {t('team.workspace.pendingEmpty')}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {!workspaceLoading && workspaceContext?.mode === 'workspace' ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t('team.workspace.sponsorTreeTitle')}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{t('team.workspace.sponsorTreeBody')}</p>
            </div>
          </CardHeader>
          <CardContent>
            {workspaceMembersLoading ? (
              <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                {t('common.loading')}
              </div>
            ) : sponsorTreeLevels.length > 0 ? (
              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-max gap-4">
                  {sponsorTreeLevels.map((level) => (
                    <div key={level.depth} className="w-[260px] shrink-0 space-y-3">
                      <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-3">
                        <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          {t('team.workspace.sponsorLevel', { count: level.depth + 1 })}
                        </div>
                        <div className="mt-2 text-sm font-semibold">
                          {t('team.workspace.sponsorLevelHint', { count: level.members.length })}
                        </div>
                      </div>

                      {level.members.map((member) => (
                        <button
                          key={member.membership.id}
                          type="button"
                          onClick={() => setSelectedSponsorMemberId(member.membership.user_id)}
                          className="w-full rounded-2xl border border-border/70 bg-card/70 p-4 text-left transition-colors hover:border-primary/25 hover:bg-muted/20"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar size="sm">
                              <AvatarFallback>{getInitials(member.profile?.full_name ?? member.profile?.email ?? 'WM')}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-semibold">
                                  {member.profile?.full_name ?? member.profile?.email ?? t('team.workspace.memberFallback')}
                                </p>
                                {member.depth === 0 ? (
                                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                    {t('team.workspace.rootBadge')}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t(`team.workspace.roles.${member.membership.role}`)}
                              </p>
                              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                                <p>{t('team.workspace.sponsorLabel', { sponsor: member.sponsorName ?? t('team.workspace.noSponsor') })}</p>
                                <p>{t('team.workspace.childrenCount', { count: member.childCount })}</p>
                                <p className="text-primary">{t('team.workspace.openDetail')}</p>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                {t('team.workspace.emptyBody')}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {members.length === 0 ? (
        <PageState
          variant="empty"
          title={t('team.empty.members')}
          description={t('team.workspace.emptyBody')}
        />
      ) : null}

      <Sheet open={Boolean(selectedSponsorMember)} onOpenChange={(open) => !open && setSelectedSponsorMemberId(null)}>
        <SheetContent side="right" className="overflow-y-auto p-0 sm:max-w-md">
          {selectedSponsorMember ? (
            <>
              <SheetHeader className="border-b border-border/70 pb-4">
                <div className="flex items-start gap-3 pr-10">
                  <Avatar size="sm">
                    <AvatarFallback>
                      {getInitials(selectedSponsorMember.profile?.full_name ?? selectedSponsorMember.profile?.email ?? 'WM')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <SheetTitle className="truncate">
                        {selectedSponsorMember.profile?.full_name ?? selectedSponsorMember.profile?.email ?? t('team.workspace.memberFallback')}
                      </SheetTitle>
                      {selectedSponsorMember.depth === 0 ? (
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {t('team.workspace.rootBadge')}
                        </span>
                      ) : null}
                      {selectedSponsorMember.isCurrentUser ? (
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {t('team.workspace.you')}
                        </span>
                      ) : null}
                    </div>
                    <SheetDescription className="mt-1">
                      {t('team.workspace.memberDetailBody', {
                        role: t(`team.workspace.roles.${selectedSponsorMember.membership.role}`),
                      })}
                    </SheetDescription>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-border/70 px-2 py-0.5">
                        {selectedSponsorMember.profile?.email ?? t('team.workspace.noEmail')}
                      </span>
                      {selectedSponsorMember.profile?.company ? (
                        <span className="rounded-full border border-border/70 px-2 py-0.5">
                          {selectedSponsorMember.profile.company}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-5 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                    <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t('team.workspace.detailMetrics.level')}
                    </div>
                    <div className="mt-2 text-2xl font-semibold tabular-nums">
                      {(selectedSponsorMember.depth ?? 0) + 1}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t('team.workspace.detailMetrics.levelHint', { count: selectedSponsorPeerCount })}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                    <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t('team.workspace.detailMetrics.directLines')}
                    </div>
                    <div className="mt-2 text-2xl font-semibold tabular-nums">{selectedSponsorChildren.length}</div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t('team.workspace.detailMetrics.directLinesHint')}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                    <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t('team.workspace.detailMetrics.lineSize')}
                    </div>
                    <div className="mt-2 text-2xl font-semibold tabular-nums">{selectedSponsorDescendantCount}</div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t('team.workspace.detailMetrics.lineSizeHint')}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                    <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t('team.workspace.detailMetrics.joined')}
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      {new Date(selectedSponsorMember.membership.joined_at).toLocaleDateString(i18n.language)}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t('team.workspace.sponsorLabel', {
                        sponsor: selectedSponsorMember.sponsorName ?? t('team.workspace.noSponsor'),
                      })}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">{t('team.workspace.lineageTitle')}</p>
                  </div>
                  {selectedSponsorLineage.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedSponsorLineage.map((member) => (
                        <button
                          key={member.membership.id}
                          type="button"
                          onClick={() => setSelectedSponsorMemberId(member.membership.user_id)}
                          className="rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground"
                        >
                          {member.profile?.full_name ?? member.profile?.email ?? t('team.workspace.memberFallback')}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">{t('team.workspace.lineageEmpty')}</p>
                  )}
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
                  <div>
                    <p className="text-sm font-semibold">{t('team.workspace.directLinesTitle')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t('team.workspace.directLinesBody')}</p>
                  </div>
                  {selectedSponsorChildren.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {selectedSponsorChildren.map((child) => (
                        <button
                          key={child.membership.id}
                          type="button"
                          onClick={() => setSelectedSponsorMemberId(child.membership.user_id)}
                          className="flex w-full items-start gap-3 rounded-xl border border-border/70 bg-card/70 p-3 text-left transition-colors hover:border-primary/25 hover:bg-muted/20"
                        >
                          <Avatar size="sm">
                            <AvatarFallback>{getInitials(child.profile?.full_name ?? child.profile?.email ?? 'WM')}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold">
                                {child.profile?.full_name ?? child.profile?.email ?? t('team.workspace.memberFallback')}
                              </p>
                              <span className="rounded-full border border-border/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                {t(`team.workspace.roles.${child.membership.role}`)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {child.profile?.email ?? t('team.workspace.noEmail')}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                      {t('team.workspace.directLinesEmpty')}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {members.length > 0 ? (
        <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t('team.stats.members')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalMembers}</div>
            <p className="mt-1 text-xs text-muted-foreground">{t('team.stats.membersHint')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t('team.stats.activeRate')}</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeRate}%</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('team.stats.activeRateHint', { count: metrics.activeMembers })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t('team.stats.newThisMonth')}</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newThisMonth}</div>
            <p className="mt-1 text-xs text-muted-foreground">{t('team.stats.newThisMonthHint')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t('team.stats.joined')}</CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.joinedMembers}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('team.stats.joinedHint', { count: metrics.overdueMembers })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        {([
          { key: 'gaining_momentum', value: metrics.gainingMomentum },
          { key: 'active', value: metrics.activeMembers },
          { key: 'slowing_down', value: Math.max(metrics.totalMembers - metrics.activeMembers - metrics.gainingMomentum - metrics.needsSupport, 0) },
          { key: 'needs_support', value: metrics.needsSupport },
        ] as const).map(({ key, value }) => (
          <div key={key} className="rounded-2xl border border-border/70 bg-card/60 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', getStatusClasses(key))}>
                {t(`team.radar.status.${key}`)}
              </span>
              <span className="text-2xl font-semibold tabular-nums">{value}</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {t(`team.radar.statusDescriptions.${key}`)}
            </p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t('team.coaching.weeklyTargets.title')}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t('team.coaching.weeklyTargets.body')}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t('team.coaching.weeklyTargets.summary.priority')}
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{weeklyTargetSummary.priorityMembers}</div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t('team.coaching.weeklyTargets.summary.priorityHint')}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t('team.coaching.weeklyTargets.summary.planned')}
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{weeklyTargetSummary.plannedThisWeek}</div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t('team.coaching.weeklyTargets.summary.plannedHint')}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t('team.coaching.weeklyTargets.summary.gap')}
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{weeklyTargetSummary.membersWithoutPlan}</div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t('team.coaching.weeklyTargets.summary.gapHint')}
              </p>
            </div>
          </div>

          {weeklyTargets.length > 0 ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {weeklyTargets.map((entry) => (
                <div
                  key={entry.member.contact.id}
                  className="rounded-xl border bg-card/70 p-4 text-left transition-colors hover:border-primary/25 hover:bg-muted/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold">{entry.member.contact.full_name}</p>
                        <span className="rounded-full border border-border/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {getStageLabel(entry.member.contact.stage)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[entry.member.contact.city || t('team.labels.locationFallback'), entry.member.contact.occupation]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    </div>
                    <WarmthScoreBadge score={entry.member.contact.warmth_score} stage={entry.member.contact.stage} />
                  </div>

                  <div className="mt-4 rounded-xl border border-border/70 bg-background/30 px-3 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t('team.coaching.weeklyTargets.targetLabel')}
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {t(`team.coaching.weeklyTargets.targets.${entry.targetKey}`)}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className={cn('rounded-full border px-2 py-0.5 font-medium', getStatusClasses(entry.member.status))}>
                      {t(`team.radar.status.${entry.member.status}`)}
                    </span>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 font-medium text-primary">
                      {t(`team.radar.focus.${entry.member.focusKey}`)}
                    </span>
                    <span className="rounded-full border border-border/70 px-2 py-0.5 font-medium text-muted-foreground">
                      {t('team.coaching.weeklyTargets.metrics.open', { count: entry.openCount })}
                    </span>
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 font-medium',
                        entry.overdueCount > 0
                          ? 'border-rose-500/20 bg-rose-500/10 text-rose-500'
                          : 'border-border/70 text-muted-foreground'
                      )}
                    >
                      {t('team.coaching.weeklyTargets.metrics.overdue', { count: entry.overdueCount })}
                    </span>
                    <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 font-medium text-sky-500">
                      {t('team.coaching.weeklyTargets.metrics.thisWeek', { count: entry.dueThisWeekCount })}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    {entry.nextTask
                      ? t('team.coaching.nextTaskHint', {
                          title: entry.nextTask.title,
                          date: formatDate(entry.nextTask.due_at),
                        })
                      : t('team.coaching.noTaskHint')}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    {t(`team.radar.suggestions.${entry.member.leaderSuggestionKey}`)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {entry.nextTask ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => completeWeeklyTargetTask(entry)}
                          disabled={completeFollowUp.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {t('team.coaching.weeklyTargets.actions.completeTask')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => snoozeWeeklyTargetTask(entry)}
                          disabled={snoozeFollowUp.isPending}
                        >
                          <Clock3 className="h-4 w-4" />
                          {t('team.coaching.weeklyTargets.actions.snoozeTask')}
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => openWeeklyTargetTask(entry)}
                      >
                        <CalendarClock className="h-4 w-4" />
                        {t('team.coaching.weeklyTargets.actions.openTask')}
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`${ROUTES.CONTACTS}/${entry.member.contact.id}`)}
                    >
                      {t('team.coaching.weeklyTargets.actions.openContact')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
              {t('team.coaching.weeklyTargets.empty')}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{t('team.coaching.title')}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{t('team.coaching.body')}</p>
            </div>
            <Button
              onClick={() => {
                setEditCoachingTask(null)
                setShowCoachingModal(true)
              }}
              className="gap-1.5"
            >
              <CalendarClock className="h-4 w-4" />
              {t('team.coaching.newTask')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {([
              { key: 'overdue', value: coachingMetrics.overdue, tone: 'border-rose-500/20 bg-rose-500/10 text-rose-100' },
              { key: 'today', value: coachingMetrics.today, tone: 'border-amber-500/20 bg-amber-500/10 text-amber-100' },
              { key: 'upcoming', value: coachingMetrics.upcoming, tone: 'border-sky-500/20 bg-sky-500/10 text-sky-100' },
            ] as const).map(({ key, value, tone }) => (
              <div key={key} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`}>
                    {t(`team.coaching.metrics.${key}`)}
                  </span>
                  <span className="text-2xl font-semibold tabular-nums">{value}</span>
                </div>
              </div>
            ))}
          </div>

          {followUpsLoading ? (
            <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : coachingTasks.length > 0 ? (
            <div className="space-y-3">
              {coachingTasks.slice(0, 6).map((task) => (
                <FollowUpItem
                  key={task.id}
                  followUp={task}
                  userId={userId}
                  onEdit={(followUp) => {
                    setEditCoachingTask(followUp)
                    setShowCoachingModal(true)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
              {t('team.coaching.empty')}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{t('team.coaching.analyticsTitle')}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{t('team.coaching.analyticsBody')}</p>
            </div>
            {coachingAnalytics.peakLoadMember ? (
              <div className="rounded-xl border border-border/70 bg-card/60 px-3 py-2 text-right">
                <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {t('team.coaching.peakLoadLabel')}
                </div>
                <p className="mt-1 text-sm font-semibold">{coachingAnalytics.peakLoadMember.member.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {t('team.coaching.peakLoadValue', {
                    count: coachingAnalytics.peakLoadMember.totalTasks,
                    overdue: coachingAnalytics.peakLoadMember.overdueCount,
                  })}
                </p>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t('team.coaching.analytics.coverage')}
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{coachingAnalytics.coverageRate}%</div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t('team.coaching.analytics.coverageHint', {
                  covered: coachingAnalytics.coveredMembers,
                  total: metrics.totalMembers,
                })}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t('team.coaching.analytics.risk')}
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{coachingAnalytics.overdueMembers}</div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t('team.coaching.analytics.riskHint', {
                  overdue: coachingAnalytics.overdueMembers,
                  noPlan: coachingAnalytics.noPlanMembers,
                })}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t('team.coaching.analytics.load')}
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{coachingAnalytics.averageTasks}</div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t('team.coaching.analytics.loadHint', { count: coachingTasks.length })}
              </p>
            </div>
          </div>

          {coachingAnalytics.focusMembers.length > 0 ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">{t('team.coaching.focusListTitle')}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('team.coaching.focusListBody')}</p>
              </div>
              <div className="grid gap-3 xl:grid-cols-2">
                {coachingAnalytics.focusMembers.map((entry) => (
                  <button
                    key={entry.member.id}
                    type="button"
                    onClick={() => navigate(`${ROUTES.CONTACTS}/${entry.member.id}`)}
                    className="rounded-xl border bg-card/70 p-4 text-left transition-colors hover:border-primary/25 hover:bg-muted/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold">{entry.member.full_name}</p>
                          <span className="rounded-full border border-border/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {getStageLabel(entry.member.stage)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[entry.member.city || t('team.labels.locationFallback'), entry.member.occupation]
                            .filter(Boolean)
                            .join(' • ')}
                        </p>
                      </div>
                      <WarmthScoreBadge score={entry.member.warmth_score} stage={entry.member.stage} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 font-medium text-sky-500">
                        {t('team.coaching.focusMetrics.openTasks', { count: entry.totalTasks })}
                      </span>
                      <span
                        className={cn(
                          'rounded-full border px-2 py-0.5 font-medium',
                          entry.overdueCount > 0
                            ? 'border-rose-500/20 bg-rose-500/10 text-rose-500'
                            : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                        )}
                      >
                        {t('team.coaching.focusMetrics.overdueTasks', { count: entry.overdueCount })}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {entry.nextTask
                        ? t('team.coaching.nextTaskHint', {
                            title: entry.nextTask.title,
                            date: formatDate(entry.nextTask.due_at),
                          })
                        : t('team.coaching.noTaskHint')}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
              {t('team.coaching.analyticsEmpty')}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t('team.coaching.recommendations.title')}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t('team.coaching.recommendations.body')}</p>
          </div>
        </CardHeader>
        <CardContent>
          {coachingRecommendations.length > 0 ? (
            <div className="grid gap-3 xl:grid-cols-3">
              {coachingRecommendations.map((recommendation) => (
                <div key={recommendation.key} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{t(`team.coaching.recommendations.items.${recommendation.key}.title`)}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{recommendation.memberName}</p>
                    </div>
                    <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', getStatusClasses(recommendation.status))}>
                      {t(`team.radar.status.${recommendation.status}`)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-border/70 px-2 py-0.5 font-medium text-muted-foreground">
                      {getStageLabel(recommendation.stage)}
                    </span>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 font-medium text-primary">
                      {t(`team.radar.focus.${recommendation.focusKey}`)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {t(`team.coaching.recommendations.items.${recommendation.key}.body`, recommendation.bodyValues)}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    {t(`team.radar.suggestions.${recommendation.leaderSuggestionKey}`)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => navigate(`${ROUTES.CONTACTS}/${recommendation.memberId}`)}
                  >
                    {t('dashboard.focus.openContact')}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
              {t('team.coaching.recommendations.empty')}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{t('team.sections.membersList')}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('team.sections.membersListBody')}
              </p>
            </div>
            {memberTotalPages > 1 ? (
              <div className="text-xs font-medium text-muted-foreground">
                {t('common.page', { page: resolvedMembersPage, total: memberTotalPages })}
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleMembers.length > 0 ? (
            visibleMembers.map((member, index) => (
              <button
                key={member.contact.id}
                type="button"
                onClick={() => navigate(`${ROUTES.CONTACTS}/${member.contact.id}`)}
                className="w-full rounded-xl border bg-card/70 p-4 text-left transition-colors hover:border-primary/25 hover:bg-muted/20"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start">
                  <div className="flex items-center gap-3 md:flex-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {(resolvedMembersPage - 1) * TEAM_MEMBERS_PAGE_SIZE + index + 1}
                    </div>
                    <Avatar size="sm">
                      <AvatarFallback>{getInitials(member.contact.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold">{member.contact.full_name}</p>
                        <span className="rounded-full border border-border/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {getStageLabel(member.contact.stage)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[member.contact.city || t('team.labels.locationFallback'), member.contact.occupation]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', getStatusClasses(member.status))}>
                      {t(`team.radar.status.${member.status}`)}
                    </span>
                    <WarmthScoreBadge score={member.contact.warmth_score} stage={member.contact.stage} />
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                  <p>
                    <span className="font-medium text-foreground">{t('team.labels.addedAt')}:</span>{' '}
                    {formatDate(member.contact.created_at)}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{t('team.labels.lastContact')}:</span>{' '}
                    {formatDate(member.contact.last_contact_at)}
                  </p>
                  <p className="md:text-right">{t(`team.radar.momentum.${member.momentumKey}`)}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              {t('team.empty.members')}
            </div>
          )}
          {memberTotalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/70 pt-2">
              {memberPageNumbers.map((pageNumber) => (
                <Button
                  key={pageNumber}
                  type="button"
                  variant={pageNumber === resolvedMembersPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMembersPage(pageNumber)}
                  className="h-8 min-w-8 px-2"
                >
                  {pageNumber}
                </Button>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
        </>
      ) : null}

      <InviteWorkspaceMemberDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        workspaceId={workspaceId}
        currentUserId={userId}
      />
      <NewFollowUpModal
        open={showCoachingModal}
        onClose={() => {
          setShowCoachingModal(false)
          setEditCoachingTask(null)
          setCoachingDraft(null)
        }}
        userId={userId}
        defaultContactId={coachingDraft?.contactId}
        defaultContactName={coachingDraft?.contactName}
        defaultDraft={coachingDraft}
        editFollowUp={editCoachingTask}
      />
    </div>
  )
}
