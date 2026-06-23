'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, PlayCircle, Shield, CheckCircle2, Circle, Loader2, ChevronRight, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import { getTrainingData } from '@/lib/domain/trainingData'
import { TRAINING_VIDEOS } from '@/lib/domain/trainingVideos'
import { ITIRAZLAR } from '@/app/(dashboard)/itirazlar/data/itirazlar'
import { getMemberTrainingDetailAction } from '../actions'

type MemberTrainingDetailProps = {
  workspaceId: string
  targetUserId: string
}

type SubTab = 'videos' | 'library' | 'objections'

export function MemberTrainingDetail({ workspaceId, targetUserId }: MemberTrainingDetailProps) {
  const { t, lang } = useTranslation()
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('library')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['member-training-detail', workspaceId, targetUserId],
    queryFn: () => getMemberTrainingDetailAction(workspaceId, targetUserId),
    enabled: !!workspaceId && !!targetUserId,
    staleTime: 15000,
  })

  const trainingData = getTrainingData(lang)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
        <p className="text-xs text-[var(--text-3)] font-semibold">{t('common.loading')}</p>
      </div>
    )
  }

  const { readTrainings = [], readObjections = [], videoProgress = {} } = data || {}

  // Calculate percentages
  const totalVideos = TRAINING_VIDEOS.length
  const completedVideos = TRAINING_VIDEOS.filter(v => videoProgress[v.key]?.status === 'completed').length
  const videoPct = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0

  const allTopics = trainingData.flatMap(cat => cat.konular)
  const totalTopics = allTopics.length
  const readTopicsCount = allTopics.filter(topic => readTrainings.includes(topic.id)).length
  const libraryPct = totalTopics > 0 ? Math.round((readTopicsCount / totalTopics) * 100) : 0

  const totalObjections = ITIRAZLAR.length
  const readObjectionsCount = ITIRAZLAR.filter(obj => readObjections.includes(obj.id)).length
  const objectionPct = totalObjections > 0 ? Math.round((readObjectionsCount / totalObjections) * 100) : 0

  const stats = [
    {
      id: 'library' as const,
      label: t('team.colContentLibrary') || 'Kütüphane',
      value: libraryPct,
      countLabel: `${readTopicsCount}/${totalTopics}`,
      icon: BookOpen,
      colorClass: 'text-brand bg-brand-subtle border-brand/10',
      activeColorClass: 'ring-brand/40 bg-brand/[0.04]',
    },
    {
      id: 'videos' as const,
      label: t('team.colVideoTraining') || 'Video Eğitimler',
      value: videoPct,
      countLabel: `${completedVideos}/${totalVideos}`,
      icon: PlayCircle,
      colorClass: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 border-teal-200/20',
      activeColorClass: 'ring-teal-500/40 bg-teal-500/[0.04]',
    },
    {
      id: 'objections' as const,
      label: t('team.colObjectionBank') || 'İtiraz Bankası',
      value: objectionPct,
      countLabel: `${readObjectionsCount}/${totalObjections}`,
      icon: Shield,
      colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200/20',
      activeColorClass: 'ring-amber-500/40 bg-amber-500/[0.04]',
    },
  ]

  return (
    <div className="space-y-5">
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {stats.map(s => {
          const isActive = activeSubTab === s.id
          const Icon = s.icon
          return (
            <button
              key={s.id}
              onClick={() => setActiveSubTab(s.id)}
              className={clsx(
                'flex flex-col items-start rounded-2xl border p-3 text-left transition-all relative overflow-hidden',
                isActive
                  ? 'border-brand bg-[var(--bg-card)] shadow-md ring-2 ring-brand/20'
                  : 'border-[var(--border)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-card)]'
              )}
            >
              <div className={clsx('flex h-8 w-8 items-center justify-center rounded-xl border mb-2', s.colorClass)}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] leading-none mb-1.5 truncate w-full">
                {s.label}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-[var(--text-1)] tabular-nums leading-none">
                  %{s.value}
                </span>
                <span className="text-[10px] font-bold text-[var(--text-3)] tabular-nums">
                  ({s.countLabel})
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Tab Panel Content */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-4">
        {activeSubTab === 'library' && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">
              {t('team.colContentLibrary') || 'Kütüphane İlerlemesi'}
            </h4>
            <div className="space-y-2.5">
              {trainingData.map(cat => {
                const totalInCat = cat.konular.length
                const completedInCat = cat.konular.filter(k => readTrainings.includes(k.id)).length
                const isExpanded = expandedCategory === cat.id
                const pct = totalInCat > 0 ? Math.round((completedInCat / totalInCat) * 100) : 0

                return (
                  <div key={cat.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/40 overflow-hidden">
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                      className="w-full flex items-center justify-between p-3 text-left transition hover:bg-[var(--bg-subtle)]"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">{cat.emoji}</span>
                          <span className="font-bold text-sm text-[var(--text-1)] truncate">{cat.baslik}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-brand tabular-nums">
                            %{pct} ({completedInCat}/{totalInCat})
                          </span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-[var(--text-3)] shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[var(--text-3)] shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)] px-3 py-1">
                        {cat.konular.map(konu => {
                          const isRead = readTrainings.includes(konu.id)
                          return (
                            <div key={konu.id} className="flex items-center justify-between py-2 text-xs">
                              <span className="flex items-center gap-2 min-w-0 flex-1 pr-3">
                                <span>{konu.emoji}</span>
                                <span className={clsx('font-medium truncate', isRead ? 'text-[var(--text-2)] line-through opacity-70' : 'text-[var(--text-1)]')}>
                                  {konu.baslik}
                                </span>
                              </span>
                              {isRead ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-[var(--text-3)] shrink-0" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeSubTab === 'videos' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)] mb-2">
              {t('team.colVideoTraining') || 'Video Eğitimleri'}
            </h4>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {TRAINING_VIDEOS.map(vid => {
                const prog = videoProgress[vid.key]
                const isCompleted = prog?.status === 'completed'
                const percent = prog?.watchPercent ?? 0

                return (
                  <div key={vid.key} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/40 p-3">
                    <div className="min-w-0 flex-1">
                      <p className={clsx('text-xs font-bold truncate', isCompleted ? 'text-[var(--text-2)] opacity-70' : 'text-[var(--text-1)]')}>
                        {lang === 'en' ? vid.titleEn : vid.titleTr}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[var(--text-3)] font-semibold">
                        <span>{vid.durationMin} {t('videoTraining.min') || 'dk'}</span>
                        <span>•</span>
                        <span className="capitalize">{vid.categoryTr}</span>
                      </div>
                      {percent > 0 && !isCompleted && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="h-1 w-20 overflow-hidden rounded-full bg-[var(--border)]">
                            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="text-[9px] font-black text-teal-600 dark:text-teal-400 tabular-nums">%{percent}</span>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      {isCompleted ? (
                        <span className="flex h-7 px-2.5 items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t('videoTraining.completed') || 'Tamamlandı'}
                        </span>
                      ) : percent > 0 ? (
                        <span className="flex h-7 px-2.5 items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-950/20 border border-teal-200/20 text-teal-600 dark:text-teal-400 text-[10px] font-black">
                          %{percent}
                        </span>
                      ) : (
                        <Circle className="h-4 w-4 text-[var(--text-3)]" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeSubTab === 'objections' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)] mb-2">
              {t('team.colObjectionBank') || 'İtiraz Bankası İlerlemesi'}
            </h4>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {ITIRAZLAR.map(obj => {
                const isRead = readObjections.includes(obj.id)
                return (
                  <div key={obj.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/40 p-3">
                    <div className="min-w-0 flex-1">
                      <p className={clsx('text-xs font-bold leading-tight', isRead ? 'text-[var(--text-2)] opacity-70' : 'text-[var(--text-1)]')}>
                        {obj.emoji} {lang === 'en' ? obj.soru.en : obj.soru.tr}
                      </p>
                      <p className="text-[10px] text-[var(--text-3)] mt-1 font-semibold">
                        {lang === 'en' ? obj.kategori.en : obj.kategori.tr}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {isRead ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-[var(--text-3)]" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
