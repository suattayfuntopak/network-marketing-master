'use client'

import { useEffect, useMemo, useState } from 'react'
import { getTrainingData } from '@/lib/domain/trainingData'
import { loadCustomContent } from '@/lib/domain/customContent'
import { ITIRAZLAR } from '@/app/(dashboard)/itirazlar/data/itirazlar'
import { useProgressSync } from '@/hooks/useProgressSync'
import { useVideoCatalog } from '@/hooks/useVideoCatalog'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'

function pct(read: number, total: number) {
  return total > 0 ? Math.round((read / total) * 100) : 0
}

export function usePersonalAkademiProgress() {
  const { lang } = useTranslation()
  const { data: ws } = useWorkspace()
  const { readTrainings, readObjections, isLoading: progressLoading } = useProgressSync()
  const { data: videoData, isLoading: videoLoading } = useVideoCatalog()
  const [customContentCount, setCustomContentCount] = useState(0)
  const [customObjectionCount, setCustomObjectionCount] = useState(0)
  const [customLoading, setCustomLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!ws?.workspaceId) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setCustomLoading(false)
      return
    }
    setCustomLoading(true)
    Promise.all([
      loadCustomContent('nmm_custom_trainings', 'nmm_custom_training_v1', ws.workspaceId),
      loadCustomContent('nmm_custom_objections', 'nmm_custom_objections_v1', ws.workspaceId),
    ])
      .then(([trainings, objections]) => {
        if (cancelled) return
        setCustomContentCount(trainings.filter(it => (it as { isApproved?: boolean }).isApproved).length)
        setCustomObjectionCount(objections.filter(it => (it as { isApproved?: boolean }).isApproved).length)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCustomLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [ws?.workspaceId])

  const contentTotal = useMemo(() => {
    const staticCount = getTrainingData(lang).reduce((sum, cat) => sum + cat.konular.length, 0)
    return staticCount + customContentCount
  }, [lang, customContentCount])

  const contentRead = readTrainings.size
  const objectionTotal = ITIRAZLAR.length + customObjectionCount
  const objectionRead = readObjections.size
  const videoTotal = videoData?.summary.total ?? 0
  const videoRead = videoData?.summary.completed ?? 0

  const contentPct = pct(contentRead, contentTotal)
  const videoPct = videoData?.summary.pct ?? pct(videoRead, videoTotal)
  const objectionPct = pct(objectionRead, objectionTotal)

  const totalRead = contentRead + videoRead + objectionRead
  const totalItems = contentTotal + videoTotal + objectionTotal
  const totalPct = pct(totalRead, totalItems)

  return {
    content: { read: contentRead, total: contentTotal, pct: contentPct },
    video: { read: videoRead, total: videoTotal, pct: videoPct },
    objection: { read: objectionRead, total: objectionTotal, pct: objectionPct },
    totalPct,
    isLoading: progressLoading || videoLoading || customLoading,
  }
}
