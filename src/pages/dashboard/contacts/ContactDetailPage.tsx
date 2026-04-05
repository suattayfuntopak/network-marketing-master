import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft, Edit, Archive, ArchiveRestore, Trash2, Calendar, Briefcase,
  MapPin, Heart, Users, Target, Frown, Phone, Mail, MessageCircle, Send, Camera,
  Plus,
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
import { TagChip } from '@/components/contacts/TagChip'
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
import { STAGE_LABELS, INTERACTION_TYPE_LABELS, SOURCE_LABELS, CONTACT_TYPE_LABELS } from '@/lib/contacts/constants'
import type { InteractionType } from '@/lib/contacts/types'

const INTERACTION_TYPES: { value: InteractionType; label: string }[] = [
  { value: 'call', label: 'Telefon' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'meeting', label: 'Görüşme' },
  { value: 'presentation', label: 'Sunum' },
  { value: 'objection', label: 'İtiraz' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'note', label: 'Not' },
]

export function ContactDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const { data: contact, isLoading, isError, error } = useContact(id)
  const { t } = useTranslation()
  const { data: interactions = [], isLoading: loadingInteractions } = useInteractions(id)
  const { data: allTags = [] } = useTags(userId)

  const updateStageMutation = useUpdateContactStage(id ?? '', userId)
  const archiveMutation = useArchiveContact()
  const deleteMutation = useDeleteContact()
  const addInteractionMutation = useAddInteraction(id ?? '')
  const setTagsMutation = useSetContactTags(id ?? '')
  const createTagMutation = useCreateTag()

  const [showInteractionModal, setShowInteractionModal] = useState(false)
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

  const initials = contact.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleStageChange = async (newStage: string) => {
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
        subject: interactionSubject || INTERACTION_TYPE_LABELS[interactionType],
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
    navigate(ROUTES.CONTACTS)
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

  const handleCreateTag = async (name: string, color: string) => {
    const newId = await createTagMutation.mutateAsync({
      user_id: userId,
      name,
      color: color as never,
    })
    const current = contact.tags.map((t) => t.id)
    await setTagsMutation.mutateAsync([...current, newId])
  }

  return (
    <div className="p-4 lg:p-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.CONTACTS)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold truncate flex-1">{contact.full_name}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`${ROUTES.CONTACTS}/${id}/duzenle`)}
            className="gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            Düzenle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            className="gap-1.5"
          >
            {contact.is_archived
              ? <><ArchiveRestore className="w-3.5 h-3.5" />Arşivden Çıkar</>
              : <><Archive className="w-3.5 h-3.5" />Arşivle</>}
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
              {contact.nickname && (
                <p className="text-sm text-muted-foreground">"{contact.nickname}"</p>
              )}
              {contact.occupation && (
                <p className="text-sm text-muted-foreground">{contact.occupation}</p>
              )}
            </div>

            {/* Warmth */}
            <WarmthScoreBar score={contact.warmth_score} />

            {/* Stage */}
            <div className="flex items-center justify-center gap-2">
              <StageBadge stage={contact.stage} />
            </div>

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
              />
            </div>
          </div>

          {/* Stage selector */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aşama Değiştir</p>
            <Select value={contact.stage} onValueChange={handleStageChange}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {STAGE_LABELS[contact.stage as keyof typeof STAGE_LABELS] ?? contact.stage}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STAGE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Basic info */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bilgiler</p>
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
              {contact.birthday && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{format(new Date(contact.birthday), 'd MMMM', { locale: tr })}</span>
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
                <span>{SOURCE_LABELS[contact.source]} · {CONTACT_TYPE_LABELS[contact.contact_type]}</span>
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
            Kontağı Sil
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

            <div className="border-t border-border pt-4">
              <InteractionTimeline interactions={interactions} loading={loadingInteractions} />
            </div>
          </div>
        </div>

        {/* RIGHT: Context */}
        <div className="space-y-4">
          {/* About */}
          {(contact.interests?.length || contact.goals?.length || contact.pain_points?.length) && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hakkında</p>

              {contact.interests && contact.interests.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Heart className="w-3.5 h-3.5 text-pink-500" />
                    İlgi Alanları
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
                    Hedefler
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
                    Sıkıntılar
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
          {contact.notes && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notlar</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}

          {/* Follow up */}
          {contact.next_follow_up_at && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sonraki Takip</p>
              <p className="text-sm font-medium">
                {format(new Date(contact.next_follow_up_at), 'd MMMM yyyy', { locale: tr })}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(contact.next_follow_up_at), { addSuffix: true, locale: tr })}
              </p>
            </div>
          )}

          {/* AI Placeholder */}
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Önerileri</p>
            <p className="text-xs text-muted-foreground">Faz 4'te AI destekli öneriler burada görünecek.</p>
          </div>
        </div>
      </div>

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
                    {INTERACTION_TYPES.find(it => it.value === interactionType)?.label ?? interactionType}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {INTERACTION_TYPES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
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
