import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ArrowUpRight, MoreHorizontal, Sparkles, UserPlus, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
import { WarmthScoreBadge } from '@/components/contacts/WarmthScoreBadge'
import { PageState } from '@/components/shared/PageState'
import { InviteWorkspaceMemberDialog } from '@/components/team/InviteWorkspaceMemberDialog'
import { useAuth } from '@/hooks/useAuth'
import { useContactInsights } from '@/hooks/useContacts'
import { usePipelineStages } from '@/hooks/usePipeline'
import {
  useBootstrapWorkspace,
  useUpdateWorkspaceMember,
  useWorkspaceContext,
  useWorkspaceMembers,
  useWorkspacePendingMembers,
} from '@/hooks/useWorkspace'
import { buildTeamRadarInsight, type TeamRadarStatus } from '@/lib/team/teamRadar'
import { buildPageWindow } from '@/lib/pagination'
import { resolveContactStageLabel } from '@/lib/pipeline/stageLabels'
import { cn } from '@/lib/utils'

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

export function TeamPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr'
  const [referenceNow] = useState(() => Date.now())
  const [membersPage, setMembersPage] = useState(1)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const { data: workspaceContext, isLoading: workspaceLoading } = useWorkspaceContext(userId)
  const workspaceId = workspaceContext?.workspace?.id ?? ''
  const { data: workspaceMembers = [], isLoading: workspaceMembersLoading } = useWorkspaceMembers(workspaceId, userId)
  const { data: pendingMembers = [], isLoading: pendingMembersLoading } = useWorkspacePendingMembers(workspaceId, userId)
  const bootstrapWorkspace = useBootstrapWorkspace(userId)
  const updateWorkspaceMember = useUpdateWorkspaceMember(userId, workspaceId)
  const { data: pipelineStages = [] } = usePipelineStages(userId)

  const { data: members = [] } = useContactInsights({
    userId,
    contactTypes: ['distributor'],
    limit: 250,
  })

  const radarMembers = useMemo(() => members.map((member) => buildTeamRadarInsight(member)), [members])

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
  const workspaceRoleCounts = useMemo(() => {
    return workspaceMembers.reduce<Record<string, number>>((acc, member) => {
      const role = member.membership.role
      acc[role] = (acc[role] ?? 0) + 1
      return acc
    }, {})
  }, [workspaceMembers])
  const currentWorkspaceRole = workspaceContext?.membership?.role ?? null
  const canManageMembers = currentWorkspaceRole === 'owner' || currentWorkspaceRole === 'leader'

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

  const getStageLabel = (stage: (typeof members)[number]['stage']) =>
    resolveContactStageLabel(pipelineStages, stage, t, currentLang)

  const formatDate = (value: string | null) => {
    if (!value) return t('team.labels.noDate')
    return new Date(value).toLocaleDateString(i18n.language)
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
        </div>
      </div>

      {!workspaceLoading && workspaceContext?.mode !== 'workspace' ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-4">
          <p className="text-sm font-semibold text-foreground">{t('team.workspace.legacyTitle')}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{t('team.workspace.legacyBody')}</p>
          {workspaceContext?.schemaReady ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-xs text-muted-foreground">{t('team.workspace.bootstrapHint')}</p>
              <Button
                size="sm"
                onClick={() => void handleBootstrapWorkspace()}
                disabled={bootstrapWorkspace.isPending}
              >
                {bootstrapWorkspace.isPending ? t('team.workspace.bootstrapping') : t('team.workspace.bootstrapAction')}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {!workspaceLoading && workspaceContext?.mode === 'workspace' ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
          <p className="text-sm font-semibold text-foreground">{t('team.workspace.activeTitle')}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t('team.workspace.activeBody', {
              workspace: workspaceContext.workspace?.name,
              members: workspaceContext.memberCount,
              role: workspaceRoleLabel,
            })}
          </p>
        </div>
      ) : null}

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

      {members.length === 0 ? (
        <PageState
          variant="empty"
          title={t('team.empty.members')}
          description={t('team.workspace.emptyBody')}
        />
      ) : null}

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
                onClick={() => navigate(`/dashboard/contacts/${member.contact.id}`)}
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
    </div>
  )
}
