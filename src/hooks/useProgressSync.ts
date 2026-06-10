'use client'

import { useEffect, useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { recordProgressChangeAction } from '@/app/(dashboard)/pulse/learningEvents'
import {
  getFullSelfUserProgressAction,
  upsertSelfUserProgressAction,
  type FullUserProgressSnapshot,
} from '@/app/(dashboard)/egitim/akademiProgressActions'
import { useWorkspace } from './useWorkspace'
import { queryKeys } from '@/lib/query/keys'
import { QUERY_STALE } from '@/lib/query/staleTimes'

export interface ProgressData {
  readTrainings: string[]
  favTrainings: string[]
  readObjections: number[]
  favObjections: number[]
}

const BASE = {
  readTraining: 'nmm_egitim_read',
  favTraining: 'nmm_egitim_favori',
  readObjection: 'nmm_itiraz_read',
  favObjection: 'nmm_itiraz_favori',
} as const

const LEGACY_KEYS = Object.values(BASE)

function scopedKey(base: string, userId: string): string {
  return `${base}_${userId}`
}

function loadLocalSet<T>(key: string): Set<T> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(key)
    return raw ? new Set(JSON.parse(raw) as T[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveLocalSet<T>(key: string, set: Set<T>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(Array.from(set)))
}

function snapshotFromSets(
  rt: Set<string>,
  ft: Set<string>,
  ro: Set<number>,
  fo: Set<number>,
): FullUserProgressSnapshot {
  return {
    readTrainings: Array.from(rt),
    favTrainings: Array.from(ft),
    readObjections: Array.from(ro),
    favObjections: Array.from(fo),
  }
}

export function useProgressSync() {
  const queryClient = useQueryClient()
  const { data: ws } = useWorkspace()
  const userId = ws?.userId
  const [readTrainings, setReadTrainings] = useState<Set<string>>(new Set())
  const [favTrainings, setFavTrainings] = useState<Set<string>>(new Set())
  const [readObjections, setReadObjections] = useState<Set<number>>(new Set())
  const [favObjections, setFavObjections] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const loadedForRef = useRef<string | null>(null)
  const lastMergedAtRef = useRef(0)

  const { data: remoteProgress, dataUpdatedAt } = useQuery({
    queryKey: queryKeys.selfUserProgress(),
    queryFn: getFullSelfUserProgressAction,
    enabled: !!userId && !!ws?.workspaceId,
    staleTime: QUERY_STALE.usage,
  })

  useEffect(() => {
    if (!userId || !ws?.workspaceId) return
    if (loadedForRef.current === userId) return
    loadedForRef.current = userId
    lastMergedAtRef.current = 0

    if (typeof window !== 'undefined') {
      for (const lk of LEGACY_KEYS) localStorage.removeItem(lk)
    }

    const localRT = loadLocalSet<string>(scopedKey(BASE.readTraining, userId))
    const localFT = loadLocalSet<string>(scopedKey(BASE.favTraining, userId))
    const localRO = loadLocalSet<number>(scopedKey(BASE.readObjection, userId))
    const localFO = loadLocalSet<number>(scopedKey(BASE.favObjection, userId))
    setReadTrainings(localRT)
    setFavTrainings(localFT)
    setReadObjections(localRO)
    setFavObjections(localFO)
    setIsLoading(false)
  }, [userId, ws?.workspaceId])

  useEffect(() => {
    if (!userId || !ws?.workspaceId || !remoteProgress) return
    if (lastMergedAtRef.current === dataUpdatedAt) return
    lastMergedAtRef.current = dataUpdatedAt

    const localRT = loadLocalSet<string>(scopedKey(BASE.readTraining, userId))
    const localFT = loadLocalSet<string>(scopedKey(BASE.favTraining, userId))
    const localRO = loadLocalSet<number>(scopedKey(BASE.readObjection, userId))
    const localFO = loadLocalSet<number>(scopedKey(BASE.favObjection, userId))

    const mergedRT = new Set([...localRT, ...(remoteProgress.readTrainings || [])])
    const mergedFT = new Set([...localFT, ...(remoteProgress.favTrainings || [])])
    const mergedRO = new Set([...localRO, ...(remoteProgress.readObjections || [])])
    const mergedFO = new Set([...localFO, ...(remoteProgress.favObjections || [])])

    setReadTrainings(mergedRT)
    setFavTrainings(mergedFT)
    setReadObjections(mergedRO)
    setFavObjections(mergedFO)

    saveLocalSet(scopedKey(BASE.readTraining, userId), mergedRT)
    saveLocalSet(scopedKey(BASE.favTraining, userId), mergedFT)
    saveLocalSet(scopedKey(BASE.readObjection, userId), mergedRO)
    saveLocalSet(scopedKey(BASE.favObjection, userId), mergedFO)

    const hasDifferences =
      localRT.size !== mergedRT.size ||
      localFT.size !== mergedFT.size ||
      localRO.size !== mergedRO.size ||
      localFO.size !== mergedFO.size

    if (hasDifferences) {
      void upsertSelfUserProgressAction(
        ws.workspaceId,
        snapshotFromSets(mergedRT, mergedFT, mergedRO, mergedFO),
      )
    }
  }, [remoteProgress, dataUpdatedAt, userId, ws?.workspaceId])

  const handleUpdate = (
    type: 'readTraining' | 'favTraining' | 'readObjection' | 'favObjection',
    id: string | number,
    add: boolean,
  ) => {
    if (type === 'readTraining' || type === 'favTraining') {
      const cur = type === 'readTraining' ? readTrainings : favTrainings
      const next = new Set(cur)
      if (add) next.add(id as string)
      else next.delete(id as string)
      if (type === 'readTraining') setReadTrainings(next)
      else setFavTrainings(next)
      if (userId) saveLocalSet(scopedKey(BASE[type], userId), next)
    } else {
      const cur = type === 'readObjection' ? readObjections : favObjections
      const next = new Set(cur)
      if (add) next.add(id as number)
      else next.delete(id as number)
      if (type === 'readObjection') setReadObjections(next)
      else setFavObjections(next)
      if (userId) saveLocalSet(scopedKey(BASE[type], userId), next)
    }

    if (ws?.workspaceId) {
      recordProgressChangeAction(ws.workspaceId, type, id, add)
        .then(() => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.selfUserProgress() })
        })
        .catch(err => {
          console.error('Progress sync failed:', err)
        })
    }
  }

  return {
    readTrainings,
    favTrainings,
    readObjections,
    favObjections,
    isLoading,
    toggleTrainingRead: (id: string) => handleUpdate('readTraining', id, !readTrainings.has(id)),
    toggleTrainingFav: (id: string) => handleUpdate('favTraining', id, !favTrainings.has(id)),
    toggleObjectionRead: (id: number) => handleUpdate('readObjection', id, !readObjections.has(id)),
    toggleObjectionFav: (id: number) => handleUpdate('favObjection', id, !favObjections.has(id)),
  }
}
