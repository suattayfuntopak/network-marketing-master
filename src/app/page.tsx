'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/sifre-guncelle')
        return
      }
      if (session) {
        router.push('/bugun')
      } else {
        router.push('/giris')
      }
    })

    // Anlık session kontrolü (hash olmayan durumlar için)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/bugun')
      } else {
        // Hash fragment yoksa girise at (onAuthStateChange halleder gerisi)
        const hasHash = window.location.hash.includes('access_token')
        if (!hasHash) router.push('/giris')
      }
    })
  }, [router])

  return null
}
