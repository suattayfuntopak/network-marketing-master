import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Star, Clock, Eye, BookOpen, GraduationCap, Shield } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAcademyContents, useToggleAcademyFavorite, useIncrementContentView } from '@/hooks/useAcademy'
import { ROUTES } from '@/lib/constants'
import type { ContentCategory, ContentType } from '@/lib/academy/types'

const CATEGORIES: ContentCategory[] = [
  'mindset', 'prospecting', 'inviting', 'presenting',
  'closing', 'follow_up', 'team_building', 'leadership',
  'social_media', 'compliance',
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

const LEVEL_COLORS = {
  beginner: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
  intermediate: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
  advanced: 'text-red-600 bg-red-50 dark:bg-red-950',
}

export function AcademyPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ContentCategory | 'all'>('all')

  const { data: contents = [], isLoading } = useAcademyContents({
    category: category === 'all' ? undefined : category,
    search: search.length >= 2 ? search : undefined,
  })

  const toggleFavorite = useToggleAcademyFavorite()
  const incrementView = useIncrementContentView()

  const handleOpen = (id: string) => {
    incrementView.mutate(id)
    navigate(`${ROUTES.ACADEMY}/${id}`)
  }

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-4">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('academy.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Distribütörlük yolculuğunda ihtiyacın olan her şey
          </p>
        </div>
        <button
          onClick={() => navigate(`${ROUTES.ACADEMY}/itirazlar`)}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border hover:bg-muted transition-colors shrink-0"
        >
          <Shield className="w-4 h-4 text-primary" />
          {t('academy.objections')}
        </button>
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
          </button>
        ))}
      </div>

      {/* İçerik grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
      ) : contents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>{t('academy.noResults')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {contents.map((item) => {
            const Icon = TYPE_ICONS[item.type] ?? BookOpen
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
                        toggleFavorite.mutate({ id: item.id, isFavorite: !item.is_favorite })
                      }}
                      className={cn(
                        'p-1 rounded transition-colors shrink-0',
                        item.is_favorite ? 'text-amber-500' : 'text-muted-foreground/40 hover:text-amber-500'
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
    </div>
  )
}
