'use client'

import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { useState } from 'react'

/**
 * localStorage'a KALICILAŞTIRILACAK sorgu kökleri — yalnızca toplulaştırılmış
 * SAYISAL metrikler (sayılar/yüzdeler). Aday/ekip listeleri PII içerdiği için
 * (KVKK) BİLEREK hariç tutulur; onlar her oturumda taze çekilir.
 *
 * Etki: Saha Özeti vb. metrik kutuları tekrar ziyarette localStorage'tan ANINDA
 * görünür, arkada sessizce tazelenir (stale-while-revalidate).
 */
const PERSISTED_KEY_ROOTS = new Set([
  'hub',
  'pano-field-insights',
  // Saf sayısal huni (arama/tanışma/sunum/yeni üye) — PII yok, İstatistikler
  // sayfası tekrar ziyarette anında dolu görünür.
  'stats-funnel-actuals',
])

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

function makePersister() {
  const storage = typeof window !== 'undefined' ? window.localStorage : noopStorage
  return createSyncStoragePersister({
    storage,
    key: 'nmm-metrics-cache',
    throttleTime: 1000,
  })
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60_000,        // 2 dk — varsayılan yenileme süresi
        gcTime: 10 * 60_000,          // 10 dk — unmount sonrası cache bellekte kalır
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }))
  const [persister] = useState(makePersister)

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000, // 24 saat
        // Yeni deploy'da eski metrik cache'ini geçersiz kıl.
        buster: process.env.NEXT_PUBLIC_BUILD_ID,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const root = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey
            return (
              query.state.status === 'success' &&
              typeof root === 'string' &&
              PERSISTED_KEY_ROOTS.has(root)
            )
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
