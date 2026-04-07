import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Copy, Check, ChevronDown, ChevronUp, Star, MessageSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useObjections, useToggleObjectionFavorite, useIncrementObjectionUseCount } from '@/hooks/useObjections'
import type { ObjectionCategory } from '@/lib/academy/types'

const CATEGORIES: { value: ObjectionCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'money', label: '' },
  { value: 'time', label: '' },
  { value: 'pyramid', label: '' },
  { value: 'trust', label: '' },
  { value: 'family', label: '' },
  { value: 'fear', label: '' },
  { value: 'experience', label: '' },
  { value: 'product', label: '' },
  { value: 'company', label: '' },
  { value: 'no_network', label: '' },
  { value: 'introvert', label: '' },
  { value: 'employed', label: '' },
  { value: 'wait', label: '' },
  { value: 'other', label: '' },
]

export function ObjectionsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ObjectionCategory | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedShortId, setCopiedShortId] = useState<string | null>(null)

  const { data: objections = [], isLoading } = useObjections({
    category: category === 'all' ? undefined : category,
    search: search.length >= 2 ? search : undefined,
  })

  const toggleFavorite = useToggleObjectionFavorite()
  const incrementUse = useIncrementObjectionUseCount()

  const handleCopy = async (id: string, text: string, short = false) => {
    await navigator.clipboard.writeText(text)
    if (short) {
      setCopiedShortId(id)
      setTimeout(() => setCopiedShortId(null), 2000)
    } else {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
    incrementUse.mutate(id)
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold">{t('academy.objections')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          En yaygın itirazlara hazır, etkili cevaplar
        </p>
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
          <p>{t('academy.noResults')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {objections.map((obj) => {
            const isExpanded = expandedId === obj.id
            return (
              <div
                key={obj.id}
                className="border rounded-lg bg-card overflow-hidden"
              >
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
                        <span className="text-xs text-muted-foreground">Sistem</span>
                      )}
                    </div>
                    <p className="font-medium text-sm">{obj.objection_text}</p>
                    {!isExpanded && obj.response_short && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {obj.response_short}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite.mutate({ id: obj.id, isFavorite: !obj.is_favorite })
                      }}
                      className={cn(
                        'p-1.5 rounded transition-colors',
                        obj.is_favorite ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'
                      )}
                    >
                      <Star className={cn('w-4 h-4', obj.is_favorite && 'fill-current')} />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Genişletilmiş içerik */}
                {isExpanded && (
                  <div className="border-t px-4 py-4 space-y-4 bg-muted/10">
                    {/* Yaklaşım */}
                    {obj.approach && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          {t('academy.objection.approach')}
                        </p>
                        <p className="text-sm text-primary font-medium">{obj.approach}</p>
                      </div>
                    )}

                    {/* Kısa cevap */}
                    {obj.response_short && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          {t('academy.objection.shortResponse')}
                        </p>
                        <p className="text-sm bg-card border rounded-md p-3">{obj.response_short}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 h-7 text-xs gap-1"
                          onClick={() => handleCopy(obj.id + '-short', obj.response_short!, true)}
                        >
                          {copiedShortId === obj.id + '-short' ? (
                            <><Check className="w-3 h-3" /> Kopyalandı</>
                          ) : (
                            <><Copy className="w-3 h-3" /> {t('academy.objection.copyResponseShort')}</>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Tam cevap */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        {t('academy.objection.fullResponse')}
                      </p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed bg-card border rounded-md p-3">
                        {obj.response_text}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-7 text-xs gap-1"
                        onClick={() => handleCopy(obj.id, obj.response_text)}
                      >
                        {copiedId === obj.id ? (
                          <><Check className="w-3 h-3" /> Kopyalandı</>
                        ) : (
                          <><Copy className="w-3 h-3" /> {t('academy.objection.copyResponse')}</>
                        )}
                      </Button>
                    </div>

                    {/* Örnek diyalog */}
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
    </div>
  )
}
