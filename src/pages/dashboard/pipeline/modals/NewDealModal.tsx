import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useCreateDeal } from '@/hooks/usePipeline'
import type { PipelineStage, DealType } from '@/lib/pipeline/types'

interface FormValues {
  title: string
  deal_type: DealType
  value: number
  probability: number
  stage_id: string
  expected_close_date: string
  notes: string
}

interface ContactOption {
  id: string
  full_name: string
  phone: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  userId: string
  stages: PipelineStage[]
  defaultStageId?: string
}

export function NewDealModal({ open, onClose, userId, stages, defaultStageId }: Props) {
  const { t } = useTranslation()
  const createDeal = useCreateDeal(userId)
  const [contactSearch, setContactSearch] = useState('')
  const [contacts, setContacts] = useState<ContactOption[]>([])
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(null)
  const [showContactList, setShowContactList] = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      deal_type: 'prospect',
      value: 0,
      probability: 50,
      stage_id: defaultStageId ?? stages[0]?.id ?? '',
      title: '',
      expected_close_date: '',
      notes: '',
    },
  })

  const dealType = watch('deal_type')

  // Sync stage when default changes
  useEffect(() => {
    if (defaultStageId) setValue('stage_id', defaultStageId)
  }, [defaultStageId, setValue])

  // Sync title when contact + type changes
  useEffect(() => {
    if (selectedContact) {
      const typeLabel = t(`pipeline.dealTypes.${dealType}`)
      setValue('title', `${selectedContact.full_name} - ${typeLabel}`)
    }
  }, [selectedContact, dealType, t, setValue])

  // Search contacts
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

  const onSubmit = async (values: FormValues) => {
    if (!selectedContact) return
    await createDeal.mutateAsync({
      user_id: userId,
      contact_id: selectedContact.id,
      stage_id: values.stage_id,
      title: values.title,
      deal_type: values.deal_type,
      value: Number(values.value),
      probability: Number(values.probability),
      expected_close_date: values.expected_close_date || null,
      notes: values.notes || null,
    })
    handleClose()
  }

  const handleClose = () => {
    reset()
    setSelectedContact(null)
    setContactSearch('')
    setContacts([])
    onClose()
  }

  const stagesFiltered = stages.filter((s) => !s.is_lost_stage)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('pipeline.newDeal')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Contact search */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('contacts.title')} *</label>
            {selectedContact ? (
              <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-muted/30">
                <span className="text-sm font-medium">{selectedContact.full_name}</span>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedContact(null)}
                >
                  {t('common.edit')}
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('contacts.searchPlaceholder')}
                  value={contactSearch}
                  onChange={(e) => { setContactSearch(e.target.value); setShowContactList(true) }}
                  onFocus={() => setShowContactList(true)}
                  className="pl-8"
                />
                {showContactList && contacts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-popover border rounded-md shadow-md mt-1 max-h-48 overflow-y-auto">
                    {contacts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => { setSelectedContact(c); setShowContactList(false); setContactSearch('') }}
                      >
                        <span className="font-medium">{c.full_name}</span>
                        {c.phone && <span className="text-muted-foreground ml-2 text-xs">{c.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Deal type */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('pipeline.deal.type')}</label>
            <select {...register('deal_type')} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
              {(['prospect', 'product_sale', 'recruitment'] as DealType[]).map((type) => (
                <option key={type} value={type}>{t(`pipeline.dealTypes.${type}`)}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('pipeline.deal.title')}</label>
            <Input {...register('title', { required: true })} placeholder={t('pipeline.deal.titlePlaceholder')} />
          </div>

          {/* Value + Probability */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('pipeline.deal.value')} (₺)</label>
              <Input type="number" min={0} {...register('value')} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('pipeline.deal.probability')} (%)</label>
              <Input type="number" min={0} max={100} {...register('probability')} />
            </div>
          </div>

          {/* Stage */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('pipeline.deal.stage')}</label>
            <select {...register('stage_id')} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
              {stagesFiltered.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Expected close date */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('pipeline.deal.expectedClose')} <span className="text-muted-foreground font-normal">({t('common.optional')})</span>
            </label>
            <Input type="date" {...register('expected_close_date')} />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('pipeline.deal.notes')} <span className="text-muted-foreground font-normal">({t('common.optional')})</span>
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="..."
            />
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
