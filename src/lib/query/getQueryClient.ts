import { QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

export const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 2 * 60_000,
          gcTime: 10 * 60_000,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    })
)
