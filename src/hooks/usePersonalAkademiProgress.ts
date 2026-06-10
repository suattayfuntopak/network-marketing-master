'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTrainingData } from '@/lib/domain/trainingData'
import { ITIRAZLAR } from '@/app/(dashboard)/itirazlar/data/itirazlar'
import {
  getAkademiCustomCountsAction,
  getSelfUserProgressAction,
} from '@/app/(dashboard)/egitim/akademiProgressActions'
import { useProgressSync } from '@/hooks/useProgressSync'
import { useVideoCatalog } from '@/hooks/useVideoCatalog'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { queryKeys } from '@/lib/query/keys'
import { QUERY_STALE } from '@/lib/query/staleTimes'

function pct(read: number, total: number) {
  return total > 0 ? Math.round((read / total) * 100) : 0
}

export function usePersonalAkademiProgress() {
  const { lang } = useTranslation()
  const { data: ws } = useWorkspace()
  const workspaceId = ws?.workspaceId
  const { readTrainings, readObjections, isLoading: syncLoading } = useProgressSync()
  const { data: videoData, isLoading: videoLoading, isFetched: videoFetched } = useVideoCatalog()

  const { data: progressSnapshot } = useQuery({
    queryKey: queryKeys.selfUserProgress(),
    queryFn: getSelfUserProgressAction,
    staleTime: QUERY_STALE.usage,
  })

  const { data: customCounts } = useQuery({
    queryKey: queryKeys.akademiCustomCounts(workspaceId ?? ''),
    queryFn: getAkademiCustomCountsAction,
    enabled: !!workspaceId,
    staleTime: QUERY_STALE.usage,
  })

  const contentRead = readTrainings.size > 0
    ? readTrainings.size
    : (progressSnapshot?.readTrainings.length ?? 0)

  const objectionRead = readObjections.size > 0
    ? readObjections.size
    : (progressSnapshot?.readObjections.length ?? 0)

  const customContentCount = customCounts?.training ?? 0
  const customObjectionCount = customCounts?.objection ?? 0

  const contentTotal = useMemo(() => {
    const staticCount = getTrainingData(lang).reduce((sum, cat) => sum + cat.konular.length, 0)
    return staticCount + customContentCount
  }, [lang, customContentCount])

  const objectionTotal = ITIRAZLAR.length + customObjectionCount
  const videoTotal = videoData?.summary.total ?? 0
  const videoRead = videoData?.summary.completed ?? 0

  const contentPct = pct(contentRead, contentTotal)
  const videoPct = videoData?.summary.pct ?? pct(videoRead, videoTotal)
  const objectionPct = pct(objectionRead, objectionTotal)

  const totalRead = contentRead + videoRead + objectionRead
  const totalItems = contentTotal + videoTotal + objectionTotal
  const totalPct = pct(totalRead, totalItems)

  const waitingProgress = syncLoading && readTrainings.size === 0 && !progressSnapshot
  const waitingVideo = videoLoading && !videoFetched

  return {
    content: { read: contentRead, total: contentTotal, pct: contentPct },
    video: { read: videoRead, total: videoTotal, pct: videoPct },
    objection: { read: objectionRead, total: objectionTotal, pct: objectionPct },
    totalPct,
    isLoading: waitingProgress || waitingVideo,
  }
}
