import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Copy, Check, ChevronDown, ChevronUp, Star, MessageSquare, Pencil, Plus, Shield, ArrowRight, Brain } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useObjections, useToggleObjectionFavorite, useIncrementObjectionUseCount, useCreateObjection, useUpdateObjection } from '@/hooks/useObjections'
import { useAuth } from '@/hooks/useAuth'
import type { Objection, ObjectionCategory } from '@/lib/academy/types'

const CATEGORIES: { value: ObjectionCategory | 'all' }[] = [
  { value: 'all' },
  { value: 'money' }, { value: 'time' }, { value: 'pyramid' }, { value: 'trust' },
  { value: 'family' }, { value: 'fear' }, { value: 'experience' }, { value: 'product' },
  { value: 'company' }, { value: 'no_network' }, { value: 'introvert' },
  { value: 'employed' }, { value: 'wait' }, { value: 'other' },
]

const OBJ_CATEGORIES: ObjectionCategory[] = [
  'money', 'time', 'trust', 'family', 'fear', 'experience',
  'product', 'company', 'pyramid', 'no_network', 'introvert', 'employed', 'wait', 'other',
]

interface EditForm {
  objection_text: string
  response_text: string
  response_short: string
  approach: string
  example_dialog: string
  category: ObjectionCategory
}

const EMPTY_FORM: EditForm = {
  objection_text: '', response_text: '', response_short: '',
  approach: '', example_dialog: '', category: 'other',
}

export function ObjectionsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ObjectionCategory | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedShortId, setCopiedShortId] = useState<string | null>(null)

  // Edit modal state
  const [editTarget, setEditTarget] = useState<Objection | null>(null) // null = yeni
  const [isCopyMode, setIsCopyMode] = useState(false) // sistem itirazı kopyası
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<EditForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const { data: objections = [], isLoading } = useObjections({
    category: category === 'all' ? undefined : category,
    search: search.length >= 2 ? search : undefined,
  })

  const toggleFavorite = useToggleObjectionFavorite()
  const incrementUse = useIncrementObjectionUseCount()
  const createObjection = useCreateObjection()
  const updateObjection = useUpdateObjection()

  const psychologyCards = [
    { key: 'validate', Icon: Brain },
    { key: 'depressure', Icon: Shield },
    { key: 'microStep', Icon: ArrowRight },
  ] as const

  const quickScenarios = [
    { key: 'money', category: 'money' as const },
    { key: 'trust', category: 'trust' as const },
    { key: 'wait', category: 'wait' as const },
    { key: 'time', category: 'time' as const },
  ] as const

  const handleCopy = async (id: string, text: string, short = false) => {
    await navigator.clipboard.writeText(text)
    if (short) { setCopiedShortId(id); setTimeout(() => setCopiedShortId(null), 2000) }
    else { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000) }
    incrementUse.mutate(id)
  }

  const openEdit = (obj: Objection) => {
    const isOwn = !obj.is_system && obj.user_id === user?.id
    setEditTarget(obj)
    setIsCopyMode(!isOwn)
    setForm({
      objection_text: obj.objection_text,
      response_text: obj.response_text,
      response_short: obj.response_short ?? '',
      approach: obj.approach ?? '',
      example_dialog: obj.example_dialog ?? '',
      category: obj.category,
    })
    setShowModal(true)
  }

  const openNew = () => {
    setEditTarget(null)
    setIsCopyMode(false)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.objection_text.trim() || !form.response_text.trim() || saving || !user?.id) return
    setSaving(true)
    try {
      const payload = {
        objection_text: form.objection_text,
        response_text: form.response_text,
        response_short: form.response_short || null,
        approach: form.approach || null,
        example_dialog: form.example_dialog || null,
        category: form.category,
      }

      if (editTarget && !isCopyMode) {
        // Kendi itirazını güncelle
        await updateObjection.mutateAsync({ id: editTarget.id, data: payload })
      } else {
        // Yeni veya kopyadan oluştur
        await createObjection.mutateAsync({ user_id: user.id, ...payload })
      }
      setShowModal(false)
    } catch (err) {
      console.error('[ObjectionsPage] save error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-4">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('academy.objections')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('academy.objection.subtitle')}</p>
        </div>
        <Button size="sm" variant="outline" onClick={openNew} className="gap-1.5 shrink-0">
          <Plus className="w-4 h-4" />
          {t('academy.objection.new')}
        </Button>
      </div>

      <div className="rounded-2xl border border-primary/15 bg-primary/6 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
          {t('academy.objection.psychology.label')}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('academy.objection.psychology.summary')}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {psychologyCards.map(({ key, Icon }) => (
            <div key={key} className="rounded-2xl border border-border/70 bg-card/65 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-4 text-sm font-semibold">{t(`academy.objection.psychology.cards.${key}.title`)}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t(`academy.objection.psychology.cards.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t('academy.objection.quickScenarios.label')}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t('academy.objection.quickScenarios.subtitle')}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {quickScenarios.map(({ key, category: scenarioCategory }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setSearch('')
                setCategory(scenarioCategory)
                setExpandedId(null)
              }}
              className="rounded-2xl border border-border/70 bg-background/70 p-4 text-left transition-all hover:border-primary/25 hover:bg-muted/20"
            >
              <p className="text-sm font-semibold">
                {t(`academy.objection.quickScenarios.items.${key}.title`)}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t(`academy.objection.quickScenarios.items.${key}.body`)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Arama */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('academy.searchPlaceholder')}
          className="pl-9"
        />
      </div>

      {/* Kategori filtreleri */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map(({ value }) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full border transition-colors',
              category === value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
            )}
          >
            {value === 'all' ? t('common.all') : t(`academy.objection.objCategories.${value}`)}
          </button>
        ))}
      </div>

      {/* İtiraz listesi */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
      ) : objections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">
            {search.length >= 2 || category !== 'all' ? t('academy.noResults') : t('academy.objection.emptyTitle')}
          </p>
          <p className="text-sm mt-2">
            {search.length >= 2 || category !== 'all'
              ? t('academy.noResultsDescription')
              : t('academy.objection.emptyDescription')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {objections.map((obj) => {
            const isExpanded = expandedId === obj.id
            const isOwn = !obj.is_system && obj.user_id === user?.id
            return (
              <div key={obj.id} className="border rounded-lg bg-card overflow-hidden">
                {/* Kart başlığı */}
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : obj.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {t(`academy.objection.objCategories.${obj.category}`)}
                      </span>
                      {obj.is_system && (
                        <span className="text-xs text-muted-foreground">{t('academy.systemLabel')}</span>
                      )}
                    </div>
                    <p className="font-medium text-sm">{obj.objection_text}</p>
                    {!isExpanded && obj.response_short && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{obj.response_short}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Düzenle / Kopyala & Düzenle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(obj) }}
                      title={isOwn ? t('common.edit') : t('academy.copyAndEdit')}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isOwn ? <Pencil className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite.mutate({ id: obj.id, isFavorite: !obj.is_favorite }) }}
                      className={cn('p-1.5 rounded transition-colors', obj.is_favorite ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500')}
                    >
                      <Star className={cn('w-4 h-4', obj.is_favorite && 'fill-current')} />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Genişletilmiş içerik */}
                {isExpanded && (
                  <div className="border-t px-4 py-4 space-y-4 bg-muted/10">
                    {obj.approach && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          {t('academy.objection.approach')}
                        </p>
                        <p className="text-sm text-primary font-medium">{obj.approach}</p>
                      </div>
                    )}

                    {obj.response_short && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          {t('academy.objection.shortResponse')}
                        </p>
                        <p className="text-sm bg-card border rounded-md p-3">{obj.response_short}</p>
                        <Button size="sm" variant="outline" className="mt-2 h-7 text-xs gap-1"
                          onClick={() => handleCopy(obj.id + '-short', obj.response_short!, true)}>
                          {copiedShortId === obj.id + '-short'
                            ? <><Check className="w-3 h-3" /> {t('messages.ai.copied')}</>
                            : <><Copy className="w-3 h-3" /> {t('academy.objection.copyResponseShort')}</>}
                        </Button>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        {t('academy.objection.fullResponse')}
                      </p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed bg-card border rounded-md p-3">
                        {obj.response_text}
                      </p>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs gap-1"
                        onClick={() => handleCopy(obj.id, obj.response_text)}>
                        {copiedId === obj.id
                          ? <><Check className="w-3 h-3" /> {t('messages.ai.copied')}</>
                          : <><Copy className="w-3 h-3" /> {t('academy.objection.copyResponse')}</>}
                      </Button>
                    </div>

                    {obj.example_dialog && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          {t('academy.objection.seeExample')}
                        </p>
                        <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed bg-muted/50 rounded-md p-3 border">
                          {obj.example_dialog}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Edit / New / Copy modal */}
      <Dialog open={showModal} onOpenChange={(v) => !v && setShowModal(false)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget && !isCopyMode
                ? t('common.edit')
                : isCopyMode
                  ? t('academy.copyAndEdit')
                  : t('academy.objection.new')}
            </DialogTitle>
            {isCopyMode && (
              <p className="text-sm text-muted-foreground">{t('academy.copyDescription')}</p>
            )}
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Kategori */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('academy.fields.category')}</p>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ObjectionCategory })}
                className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {OBJ_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(`academy.objection.objCategories.${c}`)}</option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('academy.objection.fields.text')}</p>
              <Textarea
                value={form.objection_text}
                onChange={(e) => setForm({ ...form, objection_text: e.target.value })}
                placeholder={t('academy.objection.placeholders.text')}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('academy.objection.approach')}</p>
              <Input
                value={form.approach}
                onChange={(e) => setForm({ ...form, approach: e.target.value })}
                placeholder={t('academy.objection.placeholders.approach')}
              />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('academy.objection.shortResponse')}</p>
              <Textarea
                value={form.response_short}
                onChange={(e) => setForm({ ...form, response_short: e.target.value })}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('academy.objection.fullResponse')}</p>
              <Textarea
                value={form.response_text}
                onChange={(e) => setForm({ ...form, response_text: e.target.value })}
                rows={5}
                className="resize-y text-sm"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('academy.objection.fields.exampleDialog')}</p>
              <Textarea
                value={form.example_dialog}
                onChange={(e) => setForm({ ...form, example_dialog: e.target.value })}
                placeholder={t('academy.objection.placeholders.exampleDialog')}
                rows={4}
                className="resize-y text-sm font-mono"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!form.objection_text.trim() || !form.response_text.trim() || saving}
              >
                {saving ? t('common.saving') : t('common.save')}
              </Button>
              <Button variant="ghost" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
