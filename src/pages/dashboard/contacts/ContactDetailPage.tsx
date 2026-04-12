import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft, Edit, Archive, ArchiveRestore, Trash2, Calendar, Briefcase,
  MapPin, Heart, Users, Target, Frown, Phone, Mail,
  Plus, Bell, Clock, Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { StageBadge } from '@/components/contacts/StageBadge'
import { WarmthScoreBar } from '@/components/contacts/WarmthScoreBar'
import { ChannelButtons } from '@/components/contacts/ChannelButtons'
import { InteractionTimeline } from '@/components/contacts/InteractionTimeline'
import { QuickNoteInput } from '@/components/contacts/QuickNoteInput'
import { TagSelector } from '@/components/contacts/TagSelector'
import { useContact, useUpdateContactStage, useArchiveContact, useDeleteContact, useSetContactTags } from '@/hooks/useContact'
import { useTranslation } from 'react-i18next'
import { useInteractions, useAddInteraction } from '@/hooks/useInteractions'
import { useTags, useCreateTag } from '@/hooks/useTags'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants'
import { buildContactCoachCue } from '@/lib/contacts/contactCoach'
import type { InteractionType } from '@/lib/contacts/types'
import { useContactFollowUps, useContactAppointments, useCreateFollowUp } from '@/hooks/useCalendar'
import { QUICK_FOLLOW_UP_OFFSETS } from '@/lib/calendar/constants'
import { NewFollowUpModal } from '@/components/calendar/modals/NewFollowUpModal'
import { NewAppointmentModal } from '@/components/calendar/modals/NewAppointmentModal'
import { AIMessageGeneratorModal } from '@/components/messages/AIMessageGeneratorModal'
import { addDays, format as fmtDate2 } from 'date-fns'
import { usePipelineStages } from '@/hooks/usePipeline'
import { getSyncedPipelineStages, resolveStageLabel } from '@/lib/pipeline/stageLabels'

const INTERACTION_TYPE_KEYS: InteractionType[] = [
  'call', 'whatsapp', 'telegram', 'meeting', 'presentation', 'objection', 'email', 'sms', 'note',
]

export function ContactDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const { data: contact, isLoading, isError, error } = useContact(id)
  const { t, i18n } = useTranslation()
  const { data: interactions = [], isLoading: loadingInteractions } = useInteractions(id)
  const { data: allTags = [] } = useTags(userId)
  const { data: pipelineStages = [] } = usePipelineStages(userId)

  const updateStageMutation = useUpdateContactStage(id ?? '', userId)
  const archiveMutation = useArchiveContact()
  const deleteMutation = useDeleteContact()
  const addInteractionMutation = useAddInteraction(id ?? '')
  const setTagsMutation = useSetContactTags(id ?? '')
  const createTagMutation = useCreateTag()
  const dateLocale = i18n.language?.startsWith('en') ? enUS : tr

  const { data: contactFollowUps = [] } = useContactFollowUps(id ?? '', userId)
  const { data: contactAppointments = [] } = useContactAppointments(id ?? '', userId)
  const createFollowUp = useCreateFollowUp(userId)

  const [showAIModal, setShowAIModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [showInteractionModal, setShowInteractionModal] = useState(false)
  const [showAllInteractions, setShowAllInteractions] = useState(false)
  const [interactionType, setInteractionType] = useState<InteractionType>('call')
  const [interactionContent, setInteractionContent] = useState('')
  const [interactionSubject, setInteractionSubject] = useState('')
  const [interactionWarmth, setInteractionWarmth] = useState(0)

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">{t('common.loading')}</div>
  }

  if (isError) {
    console.error('[ContactDetail] Kontak yüklenemedi:', error)
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-destructive font-medium">{t('contacts.loadError')}</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : t('common.unknownError')}
        </p>
        <Button onClick={() => navigate(ROUTES.CONTACTS)}>{t('common.goBack')}</Button>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-muted-foreground">{t('contacts.notFound')}</p>
        <Button onClick={() => navigate(ROUTES.CONTACTS)}>{t('common.goBack')}</Button>
      </div>
    )
  }

  const isCustomer = contact.contact_type === 'customer'
  const returnRoute = isCustomer ? ROUTES.PRODUCT_CUSTOMERS : ROUTES.CONTACTS
  const visibleInteractions = showAllInteractions ? interactions : interactions.slice(0, 10)

  const initials = contact.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const syncedStages = getSyncedPipelineStages(pipelineStages)
  const currentSyncedStage = syncedStages.find((stage) => stage.contactStageKey === contact.stage) ?? null
  const currentStageLabel = currentSyncedStage
    ? resolveStageLabel(currentSyncedStage, t)
    : t(`contactStages.${contact.stage}`, { defaultValue: contact.stage })
  const coachCue = buildContactCoachCue(contact)
  const lastPurchaseDate = isCustomer && contact.birthday ? new Date(contact.birthday) : null
  const reorderWindowDays = isCustomer && typeof contact.children_count === 'number'
    ? contact.children_count
    : null
  const reorderDueDate = lastPurchaseDate && reorderWindowDays !== null
    ? addDays(lastPurchaseDate, reorderWindowDays)
    : null
  const recommendedProduct = isCustomer ? contact.goals?.[0] ?? null : null
  const satisfactionNote = isCustomer ? contact.notes?.trim() ?? '' : ''

  const handleStageChange = async (newStage: string | null) => {
    if (!newStage || newStage === contact.stage) return
    try {
      await updateStageMutation.mutateAsync({ newStage, oldStage: contact.stage })
      toast.success(t('contacts.stage.changed'))
    } catch {
      toast.error(t('contacts.stage.changeError'))
    }
  }

  const handleQuickNote = async (content: string) => {
    await addInteractionMutation.mutateAsync({
      contactId: id!,
      userId,
      type: 'note',
      content,
    })
    toast.success(t('contacts.quickNote.added'))
  }

  const handleInteractionSubmit = async () => {
    if (!interactionContent.trim() && !interactionSubject.trim()) return
    try {
      await addInteractionMutation.mutateAsync({
        contactId: id!,
        userId,
        type: interactionType,
        subject: interactionSubject || t(`interactionTypes.${interactionType}`),
        content: interactionContent || undefined,
        warmthImpact: interactionWarmth,
      })
      toast.success(t('contacts.interaction.added'))
      setShowInteractionModal(false)
      setInteractionContent('')
      setInteractionSubject('')
      setInteractionWarmth(0)
    } catch {
      toast.error(t('contacts.interaction.failed'))
    }
  }

  const handleArchive = async () => {
    await archiveMutation.mutateAsync({ id: id!, archived: !contact.is_archived })
    toast.success(contact.is_archived ? t('contacts.unarchived') : t('contacts.archived'))
  }

  const handleDelete = async () => {
    if (!confirm(t('contacts.deleteConfirm'))) return
    await deleteMutation.mutateAsync(id!)
    toast.success(t('contacts.deleted'))
    navigate(returnRoute)
  }

  const handleTagToggle = async (tagId: string) => {
    const current = contact.tags.map((tg) => tg.id)
    const next = current.includes(tagId) ? current.filter((tid) => tid !== tagId) : [...current, tagId]
    try {
      await setTagsMutation.mutateAsync(next)
    } catch {
      toast.error(t('contacts.tag.error'))
    }
  }

  const handleQuickFollowUp = async (days: number) => {
    const due = addDays(new Date(), days)
    due.setHours(9, 0, 0, 0)
    const action = t('followUps.actionTypes.call')
    await createFollowUp.mutateAsync({
      user_id: userId,
      contact_id: id!,
      title: `${contact!.full_name} - ${action}`,
      action_type: 'call',
      priority: 'medium',
      due_at: due.toISOString(),
      notes: null,
    })
    toast.success(t('followUps.created'))
  }

  const handleCreateTag = async (name: string, color: string) => {
    const newId = await createTagMutation.mutateAsync({
      user_id: userId,
      name,
      color: color as never,
    })
    const current = contact.tags.map((t) => t.id)
    await setTagsMutation.mutateAsync([...current, newId])
    toast.success(t('contacts.tag.added'))
  }

  return (
    <div className="p-4 lg:p-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(returnRoute)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold truncate flex-1">{contact.full_name}</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowAIModal(true)}
            className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white hidden sm:flex"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t('messages.generate')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`${isCustomer ? ROUTES.PRODUCT_CUSTOMERS : ROUTES.CONTACTS}/${id}/duzenle`)}
            className="gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            {t('common.edit')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            className="gap-1.5"
          >
            {contact.is_archived
              ? <><ArchiveRestore className="w-3.5 h-3.5" />{t('common.unarchive')}</>
              : <><Archive className="w-3.5 h-3.5" />{t('common.archive')}</>}
          </Button>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Contact info */}
        <div className="space-y-4">
          {/* Avatar + name */}
          <div className="rounded-lg border border-border bg-card p-4 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary text-xl font-bold flex items-center justify-center mx-auto">
              {initials}
            </div>
            <div>
              <h2 className="font-semibold text-lg">{contact.full_name}</h2>
              {isCustomer ? (
                <p className="text-sm text-muted-foreground">{t('customers.detail.productCustomer')}</p>
              ) : contact.nickname ? (
                <p className="text-sm text-muted-foreground">"{contact.nickname}"</p>
              ) : null}
              {!isCustomer && contact.occupation && (
                <p className="text-sm text-muted-foreground">{contact.occupation}</p>
              )}
            </div>

            {/* Warmth */}
            <WarmthScoreBar score={contact.warmth_score} stage={contact.stage} />

            {/* Stage */}
            {!isCustomer && (
              <div className="flex items-center justify-center gap-2">
                <StageBadge stage={contact.stage} label={currentStageLabel} />
              </div>
            )}

            {/* Channel buttons */}
            <div className="flex justify-center">
              <ChannelButtons contact={contact} />
            </div>

            {/* Tags */}
            <div className="border-t border-border pt-3">
              <TagSelector
                allTags={allTags}
                selectedTagIds={contact.tags.map((t) => t.id)}
                onToggle={handleTagToggle}
                onCreateTag={handleCreateTag}
                userId={userId}
                creationMode="direct"
              />
            </div>
          </div>

          {/* Stage selector */}
          {!isCustomer && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground tracking-wide">{t('contacts.detail.changeStage')}</p>
              <Select value={contact.stage} onValueChange={handleStageChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>{currentStageLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {syncedStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.contactStageKey}>
                      {resolveStageLabel(stage, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Basic info */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground tracking-wide">{t('contacts.detail.info')}</p>
            <div className="space-y-2 text-sm">
              {contact.city && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{contact.city}</span>
                </div>
              )}
              {contact.relationship && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span>{contact.relationship}</span>
                </div>
              )}
              {contact.birthday && !isCustomer && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{format(new Date(contact.birthday), 'd MMMM', { locale: dateLocale })}</span>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{contact.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                <span>{t(`contactSources.${contact.source}`)} · {isCustomer ? t('customers.detail.productCustomer') : t(`contactTypes.${contact.contact_type}`)}</span>
              </div>
            </div>
          </div>

          {/* Delete */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="w-full text-destructive hover:text-destructive border-destructive/30 gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('common.delete')}
          </Button>
        </div>

        {/* MIDDLE: Timeline */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{t('contacts.detail.interactions')}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowInteractionModal(true)}
                className="h-7 text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('common.add')}
              </Button>
            </div>

            <QuickNoteInput onSubmit={handleQuickNote} />

            <div className="border-t border-border pt-4 space-y-4">
              <InteractionTimeline interactions={visibleInteractions} loading={loadingInteractions} />

              {!loadingInteractions && interactions.length > 10 && (
                <div className="border-t border-border/70 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowAllInteractions((value) => !value)}
                  >
                    {showAllInteractions ? t('common.close') : t('contacts.detail.viewAll')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Context */}
        <div className="space-y-4">
          {isCustomer && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">{t('customers.detail.summaryTitle')}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {t('customers.detail.lastPurchase')}
                  </p>
                  <p className="text-sm font-medium">
                    {lastPurchaseDate
                      ? format(lastPurchaseDate, 'd MMMM yyyy', { locale: dateLocale })
                      : t('customers.detail.noLastPurchase')}
                  </p>
                </div>

                <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {t('customers.detail.reorderCycle')}
                  </p>
                  <p className="text-sm font-medium">
                    {reorderWindowDays !== null
                      ? t('customers.detail.reorderCycleValue', { count: reorderWindowDays })
                      : t('customers.detail.noReorderCycle')}
                  </p>
                  {reorderDueDate ? (
                    <p className="text-xs text-muted-foreground">
                      {t('customers.detail.reorderDue', {
                        date: format(reorderDueDate, 'd MMMM yyyy', { locale: dateLocale }),
                      })}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {t('customers.detail.recommendedProduct')}
                  </p>
                  <p className="text-sm font-medium">
                    {recommendedProduct || t('customers.detail.noRecommendedProduct')}
                  </p>
                </div>

                <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {t('customers.detail.satisfactionNote')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {satisfactionNote || t('customers.detail.noSatisfactionNote')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* About */}
          {(contact.interests?.length || contact.goals?.length || contact.pain_points?.length) && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground tracking-wide">
                {isCustomer ? t('customers.detail.aboutTitle') : t('contacts.detail.about')}
              </p>

              {contact.interests && contact.interests.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Heart className="w-3.5 h-3.5 text-pink-500" />
                    {isCustomer ? t('customers.form.fields.products') : t('contacts.detail.interests')}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {contact.interests.map((item) => (
                      <span key={item} className="text-xs bg-muted rounded-full px-2 py-0.5">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {contact.goals && contact.goals.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Target className="w-3.5 h-3.5 text-emerald-500" />
                    {isCustomer ? t('customers.form.fields.nextNeeds') : t('contacts.detail.goals')}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {contact.goals.map((item) => (
                      <span key={item} className="text-xs bg-muted rounded-full px-2 py-0.5">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {contact.pain_points && contact.pain_points.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Frown className="w-3.5 h-3.5 text-red-500" />
                    {isCustomer ? t('customers.form.fields.watchouts') : t('contacts.detail.painPoints')}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {contact.pain_points.map((item) => (
                      <span key={item} className="text-xs bg-muted rounded-full px-2 py-0.5">{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {contact.notes && !isCustomer && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground tracking-wide">
                {isCustomer ? t('customers.form.fields.notes') : t('contacts.detail.notes')}
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}

          {/* Follow up */}
          {contact.next_follow_up_at && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground tracking-wide">{t('contacts.detail.nextFollowup')}</p>
              <p className="text-sm font-medium">
                {format(new Date(contact.next_follow_up_at), 'd MMMM yyyy', { locale: dateLocale })}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(contact.next_follow_up_at), { addSuffix: true, locale: dateLocale })}
              </p>
            </div>
          )}



          {/* Follow-ups */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground tracking-wide">{t('followUps.pageTitle')}</p>
              <button
                onClick={() => setShowFollowUpModal(true)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                {t('followUps.new')}
              </button>
            </div>

            {/* Quick follow-up buttons */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_FOLLOW_UP_OFFSETS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => handleQuickFollowUp(opt.days)}
                  disabled={createFollowUp.isPending}
                  className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
                >
                  {t(`followUps.quickAdd.${opt.key}`)}
                </button>
              ))}
            </div>

            {/* Follow-up list */}
            {contactFollowUps.filter(f => f.status === 'pending').length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('followUps.empty.default')}</p>
            ) : (
              <div className="space-y-1.5">
                {contactFollowUps.filter(f => f.status === 'pending').slice(0, 3).map(fu => (
                  <div key={fu.id} className="flex items-center gap-2 text-xs py-1 border-b border-border/50 last:border-0">
                    <Bell className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="flex-1 truncate">{fu.title}</span>
                    <span className="text-muted-foreground shrink-0">
                      {fmtDate2(new Date(fu.due_at), 'd MMM', { locale: dateLocale })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming appointments */}
            {contactAppointments.length > 0 && (
              <div className="border-t border-border/50 pt-2 space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">{t('calendar.title')}</p>
                {contactAppointments.slice(0, 2).map(apt => (
                  <div key={apt.id} className="flex items-center gap-2 text-xs">
                    <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="flex-1 truncate">{apt.title}</span>
                    <span className="text-muted-foreground shrink-0">
                      {fmtDate2(new Date(apt.starts_at), 'd MMM HH:mm', { locale: dateLocale })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Assistant */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-primary">{t('contacts.detail.coach.label')}</p>
            </div>

            <div className="rounded-2xl border border-primary/15 bg-background/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/80">
                {t('contacts.detail.coach.nowLabel')}
              </p>
              <p className="mt-2 text-sm font-semibold">
                {t(`contacts.detail.coach.cues.${coachCue.key}.title`)}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t(`contacts.detail.coach.cues.${coachCue.key}.body`)}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t('contacts.detail.coach.messageLabel')}
                </p>
                <p className="mt-2 text-sm text-foreground">
                  {t(`messages.categories.${coachCue.messageCategory}`)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(`messages.tones.${coachCue.tone}`)}
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t('contacts.detail.coach.objectionLabel')}
                </p>
                <p className="mt-2 text-sm text-foreground">
                  {t(`academy.objection.objCategories.${coachCue.objectionCategory}`)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(`contacts.detail.coach.cues.${coachCue.key}.objectionHint`)}
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                size="sm"
                onClick={() => setShowAIModal(true)}
                className="w-full gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                variant="outline"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t('contacts.detail.coach.messageAction')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`${ROUTES.ACADEMY}/itirazlar`)}
                className="w-full gap-1.5"
              >
                {t('contacts.detail.coach.objectionAction')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Follow-up / Appointment Modals */}
      <NewFollowUpModal
        open={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        userId={userId}
        defaultContactId={id}
        defaultContactName={contact?.full_name}
      />
      <NewAppointmentModal
        open={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        userId={userId}
      />

      {/* AI Message Generator Modal */}
      <AIMessageGeneratorModal
        open={showAIModal}
        onClose={() => setShowAIModal(false)}
        contact={contact}
        initialCategory={isCustomer ? 'follow_up' : coachCue.messageCategory}
        initialTone={isCustomer ? 'friendly' : coachCue.tone}
        initialChannel={isCustomer
          ? (contact.whatsapp || contact.phone
            ? 'whatsapp'
            : contact.email
              ? 'email'
              : contact.telegram
                ? 'telegram'
                : contact.instagram
                  ? 'instagram_dm'
                  : 'sms')
          : 'whatsapp'}
        presetLabel={isCustomer ? t('customers.detail.messagePresetLabel') : t(`contacts.detail.coach.cues.${coachCue.key}.title`)}
        presetReason={isCustomer ? t('customers.detail.messagePresetBody') : t(`contacts.detail.coach.cues.${coachCue.key}.body`)}
        deliveryMode={isCustomer ? 'multi' : 'default'}
      />

      {/* Add Interaction Modal */}
      <Dialog open={showInteractionModal} onOpenChange={setShowInteractionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('contacts.interaction.add')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('contacts.interaction.type')}</Label>
              <Select value={interactionType} onValueChange={(v) => setInteractionType(v as InteractionType)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {t(`interactionTypes.${interactionType}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {INTERACTION_TYPE_KEYS.map((value) => (
                    <SelectItem key={value} value={value}>{t(`interactionTypes.${value}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">{t('contacts.interaction.subject')}</Label>
              <Input
                id="subject"
                value={interactionSubject}
                onChange={(e) => setInteractionSubject(e.target.value)}
                placeholder={t('contacts.interaction.subjectPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">{t('contacts.interaction.content')}</Label>
              <Textarea
                id="content"
                value={interactionContent}
                onChange={(e) => setInteractionContent(e.target.value)}
                placeholder={t('contacts.interaction.notesPlaceholder')}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('contacts.interaction.warmthImpact', { value: interactionWarmth > 0 ? `+${interactionWarmth}` : interactionWarmth })}</Label>
              <input
                type="range"
                min={-20}
                max={20}
                step={5}
                value={interactionWarmth}
                onChange={(e) => setInteractionWarmth(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowInteractionModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleInteractionSubmit}
                disabled={addInteractionMutation.isPending}
              >
                {t('common.add')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
