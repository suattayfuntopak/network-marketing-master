'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from './useWorkspace'

export interface ProgressData {
  readTrainings: string[]
  favTrainings: string[]
  readObjections: number[]
  favObjections: number[]
}

const READ_TRAINING_KEY = 'nmm_egitim_read'
const FAV_TRAINING_KEY = 'nmm_egitim_favori'
const READ_OBJECTION_KEY = 'nmm_itiraz_read'
const FAV_OBJECTION_KEY = 'nmm_itiraz_favori'

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

export function useProgressSync() {
  const { data: ws } = useWorkspace()
  const [readTrainings, setReadTrainings] = useState<Set<string>>(new Set())
  const [favTrainings, setFavTrainings] = useState<Set<string>>(new Set())
  const [readObjections, setReadObjections] = useState<Set<number>>(new Set())
  const [favObjections, setFavObjections] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const isLoadedRef = useRef(false)
  const syncRowIdRef = useRef<string | null>(null)

  // Load from local storage immediately for fast UI
  useEffect(() => {
    setReadTrainings(loadLocalSet<string>(READ_TRAINING_KEY))
    setFavTrainings(loadLocalSet<string>(FAV_TRAINING_KEY))
    setReadObjections(loadLocalSet<number>(READ_OBJECTION_KEY))
    setFavObjections(loadLocalSet<number>(FAV_OBJECTION_KEY))
  }, [])

  // Sync with Supabase once workspace is ready
  useEffect(() => {
    if (!ws?.workspaceId || isLoadedRef.current) return
    isLoadedRef.current = true

    const syncFromSupabase = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch the progress row
        const { data, error } = await supabase
          .from('nmm_daily_actions')
          .select('id, note')
          .eq('user_id', user.id)
          .is('candidate_id', null)
          .eq('action_type', 'note')
          .like('note', 'nmm_progress_v1:%')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        let remoteProgress: ProgressData = {
          readTrainings: [],
          favTrainings: [],
          readObjections: [],
          favObjections: [],
        }

        if (data && data.note) {
          syncRowIdRef.current = data.id
          try {
            const jsonStr = data.note.replace('nmm_progress_v1:', '')
            remoteProgress = JSON.parse(jsonStr)
          } catch (e) {
            console.error('Failed to parse remote progress JSON', e)
          }
        }

        // Merge local and remote
        const localReadTrainings = loadLocalSet<string>(READ_TRAINING_KEY)
        const localFavTrainings = loadLocalSet<string>(FAV_TRAINING_KEY)
        const localReadObjections = loadLocalSet<number>(READ_OBJECTION_KEY)
        const localFavObjections = loadLocalSet<number>(FAV_OBJECTION_KEY)

        // Union sets
        const mergedReadTrainings = new Set([...localReadTrainings, ...(remoteProgress.readTrainings || [])])
        const mergedFavTrainings = new Set([...localFavTrainings, ...(remoteProgress.favTrainings || [])])
        const mergedReadObjections = new Set([...localReadObjections, ...(remoteProgress.readObjections || [])])
        const mergedFavObjections = new Set([...localFavObjections, ...(remoteProgress.favObjections || [])])

        // Update states
        setReadTrainings(mergedReadTrainings)
        setFavTrainings(mergedFavTrainings)
        setReadObjections(mergedReadObjections)
        setFavObjections(mergedFavObjections)

        // Save merged sets locally
        saveLocalSet(READ_TRAINING_KEY, mergedReadTrainings)
        saveLocalSet(FAV_TRAINING_KEY, mergedFavTrainings)
        saveLocalSet(READ_OBJECTION_KEY, mergedReadObjections)
        saveLocalSet(FAV_OBJECTION_KEY, mergedFavObjections)

        // If local sets were different or there was no remote row, save back to remote
        const hasDifferences =
          localReadTrainings.size !== mergedReadTrainings.size ||
          localFavTrainings.size !== mergedFavTrainings.size ||
          localReadObjections.size !== mergedReadObjections.size ||
          localFavObjections.size !== mergedFavObjections.size ||
          !data

        if (hasDifferences) {
          await saveToSupabase(
            ws.workspaceId,
            user.id,
            mergedReadTrainings,
            mergedFavTrainings,
            mergedReadObjections,
            mergedFavObjections
          )
        }
      } catch (err) {
        console.error('Error syncing progress with Supabase:', err)
      } finally {
        setIsLoading(false)
      }
    }

    syncFromSupabase()
  }, [ws?.workspaceId])

  const saveToSupabase = async (
    workspaceId: string,
    userId: string,
    rt: Set<string>,
    ft: Set<string>,
    ro: Set<number>,
    fo: Set<number>
  ) => {
    const supabase = createClient()
    const progressObj: ProgressData = {
      readTrainings: Array.from(rt),
      favTrainings: Array.from(ft),
      readObjections: Array.from(ro),
      favObjections: Array.from(fo),
    }
    const noteContent = 'nmm_progress_v1:' + JSON.stringify(progressObj)

    if (syncRowIdRef.current) {
      await supabase
        .from('nmm_daily_actions')
        .update({ note: noteContent })
        .eq('id', syncRowIdRef.current)
    } else {
      const { data, error } = await supabase
        .from('nmm_daily_actions')
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          candidate_id: null,
          action_type: 'note',
          note: noteContent,
        })
        .select('id')
        .single()
      if (data) {
        syncRowIdRef.current = data.id
      }
    }
  }

  const handleUpdate = (
    type: 'readTraining' | 'favTraining' | 'readObjection' | 'favObjection',
    id: any,
    add: boolean
  ) => {
    const supabase = createClient()
    
    // Optimistic UI update
    let nextRT = readTrainings
    let nextFT = favTrainings
    let nextRO = readObjections
    let nextFO = favObjections

    if (type === 'readTraining') {
      nextRT = new Set(readTrainings)
      add ? nextRT.add(id) : nextRT.delete(id)
      setReadTrainings(nextRT)
      saveLocalSet(READ_TRAINING_KEY, nextRT)
    } else if (type === 'favTraining') {
      nextFT = new Set(favTrainings)
      add ? nextFT.add(id) : nextFT.delete(id)
      setFavTrainings(nextFT)
      saveLocalSet(FAV_TRAINING_KEY, nextFT)
    } else if (type === 'readObjection') {
      nextRO = new Set(readObjections)
      add ? nextRO.add(id) : nextRO.delete(id)
      setReadObjections(nextRO)
      saveLocalSet(READ_OBJECTION_KEY, nextRO)
    } else if (type === 'favObjection') {
      nextFO = new Set(favObjections)
      add ? nextFO.add(id) : nextFO.delete(id)
      setFavObjections(nextFO)
      saveLocalSet(FAV_OBJECTION_KEY, nextFO)
    }

    // Trigger async remote save
    if (ws?.workspaceId) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          saveToSupabase(ws.workspaceId, user.id, nextRT, nextFT, nextRO, nextFO)
        }
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
