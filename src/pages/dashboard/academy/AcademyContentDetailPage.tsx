import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Clock, Eye, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAcademyContent, useToggleAcademyFavorite } from '@/hooks/useAcademy'
import { ROUTES } from '@/lib/constants'

const LEVEL_COLORS = {
  beginner: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
  intermediate: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
  advanced: 'text-red-600 bg-red-50 dark:bg-red-950',
}

export function AcademyContentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: content, isLoading } = useAcademyContent(id ?? '')
  const toggleFavorite = useToggleAcademyFavorite()

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">{t('common.loading')}</div>
  }

  if (!content) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{t('academy.noResults')}</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate(ROUTES.ACADEMY)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Geri */}
      <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.ACADEMY)} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        {t('academy.title')}
      </Button>

      {/* Meta */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
            {t(`academy.categories.${content.category}`)}
          </span>
          <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', LEVEL_COLORS[content.level])}>
            {t(`academy.${content.level}`)}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            {t(`academy.types.${content.type}`)}
          </span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold leading-tight">{content.title}</h1>
          <button
            onClick={() => toggleFavorite.mutate({ id: content.id, isFavorite: !content.is_favorite })}
            className={cn(
              'p-2 rounded-lg transition-colors shrink-0',
              content.is_favorite
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950'
                : 'text-muted-foreground hover:text-amber-500 hover:bg-muted'
            )}
          >
            <Star className={cn('w-5 h-5', content.is_favorite && 'fill-current')} />
          </button>
        </div>

        {content.summary && (
          <p className="text-muted-foreground text-sm leading-relaxed">{content.summary}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {content.reading_time_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t('academy.readingTime', { min: content.reading_time_minutes })}
            </span>
          )}
          {content.view_count > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {t('academy.viewCount', { count: content.view_count })}
            </span>
          )}
        </div>
      </div>

      {/* Video */}
      {content.video_url && (
        <div className="aspect-video rounded-lg overflow-hidden border">
          <iframe
            src={content.video_url}
            className="w-full h-full"
            allowFullScreen
            title={content.title}
          />
        </div>
      )}

      {/* İçerik — markdown benzeri render */}
      {content.content && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {content.content.split('\n').map((line, i) => {
            if (line.startsWith('## ')) {
              return <h2 key={i} className="text-lg font-bold mt-6 mb-3">{line.slice(3)}</h2>
            }
            if (line.startsWith('### ')) {
              return <h3 key={i} className="text-base font-semibold mt-4 mb-2">{line.slice(4)}</h3>
            }
            if (line.startsWith('**') && line.endsWith('**')) {
              return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>
            }
            if (line.startsWith('- ')) {
              return (
                <div key={i} className="flex gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
              )
            }
            if (line.startsWith('❌ ') || line.startsWith('✅ ')) {
              return <p key={i} className="text-sm">{line}</p>
            }
            if (line.startsWith('---')) {
              return <hr key={i} className="my-4" />
            }
            if (line === '') {
              return <div key={i} className="h-2" />
            }
            return (
              <p
                key={i}
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
              />
            )
          })}
        </div>
      )}

      {/* Etiketler */}
      {content.tags && content.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t">
          {content.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
