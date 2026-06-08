'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordProgressChangeAction } from '@/app/(dashboard)/pulse/learningEvents'
import { useWorkspace } from './useWorkspace'

export interface ProgressData {
  readTrainings: string[]
  favTrainings: string[]
  readObjections: number[]
  favObjections: number[]
}

// localStorage anahtar tabanları. DİKKAT: gerçek anahtar her zaman userId ile
// izole edilir (`<base>_<userId>`) — aksi halde aynı tarayıcıda kullanıcı değişince
// önceki kullanıcının favori/okumaları sızar ve yanlış kişiye yazılır.
const BASE = {
  readTraining: 'nmm_egitim_read',
  favTraining: 'nmm_egitim_favori',
  readObjection: 'nmm_itiraz_read',
  favObjection: 'nmm_itiraz_favori',
} as const

/** Eski (userId'siz) global anahtarlar — kullanıcılar arası sızıntı kaynağıydı, temizlenir. */
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

export function useProgressSync() {
  const { data: ws } = useWorkspace()
  const userId = ws?.userId
  const [readTrainings, setReadTrainings] = useState<Set<string>>(new Set())
  const [favTrainings, setFavTrainings] = useState<Set<string>>(new Set())
  const [readObjections, setReadObjections] = useState<Set<number>>(new Set())
  const [favObjections, setFavObjections] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const loadedForRef = useRef<string | null>(null)

  const saveToSupabase = async (
    workspaceId: string,
    uid: string,
    rt: Set<string>,
    ft: Set<string>,
    ro: Set<number>,
    fo: Set<number>
  ) => {
    const supabase = createClient()
    await supabase.from('nmm_user_progress').upsert(
      {
        user_id: uid,
        workspace_id: workspaceId,
        read_trainings: Array.from(rt),
        fav_trainings: Array.from(ft),
        read_objections: Array.from(ro),
        fav_objections: Array.from(fo),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
  }

  // Kullanıcı (userId) belli olunca: önce userId-izole local cache, sonra Supabase.
  useEffect(() => {
    if (!userId || !ws?.workspaceId) return
    if (loadedForRef.current === userId) return
    loadedForRef.current = userId

    // Eski global anahtarları bir defa temizle (sızıntı kaynağıydı).
    if (typeof window !== 'undefined') {
      for (const lk of LEGACY_KEYS) localStorage.removeItem(lk)
    }

    // Hızlı UI için kullanıcıya özel local cache.
    const localRT = loadLocalSet<string>(scopedKey(BASE.readTraining, userId))
    const localFT = loadLocalSet<string>(scopedKey(BASE.favTraining, userId))
    const localRO = loadLocalSet<number>(scopedKey(BASE.readObjection, userId))
    const localFO = loadLocalSet<number>(scopedKey(BASE.favObjection, userId))
    setReadTrainings(localRT)
    setFavTrainings(localFT)
    setReadObjections(localRO)
    setFavObjections(localFO)

    const syncFromSupabase = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const { data } = await supabase
          .from('nmm_user_progress')
          .select('read_trainings, fav_trainings, read_objections, fav_objections')
          .eq('user_id', user.id)
          .maybeSingle()

        let remoteProgress: ProgressData = {
          readTrainings: [],
          favTrainings: [],
          readObjections: [],
          favObjections: [],
        }

        if (data) {
          remoteProgress = {
            readTrainings: (data.read_trainings as string[]) ?? [],
            favTrainings: (data.fav_trainings as string[]) ?? [],
            readObjections: (data.read_objections as number[]) ?? [],
            favObjections: (data.fav_objections as number[]) ?? [],
          }
        } else {
          // Tek seferlik legacy göç (nmm_daily_actions) — yine user.id'ye özel.
          const { data: legacy } = await supabase
            .from('nmm_daily_actions')
            .select('note')
            .eq('user_id', user.id)
            .is('candidate_id', null)
            .eq('action_type', 'note')
            .like('note', 'nmm_progress_v1:%')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (legacy?.note) {
            try {
              remoteProgress = JSON.parse(legacy.note.replace('nmm_progress_v1:', ''))
            } catch (e) {
              console.error('Failed to parse legacy progress JSON', e)
            }
          }
        }

        // Merge — local + remote AYNI kullanıcıya ait olduğu için güvenli (offline düzenlemeler korunur).
        const mergedRT = new Set([...localRT, ...(remoteProgress.readTrainings || [])])
        const mergedFT = new Set([...localFT, ...(remoteProgress.favTrainings || [])])
        const mergedRO = new Set([...localRO, ...(remoteProgress.readObjections || [])])
        const mergedFO = new Set([...localFO, ...(remoteProgress.favObjections || [])])

        setReadTrainings(mergedRT)
        setFavTrainings(mergedFT)
        setReadObjections(mergedRO)
        setFavObjections(mergedFO)

        saveLocalSet(scopedKey(BASE.readTraining, user.id), mergedRT)
        saveLocalSet(scopedKey(BASE.favTraining, user.id), mergedFT)
        saveLocalSet(scopedKey(BASE.readObjection, user.id), mergedRO)
        saveLocalSet(scopedKey(BASE.favObjection, user.id), mergedFO)

        const hasDifferences =
          localRT.size !== mergedRT.size ||
          localFT.size !== mergedFT.size ||
          localRO.size !== mergedRO.size ||
          localFO.size !== mergedFO.size ||
          !data

        if (hasDifferences) {
          await saveToSupabase(ws.workspaceId, user.id, mergedRT, mergedFT, mergedRO, mergedFO)
        }
      } catch (err) {
        console.error('Error syncing progress with Supabase:', err)
      } finally {
        setIsLoading(false)
      }
    }

    syncFromSupabase()
  }, [userId, ws?.workspaceId])

  const handleUpdate = (
    type: 'readTraining' | 'favTraining' | 'readObjection' | 'favObjection',
    id: string | number,
    add: boolean
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
      recordProgressChangeAction(ws.workspaceId, type, id, add).catch(err => {
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
