import { useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useInviteWorkspaceMember, useWorkspaceInviteCandidates } from '@/hooks/useWorkspace'
import type { WorkspaceMember } from '@/lib/workspace/types'

interface InviteWorkspaceMemberDialogProps {
  open: boolean
  onClose: () => void
  workspaceId: string
  currentUserId: string
}

export function InviteWorkspaceMemberDialog({
  open,
  onClose,
  workspaceId,
  currentUserId,
}: InviteWorkspaceMemberDialogProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<WorkspaceMember['role']>('member')

  const { data: candidates = [], isLoading } = useWorkspaceInviteCandidates(workspaceId, currentUserId, search)
  const inviteMutation = useInviteWorkspaceMember(currentUserId, workspaceId)

  const reset = () => {
    setSearch('')
    setSelectedUserId('')
    setSelectedRole('member')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleInvite = async () => {
    if (!selectedUserId) return

    try {
      await inviteMutation.mutateAsync({
        candidateUserId: selectedUserId,
        role: selectedRole,
      })
      toast.success(t('team.workspace.inviteSuccess'))
      handleClose()
    } catch {
      toast.error(t('team.workspace.inviteError'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('team.workspace.inviteTitle')}</DialogTitle>
          <DialogDescription>{t('team.workspace.inviteBody')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('team.workspace.searchLabel')}</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('team.workspace.searchPlaceholder')}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">{t('team.workspace.searchHint')}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('team.workspace.inviteRoleLabel')}</label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as WorkspaceMember['role'])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['leader', 'member', 'assistant'] as const).map((role) => (
                  <SelectItem key={role} value={role}>
                    {t(`team.workspace.roles.${role}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t('team.workspace.searchResults')}</p>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {search.trim().length < 2 ? (
                <div className="rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                  {t('team.workspace.searchEmptyHint')}
                </div>
              ) : isLoading ? (
                <div className="rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                  {t('common.loading')}
                </div>
              ) : candidates.length > 0 ? (
                candidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => setSelectedUserId(candidate.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                      selectedUserId === candidate.id
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/20'
                        : 'border-border/70 bg-card/60 hover:border-primary/25'
                    }`}
                  >
                    <p className="text-sm font-semibold">{candidate.full_name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{candidate.email}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {[candidate.company, t(`roles.${candidate.role}`)].filter(Boolean).join(' • ')}
                    </p>
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                  {t('team.workspace.searchNoResults')}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void handleInvite()} disabled={!selectedUserId || inviteMutation.isPending}>
            <UserPlus className="h-4 w-4" />
            {inviteMutation.isPending ? t('team.workspace.inviting') : t('team.workspace.inviteAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
