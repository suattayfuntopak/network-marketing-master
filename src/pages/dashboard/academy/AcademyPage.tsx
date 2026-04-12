import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Star, Clock, Eye, BookOpen, GraduationCap, Shield, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useAcademyContents, useToggleAcademyFavorite, useIncrementContentView, useCreateAcademyContent } from '@/hooks/useAcademy'
import { ROUTES } from '@/lib/constants'
import { trackAcademyRead } from '@/lib/academy/progress'
import { isSystemAcademyId } from '@/lib/academy/systemContent'
import { useAuth } from '@/hooks/useAuth'
import type { ContentCategory, ContentType, ContentLevel, AcademyContentInsert } from '@/lib/academy/types'

const CATEGORIES: ContentCategory[] = [
  'mindset', 'prospecting', 'inviting', 'presenting',
  'closing', 'follow_up', 'team_building', 'leadership',
  'social_media', 'product_knowledge', 'company_info', 'compliance',
]

const TYPE_ICONS: Record<ContentType, typeof BookOpen> = {
  lesson: BookOpen,
  script: BookOpen,
  success_story: Star,
  video: Eye,
  article: BookOpen,
  cheat_sheet: Shield,
  role_play: GraduationCap,
}

const LEVELS: ContentLevel[] = ['beginner', 'intermediate', 'advanced']
const TYPES: ContentType[] = ['lesson', 'script', 'article', 'cheat_sheet', 'success_story', 'role_play', 'video']

interface CreateForm {
  title: string
  summary: string
  content: string
  tags: string
  category: ContentCategory
  level: ContentLevel
  type: ContentType
}

const EMPTY_FORM: CreateForm = {
  title: '',
  summary: '',
  content: '',
  tags: '',
  category: 'mindset',
  level: 'beginner',
  type: 'lesson',
}

const LEVEL_COLORS = {
  beginner: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
  intermediate: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
  advanced: 'text-red-600 bg-red-50 dark:bg-red-950',
}

export function AcademyPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ContentCategory | 'all'>('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM)
  const { data: allContents = [] } = useAcademyContents()

  const { data: contents = [], isLoading } = useAcademyContents({
    category: category === 'all' ? undefined : category,
    search: search.length >= 2 ? search : undefined,
    favoritesOnly,
  })

  const toggleFavorite = useToggleAcademyFavorite()
  const incrementView = useIncrementContentView()
  const createContent = useCreateAcademyContent()

  const statContents = useMemo(
    () => (favoritesOnly ? allContents.filter((item) => item.is_favorite) : allContents),
    [allContents, favoritesOnly]
  )

  const academyStats = useMemo(() => {
    const categoryCount = new Set(statContents.map((item) => item.category)).size
    const categoryCounts = CATEGORIES.reduce<Record<ContentCategory, number>>((acc, key) => {
      acc[key] = statContents.filter((item) => item.category === key).length
      return acc
    }, {} as Record<ContentCategory, number>)

    return {
      total: statContents.length,
      categoryCount,
      categoryCounts,
    }
  }, [statContents])

  const handleOpen = (id: string) => {
    if (!isSystemAcademyId(id)) {
      incrementView.mutate(id)
    }
    trackAcademyRead(id)
    navigate(`${ROUTES.ACADEMY}/${id}`)
  }

  const handleCreate = async () => {
    if (!user?.id || !form.title.trim() || saving) return

    setSaving(true)
    try {
      const payload: AcademyContentInsert = {
        user_id: user.id,
        title: form.title.trim(),
        summary: form.summary.trim() || null,
        content: form.content.trim() || null,
        tags: form.tags.split(',').map((item) => item.trim()).filter(Boolean),
        category: form.category,
        level: form.level,
        type: form.type,
      }

      await createContent.mutateAsync(payload)
      setShowCreate(false)
      setForm(EMPTY_FORM)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-4">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('academy.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('academy.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant={favoritesOnly ? 'default' : 'outline'}
            className="gap-1.5"
            onClick={() => setFavoritesOnly((current) => !current)}
          >
            <Star className={cn('w-4 h-4', favoritesOnly && 'fill-current')} />
            {t('academy.favoritesOnly')}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            {t('academy.new')}
          </Button>
          <button
            onClick={() => navigate(`${ROUTES.ACADEMY}/itirazlar`)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border hover:bg-muted transition-colors shrink-0"
          >
            <Shield className="w-4 h-4 text-primary" />
            {t('academy.objections')}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/12 bg-primary/5 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t('academy.overview.totalLabel')}
            </p>
            <p className="mt-3 text-2xl font-semibold">{academyStats.total}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('academy.overview.totalHint')}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t('academy.overview.categoriesLabel')}
            </p>
            <p className="mt-3 text-2xl font-semibold">{academyStats.categoryCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('academy.overview.categoriesHint')}</p>
          </div>
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
        <button
          onClick={() => setCategory('all')}
          className={cn(
            'text-xs px-3 py-1.5 rounded-full border transition-colors',
            category === 'all'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
          )}
          >
          {t('common.all')}
          <span className={cn(
            'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]',
            category === 'all' ? 'bg-black/20 text-white' : 'bg-background/70 text-foreground dark:text-white'
          )}>
            {academyStats.total}
          </span>
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full border transition-colors',
              category === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
            )}
            >
              {t(`academy.categories.${cat}`)}
            <span className={cn(
              'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]',
              category === cat ? 'bg-black/20 text-white' : 'bg-background/70 text-foreground dark:text-white'
            )}>
              {academyStats.categoryCounts[cat] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* İçerik grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
      ) : contents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">
            {search.length >= 2 || category !== 'all' ? t('academy.noResults') : t('academy.emptyTitle')}
          </p>
          <p className="text-sm mt-2">
            {search.length >= 2 || category !== 'all'
              ? t('academy.noResultsDescription')
              : t('academy.emptyDescription')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {contents.map((item) => {
            const Icon = TYPE_ICONS[item.type] ?? BookOpen
            const canToggleFavorite = true
            return (
              <div
                key={item.id}
                className="border rounded-lg bg-card hover:shadow-sm transition-shadow cursor-pointer group"
                onClick={() => handleOpen(item.id)}
              >
                <div className="p-4 space-y-3">
                  {/* Üst satır */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {t(`academy.categories.${item.category}`)}
                      </span>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        LEVEL_COLORS[item.level]
                      )}>
                        {t(`academy.${item.level}`)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!canToggleFavorite) return
                        toggleFavorite.mutate({ id: item.id, isFavorite: !item.is_favorite })
                      }}
                      className={cn(
                        'p-1 rounded transition-colors shrink-0',
                        canToggleFavorite
                          ? item.is_favorite
                            ? 'text-amber-500'
                            : 'text-muted-foreground/40 hover:text-amber-500'
                          : 'text-muted-foreground/25 cursor-default'
                      )}
                    >
                      <Star className={cn('w-3.5 h-3.5', item.is_favorite && 'fill-current')} />
                    </button>
                  </div>

                  {/* Başlık */}
                  <div className="flex items-start gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                  </div>

                  {/* Özet */}
                  {item.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>
                  )}

                  {/* Alt meta */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {t(`academy.types.${item.type}`)}
                    </span>
                    {item.reading_time_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t('academy.readingTime', { min: item.reading_time_minutes })}
                      </span>
                    )}
                    {item.view_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {item.view_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={(open) => !open && setShowCreate(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('academy.new')}</DialogTitle>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">{t('academy.fields.title')}</p>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{t('academy.fields.category')}</p>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ContentCategory })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{t(`academy.categories.${c}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{t('academy.fields.level')}</p>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value as ContentLevel })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>{t(`academy.${level}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{t('academy.fields.type')}</p>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as ContentType })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TYPES.map((type) => (
                    <option key={type} value={type}>{t(`academy.types.${type}`)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">{t('academy.fields.summary')}</p>
              <Textarea
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">{t('academy.fields.content')}</p>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={10}
                className="resize-y text-sm"
              />
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">{t('academy.fields.tags')}</p>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder={t('academy.placeholders.tags')}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!form.title.trim() || saving}>
                {saving ? t('common.saving') : t('common.save')}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
