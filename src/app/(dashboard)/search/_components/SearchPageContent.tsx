'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Users, BookOpen, ChevronRight, CornerDownRight, ArrowLeft, MessageCircleQuestion } from 'lucide-react'
import { useCandidates } from '@/hooks/useCandidates'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { getTrainingData } from '@/lib/domain/trainingData'
import { STAGE_COLOR } from '@/lib/domain/stages'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { ITIRAZLAR } from '../../itirazlar/data/itirazlar'
import { pickBilingual } from '@/lib/utils/pickLang'

export function SearchPageContent() {
  const { lang, t } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''

  const { data: ws } = useWorkspace()
  const { candidates, isLoading: candidatesLoading } = useCandidates(ws?.workspaceId)

  const [searchInput, setSearchInput] = useState(query)
  const trainingData = getTrainingData(lang)

  useEffect(() => {
    setSearchInput(query)
  }, [query])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`)
    }
  }

  const filteredCandidates = query.trim()
    ? candidates.filter(c => {
        const term = query.toLowerCase()
        return (
          c.full_name?.toLowerCase().includes(term) ||
          c.note?.toLowerCase().includes(term) ||
          c.phone?.toLowerCase().includes(term)
        )
      })
    : []

  const filteredTraining = query.trim()
    ? trainingData.flatMap(cat => cat.konular.map(k => ({ ...k, categoryTitle: cat.baslik })))
        .filter(topic => {
          const term = query.toLowerCase()
          return (
            topic.baslik?.toLowerCase().includes(term) ||
            topic.ozet?.toLowerCase().includes(term) ||
            topic.maddeler?.some(m => m.toLowerCase().includes(term))
          )
        })
    : []

  const filteredObjections = query.trim()
    ? ITIRAZLAR.filter(i => {
        const term = query.toLowerCase()
        const question = pickBilingual(i.soru, lang)
        const answer = pickBilingual(i.cevap, lang)
        const category = pickBilingual(i.kategori, lang)
        return (
          question.toLowerCase().includes(term) ||
          answer.toLowerCase().includes(term) ||
          category.toLowerCase().includes(term)
        )
      })
    : []

  const totalResults = filteredCandidates.length + filteredTraining.length + filteredObjections.length

  return (
    <main className="min-h-screen w-full space-y-6 bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-2)] transition-colors hover:bg-[var(--bg-subtle)]"
          aria-label={t('pipeline.back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">{t('common.searchResults')}</h1>
          <p className="text-xs text-[var(--text-3)]">
            {query ? `${totalResults} ${t('common.searchNoResults').replace('Sonuç bulunamadı.', 'sonuç bulundu')}` : t('common.searchEnterQuery')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('common.searchPlaceholder')}
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] pl-10 pr-4 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE] dark:focus:ring-[#534AB7]/10"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-[#534AB7] px-6 text-sm font-semibold text-white shadow-md transition hover:bg-[#453DA0] active:scale-95"
        >
          {t('common.search')}
        </button>
      </form>

      <div className="space-y-6 pt-2">
        {filteredCandidates.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">
              <Users className="h-4 w-4" />
              {t('common.searchCandidates')} ({filteredCandidates.length})
            </h2>
            <div className="grid gap-2.5">
              {filteredCandidates.map(c => {
                const parsed = resolveCandidateFields(c)
                return (
                  <Link
                    key={c.id}
                    href={`/pipeline/${c.id}`}
                    className="group flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all hover:border-[#534AB7]/30 hover:shadow-md"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <PersonAvatar
                        name={c.full_name ?? '?'}
                        imageUrl={parsed.avatarUrl}
                        size="sm"
                        className="h-9 w-9 text-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-[var(--text-1)] transition-colors group-hover:text-[#534AB7]">
                          {c.full_name}
                        </h3>
                        <div className="mt-0.5 flex min-w-0 flex-wrap gap-x-2 gap-y-0.5 text-xs text-[var(--text-3)]">
                          {c.phone && <span>{c.phone}</span>}
                          {c.note && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="block max-w-[200px] truncate sm:max-w-[400px]">
                                {lang === 'en' ? (parsed.noteEn || parsed.noteTr) : parsed.noteTr}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STAGE_COLOR[c.stage]}`}>
                        {t(`stages.${c.stage}`)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[var(--text-3)] transition-colors group-hover:text-[var(--text-2)]" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {filteredTraining.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">
              <BookOpen className="h-4 w-4" />
              {t('common.searchTraining')} ({filteredTraining.length})
            </h2>
            <div className="grid gap-2.5">
              {filteredTraining.map(topic => (
                <Link
                  key={topic.id}
                  id={`konu-${topic.id}`}
                  href={`/egitim?id=${topic.id}`}
                  className="group flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all hover:border-[#3730A3]/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 text-lg leading-none">{topic.emoji}</span>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#3730A3] dark:text-[#a5b4fc]">
                          {topic.categoryTitle}
                        </span>
                        <h3 className="mt-0.5 text-sm font-semibold text-[var(--text-1)] transition-colors group-hover:text-[#3730A3] dark:group-hover:text-[#a5b4fc]">
                          {topic.baslik}
                        </h3>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-[var(--text-2)] dark:bg-slate-800">
                      {topic.sure}
                    </span>
                  </div>
                  <p className="line-clamp-2 pl-8 text-xs text-[var(--text-2)]">{topic.ozet}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {filteredObjections.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">
              <MessageCircleQuestion className="h-4 w-4 text-[#9B1D47]" />
              {t('pagesUi.objectionsAndAnswers')} ({filteredObjections.length})
            </h2>
            <div className="grid gap-2.5">
              {filteredObjections.map(objection => {
                const question = pickBilingual(objection.soru, lang)
                const answer = pickBilingual(objection.cevap, lang)
                const category = pickBilingual(objection.kategori, lang)
                return (
                  <Link
                    key={objection.id}
                    href={`/egitim?tab=objections&id=${objection.id}`}
                    className="group flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all hover:border-[#9B1D47]/30 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 text-lg leading-none">{objection.emoji}</span>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9B1D47] dark:text-[#fda4af]">
                          {category}
                        </span>
                        <h3 className="mt-0.5 text-sm font-semibold text-[var(--text-1)] transition-colors group-hover:text-[#9B1D47] dark:group-hover:text-[#fda4af]">
                          &quot;{question}&quot;
                        </h3>
                      </div>
                    </div>
                    <p className="line-clamp-2 pl-8 text-xs text-[var(--text-2)]">{answer}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {!candidatesLoading && query && totalResults === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] py-16 text-center">
            <Search className="h-10 w-10 text-[var(--text-3)]" />
            <div>
              <p className="text-sm font-bold text-[var(--text-1)]">{t('common.searchNoResults')}</p>
              <p className="mt-0.5 text-xs text-[var(--text-3)]">
                {t('common.searchNoResultsDesc').replace('{query}', query)}
              </p>
            </div>
          </div>
        )}

        {candidatesLoading && (
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        )}
      </div>
    </main>
  )
}
