import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { GenerateMessageRequest, GenerateMessageResponse, AIMessageVariant } from '@/lib/messages/types'

interface UseAIMessageReturn {
  generate: (req: GenerateMessageRequest) => Promise<AIMessageVariant[] | null>
  isGenerating: boolean
}

export function useAIMessage(): UseAIMessageReturn {
  const [isGenerating, setIsGenerating] = useState(false)

  const generate = async (req: GenerateMessageRequest): Promise<AIMessageVariant[] | null> => {
    if (isGenerating) return null
    setIsGenerating(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      const { data, error } = await supabase.functions.invoke('generate-message', {
        body: req,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      })

      if (error) throw error

      const response = data as GenerateMessageResponse
      return response.variants ?? null
    } catch (err) {
      console.error('[useAIMessage] generate error:', err)
      toast.error('AI mesaj üretilemedi. API anahtarını kontrol et.')
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  return { generate, isGenerating }
}
