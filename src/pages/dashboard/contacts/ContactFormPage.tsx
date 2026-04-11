import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { TagSelector } from '@/components/contacts/TagSelector'
import { useContact, useCreateContact, useUpdateContact } from '@/hooks/useContact'
import { useTranslation } from 'react-i18next'
import { useTags, useCreateTag } from '@/hooks/useTags'
import { useSetContactTags } from '@/hooks/useContact'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants'
import { setContactTags } from '@/lib/contacts/mutations'
import { STAGE_LABELS, SOURCE_LABELS, CONTACT_TYPE_LABELS } from '@/lib/contacts/constants'

const schema = z.object({
  full_name: z.string().min(2, 'En az 2 karakter'),
  nickname: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  telegram: z.string().optional(),
  email: z.string().email('Geçerli email').optional().or(z.literal('')),
  instagram: z.string().optional(),
  city: z.string().optional(),
  occupation: z.string().optional(),
  relationship: z.string().optional(),
  birthday: z.string().optional(),
  children_count: z.coerce.number().int().min(0).optional().nullable(),
  source: z.string().optional(),
  contact_type: z.string().optional(),
  stage: z.string().optional(),
  warmth_score: z.coerce.number().int().min(0).max(100).optional(),
  notes: z.string().optional(),
  interests: z.string().optional(),
  goals: z.string().optional(),
  pain_points: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function ContactFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const isCustomerMode = location.pathname.startsWith(ROUTES.PRODUCT_CUSTOMERS)
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const { data: existingContact, isLoading: loadingContact } = useContact(id)
  const { data: allTags = [] } = useTags(userId)
  const createContact = useCreateContact()
  const updateContact = useUpdateContact(id ?? '')
  const setTags = useSetContactTags(id ?? 'new')
  const createTagMutation = useCreateTag()

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const { t } = useTranslation()
  const returnRoute = isCustomerMode ? ROUTES.PRODUCT_CUSTOMERS : ROUTES.CONTACTS

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      source: 'manual',
      contact_type: isCustomerMode ? 'customer' : 'prospect',
      stage: isCustomerMode ? 'joined' : 'new',
      warmth_score: 50,
    },
  })

  // Populate form for edit
  useEffect(() => {
    if (existingContact) {
      const c = existingContact
      reset({
        full_name: c.full_name,
        nickname: c.nickname ?? '',
        phone: c.phone ?? '',
        whatsapp: c.whatsapp ?? '',
        telegram: c.telegram ?? '',
        email: c.email ?? '',
        instagram: c.instagram ?? '',
        city: c.city ?? '',
        occupation: c.occupation ?? '',
        relationship: c.relationship ?? '',
        birthday: c.birthday ?? '',
        children_count: c.children_count ?? undefined,
        source: c.source,
        contact_type: isCustomerMode ? 'customer' : c.contact_type,
        stage: isCustomerMode ? (c.stage || 'joined') : c.stage,
        warmth_score: c.warmth_score,
        notes: c.notes ?? '',
        interests: c.interests?.join(', ') ?? '',
        goals: c.goals?.join(', ') ?? '',
        pain_points: c.pain_points?.join(', ') ?? '',
      })
      setSelectedTagIds(c.tags.map((t) => t.id))
    }
  }, [existingContact, reset])

  const onSubmit = async (data: FormData) => {
    const parseArray = (s?: string) =>
      s ? s.split(',').map((x) => x.trim()).filter(Boolean) : null

    const payload = {
      user_id: userId,
      full_name: data.full_name,
      nickname: data.nickname || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      telegram: data.telegram || null,
      email: data.email || null,
      instagram: data.instagram || null,
      city: data.city || null,
      occupation: data.occupation || null,
      relationship: data.relationship || null,
      birthday: data.birthday || null,
      children_count: data.children_count ?? null,
      source: (data.source as typeof existingContact extends null ? never : NonNullable<typeof existingContact>['source']) ?? 'manual',
      contact_type: isCustomerMode
        ? 'customer'
        : (data.contact_type as NonNullable<typeof existingContact>['contact_type']) ?? 'prospect',
      stage: isCustomerMode
        ? (existingContact?.stage ?? 'joined')
        : (data.stage as NonNullable<typeof existingContact>['stage']) ?? 'new',
      warmth_score: data.warmth_score ?? 50,
      notes: data.notes || null,
      interests: parseArray(data.interests),
      goals: parseArray(data.goals),
      pain_points: parseArray(data.pain_points),
    }

    setIsSaving(true)
    try {
      if (isEdit && id) {
        await updateContact.mutateAsync(payload)
        await setTags.mutateAsync(selectedTagIds)
        toast.success(t('contacts.updated'))
        navigate(isCustomerMode ? returnRoute : `${ROUTES.CONTACTS}/${id}`, { replace: true })
      } else {
        const newId = await createContact.mutateAsync(payload)
        if (selectedTagIds.length > 0) {
          await setContactTags(newId, selectedTagIds)
        }
        toast.success(t('contacts.saved'))
        console.debug('[ContactForm] Yeni kontak kaydedildi, id:', newId)
        navigate(returnRoute, { replace: true })
      }
    } catch (err) {
      console.error('[ContactForm] Kayıt hatası:', err)
      toast.error(t('contacts.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateTag = async (name: string, color: string) => {
    const id = await createTagMutation.mutateAsync({
      user_id: userId,
      name,
      color: color as never,
    })
    setSelectedTagIds((prev) => [...prev, id])
  }

  if (isEdit && loadingContact) {
    return (
      <div className="p-6 text-center text-muted-foreground">{t('common.loading')}</div>
    )
  }

  const isLoading = isSaving
  const relationshipLabel = isCustomerMode ? t('customers.form.fields.segment') : t('contacts.fields.relationship')
  const relationshipPlaceholder = isCustomerMode
    ? t('customers.form.placeholders.segment')
    : t('contacts.placeholders.relationship')
  const notesLabel = isCustomerMode ? t('customers.form.fields.notes') : t('contacts.fields.notes')
  const notesPlaceholder = isCustomerMode ? t('customers.form.placeholders.notes') : t('contacts.placeholders.notes')
  const interestsLabel = isCustomerMode ? t('customers.form.fields.products') : t('contacts.fields.interests')
  const interestsPlaceholder = isCustomerMode
    ? t('customers.form.placeholders.products')
    : t('contacts.placeholders.interests')
  const goalsLabel = isCustomerMode ? t('customers.form.fields.nextNeeds') : t('contacts.fields.goals')
  const goalsPlaceholder = isCustomerMode
    ? t('customers.form.placeholders.nextNeeds')
    : t('contacts.placeholders.goals')
  const painPointsLabel = isCustomerMode ? t('customers.form.fields.watchouts') : t('contacts.fields.painPoints')
  const painPointsPlaceholder = isCustomerMode
    ? t('customers.form.placeholders.watchouts')
    : t('contacts.placeholders.painPoints')

  return (
    <div className="p-6 pb-20 lg:pb-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(returnRoute)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {isCustomerMode
            ? isEdit
              ? t('customers.edit')
              : t('customers.new')
            : isEdit
              ? t('contacts.edit')
              : t('contacts.new')}
        </h1>
      </div>

      {isEdit && existingContact && (
        <div className="rounded-2xl border border-border/70 bg-card/70 px-4 py-3">
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-lg font-semibold text-primary">{existingContact.full_name}</p>
            {existingContact.nickname ? (
              <span className="rounded-full border border-border/70 bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
                {existingContact.nickname}
              </span>
            ) : null}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="temel">
          <TabsList className="w-full">
            <TabsTrigger value="temel" className="flex-1">{t('contacts.tabs.basic')}</TabsTrigger>
            <TabsTrigger value="detay" className="flex-1">{t('contacts.tabs.detail')}</TabsTrigger>
            <TabsTrigger value="nm" className="flex-1">
              {isCustomerMode ? t('customers.form.tabs.customer') : t('contacts.tabs.network')}
            </TabsTrigger>
            <TabsTrigger value="notlar" className="flex-1">{t('contacts.tabs.notes')}</TabsTrigger>
          </TabsList>

          {/* Tab 1: Temel */}
          <TabsContent value="temel" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="full_name">{t('contacts.fields.fullName')} *</Label>
                <Input id="full_name" {...register('full_name')} placeholder={t('contacts.placeholders.fullName')} />
                {errors.full_name && (
                  <p className="text-xs text-destructive">{errors.full_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">{t('contacts.fields.nickname')}</Label>
                <Input id="nickname" {...register('nickname')} placeholder={t('contacts.placeholders.nickname')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('contacts.fields.phone')}</Label>
                <Input id="phone" {...register('phone')} placeholder={t('contacts.placeholders.phone')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">{t('contacts.fields.whatsapp')}</Label>
                <Input id="whatsapp" {...register('whatsapp')} placeholder={t('contacts.placeholders.whatsapp')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('contacts.fields.email')}</Label>
                <Input id="email" type="email" {...register('email')} placeholder={t('contacts.placeholders.email')} />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram">{t('contacts.fields.telegram')}</Label>
                <Input id="telegram" {...register('telegram')} placeholder={t('contacts.placeholders.telegram')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">{t('contacts.fields.instagram')}</Label>
                <Input id="instagram" {...register('instagram')} placeholder={t('contacts.placeholders.instagram')} />
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Detay */}
          <TabsContent value="detay" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t('contacts.fields.city')}</Label>
                <Input id="city" {...register('city')} placeholder={t('contacts.placeholders.city')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupation">{t('contacts.fields.occupation')}</Label>
                <Input id="occupation" {...register('occupation')} placeholder={t('contacts.placeholders.occupation')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship">{relationshipLabel}</Label>
                <Input id="relationship" {...register('relationship')} placeholder={relationshipPlaceholder} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday">{t('contacts.fields.birthday')}</Label>
                <Input id="birthday" type="date" {...register('birthday')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="children_count">{t('contacts.fields.children')}</Label>
                <Input id="children_count" type="number" min={0} {...register('children_count')} />
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Network Marketing */}
          <TabsContent value="nm" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isCustomerMode ? t('customers.form.fields.channel') : t('contacts.fields.source')}</Label>
                <Select
                  value={watch('source') ?? 'manual'}
                  onValueChange={(v) => setValue('source', v ?? 'manual')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {t(`contactSources.${watch('source') ?? 'manual'}`)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(SOURCE_LABELS).map((key) => (
                      <SelectItem key={key} value={key}>{t(`contactSources.${key}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!isCustomerMode ? (
                <>
                  <div className="space-y-2">
                    <Label>{t('contacts.fields.contactType')}</Label>
                    <Select
                      value={watch('contact_type') ?? 'prospect'}
                      onValueChange={(v) => setValue('contact_type', v ?? 'prospect')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {t(`contactTypes.${watch('contact_type') ?? 'prospect'}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(CONTACT_TYPE_LABELS).map((key) => (
                          <SelectItem key={key} value={key}>{t(`contactTypes.${key}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('contacts.fields.stage')}</Label>
                    <Select
                      value={watch('stage') ?? 'new'}
                      onValueChange={(v) => setValue('stage', v ?? 'new')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {t(`contactStages.${watch('stage') ?? 'new'}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(STAGE_LABELS).map((key) => (
                          <SelectItem key={key} value={key}>{t(`contactStages.${key}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="warmth_score">
                  {isCustomerMode
                    ? t('customers.form.fields.loyaltyScore', { score: watch('warmth_score') ?? 50 })
                    : t('contacts.fields.warmthScore', { score: watch('warmth_score') ?? 50 })}
                </Label>
                <input
                  type="range"
                  id="warmth_score"
                  min={0}
                  max={100}
                  step={5}
                  {...register('warmth_score')}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Notlar & Etiketler */}
          <TabsContent value="notlar" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="notes">{notesLabel}</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder={notesPlaceholder}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interests">{interestsLabel}</Label>
              <Input
                id="interests"
                {...register('interests')}
                placeholder={interestsPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goals">{goalsLabel}</Label>
              <Input
                id="goals"
                {...register('goals')}
                placeholder={goalsPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pain_points">{painPointsLabel}</Label>
              <Input
                id="pain_points"
                {...register('pain_points')}
                placeholder={painPointsPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('contacts.fields.tags')}</Label>
              <TagSelector
                allTags={allTags}
                selectedTagIds={selectedTagIds}
                onToggle={(tagId) =>
                  setSelectedTagIds((prev) =>
                    prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
                  )
                }
                onCreateTag={handleCreateTag}
                userId={userId}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(returnRoute)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-1.5">
            <Save className="w-4 h-4" />
            {isLoading ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
