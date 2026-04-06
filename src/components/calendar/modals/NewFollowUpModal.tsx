import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { format, addDays } from 'date-fns'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useCreateFollowUp, useUpdateFollowUp } from '@/hooks/useCalendar'
import { QUICK_FOLLOW_UP_OFFSETS } from '@/lib/calendar/constants'
import type { FollowUpActionType, FollowUpPriority, FollowUpWithContact } from '@/lib/calendar/types'

interface FormValues {
  title: string
  action_type: FollowUpActionType
  priority: FollowUpPriority
  due_at: string
  notes: string
}

interface ContactOption { id: string; full_name: string; phone: string | null }

interface Props {
  open: boolean
  onClose: () => void
  userId: string
  defaultContactId?: string
  defaultContactName?: string
  editFollowUp?: FollowUpWithContact | null
}

export function NewFollowUpModal({ open, onClose, userId, defaultContactId, defaultContactName, editFollowUp }: Props) {
  const { t } = useTranslation()
  const createFollowUp = useCreateFollowUp(userId)
  const updateFollowUp = useUpdateFollowUp(userId)
  const isEdit = !!editFollowUp

  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      action_type: 'call',
      priority: 'medium',
      due_at: format(addDays(new Date(), 3), "yyyy-MM-dd'T'HH:mm"),
      notes: '',
    },
  })

  const [contactSearch, setContactSearch] = useState('')
  const [contacts, setContacts] = useState<ContactOption[]>([])
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(null)
  const [showContactList, setShowContactList] = useState(false)
  const [quickOffset, setQuickOffset] = useState<number | null>(3)

  // Pre-fill from default contact
  useEffect(() => {
    if (defaultContactId && defaultContactName && open && !isEdit) {
      setSelectedContact({ id: defaultContactId, full_name: defaultContactName, phone: null })
    }
  }, [defaultContactId, defaultContactName, open, isEdit])

  // Pre-fill on edit
  useEffect(() => {
    if (editFollowUp && open) {
      reset({
        title: editFollowUp.title,
        action_type: editFollowUp.action_type,
        priority: editFollowUp.priority,
        due_at: format(new Date(editFollowUp.due_at), "yyyy-MM-dd'T'HH:mm"),
        notes: editFollowUp.notes ?? '',
      })
      setSelectedContact({ id: editFollowUp.contact.id, full_name: editFollowUp.contact.full_name, phone: editFollowUp.contact.phone })
      setQuickOffset(null)
    }
  }, [editFollowUp, open, reset])

  // Auto-title when contact + action changes
  const actionType = watch('action_type')
  useEffect(() => {
    if (selectedContact && !isEdit) {
      const action = t(`followUps.actionTypes.${actionType}`)
      setValue('title', `${selectedContact.full_name} - ${action}`)
    }
  }, [selectedContact, actionType, t, setValue, isEdit])

  // Contact search
  useEffect(() => {
    if (!contactSearch.trim() || !open) { setContacts([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('nmm_contacts')
        .select('id, full_name, phone')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .ilike('full_name', `%${contactSearch}%`)
        .limit(8)
      setContacts((data as ContactOption[]) ?? [])
    }, 250)
    return () => clearTimeout(timer)
  }, [contactSearch, userId, open])

  const handleQuickDate = (days: number) => {
    setQuickOffset(days)
    const target = addDays(new Date(), days)
    target.setHours(9, 0, 0, 0) // default 09:00
    setValue('due_at', format(target, "yyyy-MM-dd'T'HH:mm"))
  }

  const onSubmit = async (values: FormValues) => {
    if (!selectedContact) return
    const data = {
      user_id: userId,
      contact_id: selectedContact.id,
      title: values.title,
      action_type: values.action_type,
      priority: values.priority,
      due_at: new Date(values.due_at).toISOString(),
      notes: values.notes || null,
    }

    if (isEdit && editFollowUp) {
      await updateFollowUp.mutateAsync({ id: editFollowUp.id, data })
    } else {
      await createFollowUp.mutateAsync(data)
    }
    handleClose()
  }

  const handleClose = () => {
    reset()
    setSelectedContact(null)
    setContactSearch('')
    setContacts([])
    setQuickOffset(3)
    onClose()
  }

  const PRIORITIES: FollowUpPriority[] = ['low', 'medium', 'high', 'urgent']
  const ACTIONS: FollowUpActionType[] = ['call', 'message', 'email', 'visit', 'send_info', 'check_in', 'other']

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('followUps.edit') : t('calendar.newFollowUp')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Contact */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('contacts.title')} *</label>
            {selectedContact ? (
              <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-muted/30">
                <span className="text-sm font-medium">{selectedContact.full_name}</span>
                {!defaultContactId && (
                  <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelectedContact(null)}>
                    {t('common.edit')}
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('contacts.searchPlaceholder')}
                  value={contactSearch}
                  onChange={e => { setContactSearch(e.target.value); setShowContactList(true) }}
                  onFocus={() => setShowContactList(true)}
                  className="pl-8"
                />
                {showContactList && contacts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-popover border rounded-md shadow-md mt-1 max-h-40 overflow-y-auto">
                    {contacts.map(c => (
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

          {/* Action type */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('followUps.actionType')}</label>
            <select {...register('action_type')} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
              {ACTIONS.map(a => <option key={a} value={a}>{t(`followUps.actionTypes.${a}`)}</option>)}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('followUps.title')}</label>
            <Input {...register('title', { required: true })} placeholder={t('followUps.titlePlaceholder')} />
          </div>

          {/* Quick date selection */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('followUps.dueDate')}</label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {QUICK_FOLLOW_UP_OFFSETS.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleQuickDate(opt.days)}
                  className={cn(
                    'text-xs px-2 py-1 rounded-full border transition-colors',
                    quickOffset === opt.days
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:border-muted-foreground'
                  )}
                >
                  {t(`followUps.quickAdd.${opt.key}`)}
                </button>
              ))}
            </div>
            <Input
              type="datetime-local"
              {...register('due_at', { required: true })}
              onChange={e => { setValue('due_at', e.target.value); setQuickOffset(null) }}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('followUps.priority.label')}</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => {
                const colors = { low: 'border-gray-300 text-gray-600', medium: 'border-blue-300 text-blue-600', high: 'border-orange-300 text-orange-600', urgent: 'border-red-300 text-red-600' }
                return (
                  <label key={p} className="flex-1">
                    <input type="radio" value={p} {...register('priority')} className="sr-only" />
                    <div className={cn(
                      'text-center text-xs py-1.5 rounded-md border cursor-pointer transition-colors',
                      colors[p],
                      watch('priority') === p ? `bg-opacity-20 ${p === 'urgent' ? 'bg-red-100' : p === 'high' ? 'bg-orange-100' : p === 'medium' ? 'bg-blue-100' : 'bg-gray-100'} border-current` : 'hover:bg-muted'
                    )}>
                      {t(`followUps.priority.${p}`)}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('common.notes')} <span className="text-muted-foreground font-normal">({t('common.optional')})</span></label>
            <textarea {...register('notes')} rows={2} className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isSubmitting || !selectedContact}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
