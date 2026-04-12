import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { format, addHours } from 'date-fns'
import { Search, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useCreateAppointment, useUpdateAppointment } from '@/hooks/useCalendar'
import type { AppointmentType, AppointmentWithContact } from '@/lib/calendar/types'

interface FormValues {
  title: string
  type: AppointmentType
  location: string
  meeting_url: string
  starts_at: string
  ends_at: string
  all_day: boolean
  description: string
}

interface ContactOption { id: string; full_name: string; phone: string | null }

interface Props {
  open: boolean
  onClose: () => void
  userId: string
  defaultDate?: Date
  editAppointment?: AppointmentWithContact | null
}

function toLocalDateTime(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm")
}

export function NewAppointmentModal({ open, onClose, userId, defaultDate, editAppointment }: Props) {
  const { t } = useTranslation()
  const createAppt = useCreateAppointment(userId)
  const updateAppt = useUpdateAppointment(userId)
  const isEdit = !!editAppointment

  const defaultStart = defaultDate ?? new Date()
  const defaultEnd   = addHours(defaultStart, 1)

  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: {
      type: 'meeting',
      starts_at: format(defaultStart, "yyyy-MM-dd'T'HH:mm"),
      ends_at: format(defaultEnd, "yyyy-MM-dd'T'HH:mm"),
      all_day: false,
    },
  })

  // ── Manual loading state (replaces isSubmitting) ──────────────
  const [loading, setLoading] = useState(false)

  // ── Contact search ────────────────────────────────────────────
  const [contactSearch, setContactSearch] = useState('')
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(null)
  const [showContactList, setShowContactList] = useState(false)

  const { data: contactResults = [], isFetching: searchFetching } = useQuery({
    queryKey: ['contact-search', contactSearch],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nmm_contacts')
        .select('id, full_name, phone')
        .eq('is_archived', false)
        .ilike('full_name', `%${contactSearch}%`)
        .limit(10)
      if (error) console.error('[ContactSearch] Error:', error)
      return (data ?? []) as ContactOption[]
    },
    enabled: open && contactSearch.length >= 2,
    staleTime: 10_000,
  })

  // ── Populate on edit ──────────────────────────────────────────
  useEffect(() => {
    if (editAppointment && open) {
      reset({
        title: editAppointment.title,
        type: editAppointment.type,
        location: editAppointment.location ?? '',
        meeting_url: editAppointment.meeting_url ?? '',
        starts_at: toLocalDateTime(editAppointment.starts_at),
        ends_at: toLocalDateTime(editAppointment.ends_at),
        all_day: editAppointment.all_day,
        description: editAppointment.description ?? '',
      })
      if (editAppointment.contact) {
        setSelectedContact({ id: editAppointment.contact.id, full_name: editAppointment.contact.full_name, phone: editAppointment.contact.phone })
      }
    }
  }, [editAppointment, open, reset])

  const allDay = watch('all_day')

  const onSubmit = async (values: FormValues) => {
    if (loading) return
    setLoading(true)
    try {
      const data = {
        user_id: userId,
        contact_id: selectedContact?.id ?? null,
        title: values.title,
        type: values.type,
        location: values.location || null,
        meeting_url: values.meeting_url || null,
        starts_at: new Date(values.starts_at).toISOString(),
        ends_at: new Date(values.ends_at).toISOString(),
        all_day: values.all_day,
        description: values.description || null,
      }
      if (isEdit && editAppointment) {
        await updateAppt.mutateAsync({ id: editAppointment.id, data })
      } else {
        await createAppt.mutateAsync(data)
      }
      // toast shown by mutation hook (useCreateAppointment / useUpdateAppointment)
      handleClose()
    } catch (err: unknown) {
      console.error('[NewAppointmentModal] Submit error:', err)
      const msg = err instanceof Error ? err.message : t('common.unknownError')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setSelectedContact(null)
    setContactSearch('')
    setShowContactList(false)
    onClose()
  }

  const TYPES: AppointmentType[] = ['meeting', 'call', 'video_call', 'presentation', 'coffee', 'event', 'other']

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('calendar.appointment.edit') : t('calendar.newAppointment')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('calendar.appointment.title')} *</label>
            <Input {...register('title', { required: true })} placeholder={t('calendar.appointment.titlePlaceholder')} />
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('calendar.appointment.type')}</label>
            <select {...register('type')} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
              {TYPES.map(type => (
                <option key={type} value={type}>{t(`calendar.appointment.types.${type}`)}</option>
              ))}
            </select>
          </div>

          {/* Contact — optional */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('contacts.title')} <span className="text-muted-foreground font-normal">({t('common.optional')})</span>
            </label>
            {selectedContact ? (
              <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-muted/30">
                <span className="text-sm">{selectedContact.full_name}</span>
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => { setSelectedContact(null); setContactSearch('') }}>
                  {t('common.edit')}
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                {searchFetching && <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 text-muted-foreground animate-spin" />}
                <Input
                  placeholder={t('contacts.searchPlaceholder')}
                  value={contactSearch}
                  onChange={e => { setContactSearch(e.target.value); setShowContactList(true) }}
                  onFocus={() => setShowContactList(true)}
                  className="pl-8"
                />
                {showContactList && contactSearch.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-popover border rounded-md shadow-md mt-1 max-h-48 overflow-y-auto">
                    {contactResults.length === 0 && !searchFetching && (
                      <p className="px-3 py-2 text-sm text-muted-foreground">{t('contacts.notFound')}</p>
                    )}
                    {contactResults.map(c => (
                      <button key={c.id} type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => { setSelectedContact(c); setShowContactList(false); setContactSearch('') }}>
                        <span className="font-medium">{c.full_name}</span>
                        {c.phone && <span className="text-muted-foreground ml-2 text-xs">{c.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* All day */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('all_day')} className="w-4 h-4 accent-primary" />
            {t('calendar.appointment.allDay')}
          </label>

          {/* Date/time */}
          {!allDay ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('calendar.appointment.startsAt')}</label>
                <Input type="datetime-local" {...register('starts_at', { required: true })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('calendar.appointment.endsAt')}</label>
                <Input type="datetime-local" {...register('ends_at', { required: true })} />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('calendar.appointment.startsAt')}</label>
              <Input type="date" {...register('starts_at', { required: true })} />
            </div>
          )}

          {/* Location / URL */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('calendar.appointment.location')}</label>
              <Input {...register('location')} placeholder="Starbucks..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('calendar.appointment.meetingUrl')}</label>
              <Input {...register('meeting_url')} placeholder="https://..." />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('calendar.appointment.description')} <span className="text-muted-foreground font-normal">({t('common.optional')})</span>
            </label>
            <textarea {...register('description')} rows={2}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />{t('common.saving')}</>
                : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
