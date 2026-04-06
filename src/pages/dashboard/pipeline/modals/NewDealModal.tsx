import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useCreateDeal } from '@/hooks/usePipeline'
import type { PipelineStage, DealType } from '@/lib/pipeline/types'

interface FormValues {
  title: string
  deal_type: DealType
  stage_id: string
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

  // Manual loading state — NEVER use isSubmitting (Bug #1)
  const [loading, setLoading] = useState(false)

  const [contactSearch, setContactSearch] = useState('')
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(null)
  const [showContactList, setShowContactList] = useState(false)

  const { register, watch, setValue, reset } = useForm<FormValues>({
    defaultValues: {
      deal_type: 'prospect',
      stage_id: defaultStageId ?? stages[0]?.id ?? '',
      title: '',
      notes: '',
    },
  })

  const dealType = watch('deal_type')

  // Contact search via useQuery (RLS handles user filter — no userId needed)
  const { data: contactResults = [], isFetching: searchFetching } = useQuery({
    queryKey: ['contact-search-deal', contactSearch],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nmm_contacts')
        .select('id, full_name, phone')
        .eq('is_archived', false)
        .ilike('full_name', `%${contactSearch}%`)
        .limit(8)
      if (error) console.error('[NewDealModal] Contact search error:', error)
      return (data ?? []) as ContactOption[]
    },
    enabled: open && contactSearch.length >= 2,
    staleTime: 10_000,
  })

  // Sync stage when default changes
  useEffect(() => {
    if (defaultStageId) setValue('stage_id', defaultStageId)
  }, [defaultStageId, setValue])

  // Auto-generate title when contact + type changes
  useEffect(() => {
    if (selectedContact) {
      const typeLabel = t(`pipeline.dealTypes.${dealType}`)
      setValue('title', `${selectedContact.full_name} - ${typeLabel}`)
    }
  }, [selectedContact, dealType, t, setValue])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedContact || loading) return

    const form = new FormData(e.currentTarget)
    const title = (form.get('title') as string)?.trim()
    const deal_type = form.get('deal_type') as DealType
    const stage_id = form.get('stage_id') as string
    const notes = (form.get('notes') as string)?.trim()

    if (!title) return

    setLoading(true)
    try {
      await createDeal.mutateAsync({
        user_id: userId,
        contact_id: selectedContact.id,
        stage_id,
        title,
        deal_type,
        value: 0,
        probability: 50,
        expected_close_date: null,
        notes: notes || null,
      })
      handleClose()
    } catch (err: unknown) {
      console.error('[NewDealModal] Submit error:', err)
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
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

  const stagesFiltered = stages.filter((s) => !s.is_lost_stage)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('pipeline.newDeal')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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
                {searchFetching && (
                  <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 text-muted-foreground animate-spin" />
                )}
                <Input
                  placeholder={t('contacts.searchPlaceholder')}
                  value={contactSearch}
                  onChange={(e) => { setContactSearch(e.target.value); setShowContactList(true) }}
                  onFocus={() => setShowContactList(true)}
                  className="pl-8 pr-8"
                />
                {showContactList && contactSearch.length >= 2 && contactResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-popover border rounded-md shadow-md mt-1 max-h-48 overflow-y-auto">
                    {contactResults.map((c) => (
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
            <select name="deal_type" {...register('deal_type')} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
              {(['prospect', 'product_sale', 'recruitment'] as DealType[]).map((type) => (
                <option key={type} value={type}>{t(`pipeline.dealTypes.${type}`)}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('pipeline.deal.title')}</label>
            <Input name="title" {...register('title', { required: true })} placeholder={t('pipeline.deal.titlePlaceholder')} />
          </div>

          {/* Stage */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('pipeline.deal.stage')}</label>
            <select name="stage_id" {...register('stage_id')} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
              {stagesFiltered.map((s) => (
                <option key={s.id} value={s.id}>
                  {t(`pipelineStages.${s.slug}`, { defaultValue: s.name })}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('pipeline.deal.notes')} <span className="text-muted-foreground font-normal">({t('common.optional')})</span>
            </label>
            <textarea
              name="notes"
              {...register('notes')}
              rows={2}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading || !selectedContact}>
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
