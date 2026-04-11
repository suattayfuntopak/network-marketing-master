import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Clock, Eye, Star, Pencil, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useAcademyContent, useToggleAcademyFavorite, useCreateAcademyContent, useUpdateAcademyContent } from '@/hooks/useAcademy'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants'
import { trackAcademyRead } from '@/lib/academy/progress'
import { isSystemAcademyId } from '@/lib/academy/systemContent'
import type { ContentCategory, ContentLevel, ContentType } from '@/lib/academy/types'

const LEVEL_COLORS = {
  beginner: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
  intermediate: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
  advanced: 'text-red-600 bg-red-50 dark:bg-red-950',
}

const CATEGORIES: ContentCategory[] = [
  'mindset', 'prospecting', 'inviting', 'presenting',
  'closing', 'follow_up', 'team_building', 'leadership',
  'social_media', 'product_knowledge', 'company_info', 'compliance',
]
const LEVELS: ContentLevel[] = ['beginner', 'intermediate', 'advanced']
const TYPES: ContentType[] = ['lesson', 'script', 'article', 'cheat_sheet', 'success_story', 'role_play', 'video']

interface EditForm {
  title: string
  summary: string
  content: string
  tags: string
  category: ContentCategory
  level: ContentLevel
  type: ContentType
}

export function AcademyContentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: content, isLoading } = useAcademyContent(id ?? '')
  const toggleFavorite = useToggleAcademyFavorite()
  const createContent = useCreateAcademyContent()
  const updateContent = useUpdateAcademyContent()

  const [showEdit, setShowEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<EditForm>({
    title: '', summary: '', content: '', tags: '',
    category: 'mindset', level: 'beginner', type: 'lesson',
  })

  useEffect(() => {
    if (content && showEdit) {
      setForm({
        title: content.title,
        summary: content.summary ?? '',
        content: content.content ?? '',
        tags: content.tags?.join(', ') ?? '',
        category: content.category,
        level: content.level,
        type: content.type,
      })
    }
  }, [content, showEdit])

  useEffect(() => {
    if (content?.id) {
      trackAcademyRead(content.id)
    }
  }, [content?.id])

  const isOwn = !!content && !content.is_system && content.user_id === user?.id
  const canToggleFavorite = !!content && !isSystemAcademyId(content.id)

  const handleSave = async () => {
    if (!form.title.trim() || loading || !user?.id) return
    setLoading(true)
    try {
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      if (isOwn && content) {
        // Direkt güncelle
        await updateContent.mutateAsync({
          id: content.id,
          data: {
            title: form.title,
            summary: form.summary || null,
            content: form.content || null,
            tags,
            category: form.category,
            level: form.level,
            type: form.type,
          },
        })
        setShowEdit(false)
      } else if (content) {
        // Sistem içeriği — kopyasını oluştur ve yeni sayfaya git
        await createContent.mutateAsync({
          user_id: user.id,
          title: form.title,
          summary: form.summary || null,
          content: form.content || null,
          tags,
          category: form.category,
          level: form.level,
          type: form.type,
        })
        setShowEdit(false)
        navigate(ROUTES.ACADEMY)
      }
    } catch (err) {
      console.error('[AcademyContentDetailPage] save error:', err)
    } finally {
      setLoading(false)
    }
  }

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
    <div className="p-6 pb-20 lg:pb-6">
      <div className="mx-auto max-w-6xl space-y-6">
      {/* Geri + aksiyonlar */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.ACADEMY)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t('academy.title')}
        </Button>
        <div className="flex-1" />
        {isOwn ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowEdit(true)}>
            <Pencil className="w-3.5 h-3.5" />
            {t('common.edit')}
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowEdit(true)}>
            <Copy className="w-3.5 h-3.5" />
            {t('academy.copyAndEdit')}
          </Button>
        )}
      </div>

      {/* Meta */}
      <div className="max-w-5xl rounded-[28px] border border-border/70 bg-card/55 p-6 md:p-8 lg:p-10">
        <div className="space-y-4">
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
          {content.is_system && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{t('academy.systemLabel')}</span>
          )}
        </div>

        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold leading-tight text-balance">{content.title}</h1>
          <button
            onClick={() => {
              if (!canToggleFavorite) return
              toggleFavorite.mutate({ id: content.id, isFavorite: !content.is_favorite })
            }}
            className={cn(
              'p-2 rounded-lg transition-colors shrink-0',
              canToggleFavorite
                ? content.is_favorite
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950'
                  : 'text-muted-foreground hover:text-amber-500 hover:bg-muted'
                : 'text-muted-foreground/30'
            )}
          >
            <Star className={cn('w-5 h-5', content.is_favorite && 'fill-current')} />
          </button>
        </div>

        {content.summary && (
          <p className="max-w-4xl text-base leading-8 text-justify text-muted-foreground">{content.summary}</p>
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
      </div>

      {/* Video */}
      {content.video_url && (
        <div className="aspect-video max-w-5xl rounded-[24px] overflow-hidden border border-border/70 bg-card">
          <iframe
            src={content.video_url}
            className="w-full h-full"
            allowFullScreen
            title={content.title}
          />
        </div>
      )}

      {/* İçerik */}
      {content.content && (
        <div className="max-w-5xl rounded-[28px] border border-border/70 bg-card/45 p-6 md:p-8 lg:p-10">
          <div className="space-y-2">
          {content.content.split('\n').map((line, i) => {
            if (line.startsWith('## ')) return <h2 key={i} className="pt-4 text-2xl font-bold tracking-tight">{line.slice(3)}</h2>
            if (line.startsWith('### ')) return <h3 key={i} className="pt-2 text-lg font-semibold">{line.slice(4)}</h3>
            if (line.startsWith('- ')) {
              return (
                <div key={i} className="grid grid-cols-[auto_1fr] gap-3 text-[15px] leading-8 text-justify">
                  <span className="mt-1 text-primary">•</span>
                  <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
              )
            }
            if (line.startsWith('❌ ') || line.startsWith('✅ ')) return <p key={i} className="text-[15px] leading-8 text-justify">{line}</p>
            if (line.startsWith('---')) return <hr key={i} className="my-5 border-border/70" />
            if (line === '') return <div key={i} className="h-3" />
            return (
              <p key={i} className="text-[15px] leading-8 text-justify text-foreground/95"
                dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            )
          })}
          </div>
        </div>
      )}

      {/* Etiketler */}
      {content.tags && content.tags.length > 0 && (
        <div className="max-w-5xl rounded-[24px] border border-border/70 bg-card/35 p-5">
          <div className="flex flex-wrap gap-2">
          {content.tags.map((tag) => (
            <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              #{tag}
            </span>
          ))}
          </div>
        </div>
      )}

      {/* Edit / Copy modal */}
      <Dialog open={showEdit} onOpenChange={(v) => !v && setShowEdit(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isOwn ? t('common.edit') : t('academy.copyAndEdit')}
            </DialogTitle>
            {!isOwn && (
              <p className="text-sm text-muted-foreground">{t('academy.copyDescription')}</p>
            )}
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('academy.fields.title')}</p>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{t('academy.fields.category')}</p>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ContentCategory })}
                  className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{t(`academy.categories.${c}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{t('academy.fields.level')}</p>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value as ContentLevel })}
                  className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {LEVELS.map((l) => <option key={l} value={l}>{t(`academy.${l}`)}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{t('academy.fields.type')}</p>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as ContentType })}
                  className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TYPES.map((tp) => <option key={tp} value={tp}>{t(`academy.types.${tp}`)}</option>)}
                </select>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('academy.fields.summary')}</p>
              <Textarea
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('academy.fields.content')}</p>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={10}
                className="resize-y text-sm font-mono"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('academy.fields.tags')}</p>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder={t('academy.placeholders.tags')}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!form.title.trim() || loading}>
                {loading ? t('common.saving') : t('common.save')}
              </Button>
              <Button variant="ghost" onClick={() => setShowEdit(false)}>{t('common.cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
