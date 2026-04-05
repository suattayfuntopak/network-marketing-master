import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { useTags, useCreateTag } from '@/hooks/useTags'
import { useSetContactTags } from '@/hooks/useContact'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants'
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
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const { data: existingContact, isLoading: loadingContact } = useContact(id)
  const { data: allTags = [] } = useTags(userId)
  const createContact = useCreateContact()
  const updateContact = useUpdateContact(id ?? '')
  const setTags = useSetContactTags(id ?? 'new')
  const createTagMutation = useCreateTag()

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      source: 'manual',
      contact_type: 'prospect',
      stage: 'new',
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
        contact_type: c.contact_type,
        stage: c.stage,
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
      contact_type: (data.contact_type as NonNullable<typeof existingContact>['contact_type']) ?? 'prospect',
      stage: (data.stage as NonNullable<typeof existingContact>['stage']) ?? 'new',
      warmth_score: data.warmth_score ?? 50,
      notes: data.notes || null,
      interests: parseArray(data.interests),
      goals: parseArray(data.goals),
      pain_points: parseArray(data.pain_points),
    }

    try {
      if (isEdit && id) {
        await updateContact.mutateAsync(payload)
        await setTags.mutateAsync(selectedTagIds)
        toast.success('Kontak güncellendi')
        navigate(`${ROUTES.CONTACTS}/${id}`)
      } else {
        const newId = await createContact.mutateAsync(payload)
        // Set tags for new contact
        if (selectedTagIds.length > 0) {
          const setTagsForNew = (await import('@/lib/contacts/mutations')).setContactTags
          await setTagsForNew(newId, selectedTagIds)
        }
        toast.success('Kontak eklendi')
        navigate(`${ROUTES.CONTACTS}/${newId}`)
      }
    } catch (err) {
      toast.error('İşlem başarısız')
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
      <div className="p-6 text-center text-muted-foreground">Yükleniyor...</div>
    )
  }

  const isLoading = createContact.isPending || updateContact.isPending

  return (
    <div className="p-6 pb-20 lg:pb-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Kontak Düzenle' : 'Yeni Kontak'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="temel">
          <TabsList className="w-full">
            <TabsTrigger value="temel" className="flex-1">Temel</TabsTrigger>
            <TabsTrigger value="detay" className="flex-1">Detay</TabsTrigger>
            <TabsTrigger value="nm" className="flex-1">Network</TabsTrigger>
            <TabsTrigger value="notlar" className="flex-1">Notlar</TabsTrigger>
          </TabsList>

          {/* Tab 1: Temel */}
          <TabsContent value="temel" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="full_name">Ad Soyad *</Label>
                <Input id="full_name" {...register('full_name')} placeholder="Ahmet Yılmaz" />
                {errors.full_name && (
                  <p className="text-xs text-destructive">{errors.full_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">Takma Ad</Label>
                <Input id="nickname" {...register('nickname')} placeholder="Ahmet" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" {...register('phone')} placeholder="+90 555 123 4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" {...register('whatsapp')} placeholder="+90 555 123 4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="ahmet@email.com" />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram">Telegram</Label>
                <Input id="telegram" {...register('telegram')} placeholder="@username" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input id="instagram" {...register('instagram')} placeholder="@username" />
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Detay */}
          <TabsContent value="detay" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Şehir</Label>
                <Input id="city" {...register('city')} placeholder="İstanbul" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupation">Meslek</Label>
                <Input id="occupation" {...register('occupation')} placeholder="Mühendis" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship">İlişki Türü</Label>
                <Input id="relationship" {...register('relationship')} placeholder="arkadaş, akraba..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday">Doğum Günü</Label>
                <Input id="birthday" type="date" {...register('birthday')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="children_count">Çocuk Sayısı</Label>
                <Input id="children_count" type="number" min={0} {...register('children_count')} />
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Network Marketing */}
          <TabsContent value="nm" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kaynak</Label>
                <Select
                  value={watch('source') ?? 'manual'}
                  onValueChange={(v) => setValue('source', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kontak Türü</Label>
                <Select
                  value={watch('contact_type') ?? 'prospect'}
                  onValueChange={(v) => setValue('contact_type', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTACT_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Aşama</Label>
                <Select
                  value={watch('stage') ?? 'new'}
                  onValueChange={(v) => setValue('stage', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STAGE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="warmth_score">
                  Sıcaklık Skoru: {watch('warmth_score') ?? 50}
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
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Bu kontak hakkında notlarınız..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interests">İlgi Alanları</Label>
              <Input
                id="interests"
                {...register('interests')}
                placeholder="spor, sağlık, teknoloji (virgülle ayır)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goals">Hedefler</Label>
              <Input
                id="goals"
                {...register('goals')}
                placeholder="para, özgürlük, zaman (virgülle ayır)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pain_points">Sıkıntılar</Label>
              <Input
                id="pain_points"
                {...register('pain_points')}
                placeholder="zaman yok, para yok (virgülle ayır)"
              />
            </div>
            <div className="space-y-2">
              <Label>Etiketler</Label>
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
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            İptal
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-1.5">
            <Save className="w-4 h-4" />
            {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  )
}
